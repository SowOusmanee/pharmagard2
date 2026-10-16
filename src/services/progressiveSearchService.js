// Service d'envoi par rayon progressif des demandes d'ordonnances
// Spécifications :
// - Paliers : 500 m (2 min), 1,5 km (2 min), 3 km (3 min), 6 km, puis « Aucune pharmacie n’a répondu »
// - Formule de Haversine pour classer les pharmacies de garde et ouvertes
// - Si aucune pharmacie de garde n'est dans le rayon, passer immédiatement au palier suivant
// - À chaque élargissement, n'envoyer qu'aux pharmacies qui n'ont pas déjà reçu la demande
// - Dès qu'une pharmacie répond « Disponible », l'élargissement s'arrête (sauf demande patient)
// - Affichage des états : « Recherche dans un rayon de 500 m… », « Élargissement à 1,5 km… », etc.

import { db } from './db.js';
import { calculateDistanceKm } from './pharmacySearch.js';
import { DEFAULT_USER_LOCATION } from '../data/mockData.js';

export const PROGRESSIVE_STAGES = [
  { index: 0, radiusKm: 0.5, label: '500 m', durationSeconds: 120, statusText: 'Recherche dans un rayon de 500 m…' },
  { index: 1, radiusKm: 1.5, label: '1,5 km', durationSeconds: 120, statusText: 'Élargissement à 1,5 km…' },
  { index: 2, radiusKm: 3.0, label: '3 km', durationSeconds: 180, statusText: 'Élargissement à 3 km…' },
  { index: 3, radiusKm: 6.0, label: '6 km', durationSeconds: 180, statusText: 'Élargissement à 6 km…' }
];

class ProgressiveSearchEngine {
  constructor() {
    this.currentSearch = null;
    this.timer = null;
    this.listeners = new Set();
    this.dbUnsubscribe = null;

    // Écoute les réponses des pharmacies en temps réel
    this.setupDbListener();
  }

  setupDbListener() {
    if (this.dbUnsubscribe) return;
    this.dbUnsubscribe = db.subscribe((event) => {
      if (event.type === 'REQUEST_RESPONDED' && event.status === 'AVAILABLE') {
        if (this.currentSearch && this.currentSearch.prescriptionId === event.request.prescriptionId) {
          // Dès qu'une pharmacie répond « Disponible », l'élargissement s'arrête
          this.handleAvailableResponse(event.request);
        }
      }
    });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    if (this.currentSearch) {
      callback(this.getState());
    }
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(state);
      } catch (e) {
        console.error('Error in progressiveSearch listener:', e);
      }
    });
  }

  getState() {
    if (!this.currentSearch) {
      return {
        isActive: false,
        stageIndex: 0,
        statusText: '',
        currentRadiusLabel: '',
        dispatchedCount: 0,
        hasAvailableResponse: false,
        noResponse: false
      };
    }

    const { stageIndex, statusText, dispatchedPharmacyIds, hasAvailableResponse, noResponse } = this.currentSearch;
    const stage = PROGRESSIVE_STAGES[stageIndex] || PROGRESSIVE_STAGES[PROGRESSIVE_STAGES.length - 1];

    return {
      isActive: this.currentSearch.isActive,
      stageIndex,
      statusText,
      currentRadiusLabel: stage.label,
      dispatchedCount: dispatchedPharmacyIds.size,
      hasAvailableResponse,
      noResponse
    };
  }

  // Démarre la recherche progressive
  startSearch({
    medicines = [],
    prescriptionId = null,
    prescriptionPhoto = null,
    userLocation = DEFAULT_USER_LOCATION
  }) {
    const actualPrescriptionId = prescriptionId || `presc_${Date.now()}`;

    // Si une recherche pour cette même ordonnance est déjà en cours, ne pas recréer de doublon
    if (this.currentSearch && this.currentSearch.prescriptionId === actualPrescriptionId) {
      return actualPrescriptionId;
    }

    this.stopSearch();

    // Récupérer et classer les pharmacies de garde et ouvertes par distance Haversine
    const allPharmacies = db.getPharmacies();
    const dutyPharmacies = allPharmacies
      .filter((p) => p.isDuty24h || p.isDuty || p.duty || p.status === 'DUTY_24H')
      .map((p) => {
        const dist = calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          p.latitude,
          p.longitude
        );
        return {
          ...p,
          calculatedDistanceKm: dist
        };
      })
      .sort((a, b) => a.calculatedDistanceKm - b.calculatedDistanceKm);

    this.currentSearch = {
      prescriptionId: actualPrescriptionId,
      medicines,
      prescriptionPhoto,
      userLocation,
      dutyPharmacies,
      stageIndex: 0,
      dispatchedPharmacyIds: new Set(),
      statusText: PROGRESSIVE_STAGES[0].statusText,
      isActive: true,
      hasAvailableResponse: false,
      noResponse: false
    };

    this.executeStage(0);
    this.notify();
    return actualPrescriptionId;
  }

  executeStage(stageIndex) {
    if (!this.currentSearch || !this.currentSearch.isActive) return;

    if (stageIndex >= PROGRESSIVE_STAGES.length) {
      // Tous les paliers passés sans réponse
      this.currentSearch.isActive = false;
      this.currentSearch.noResponse = true;
      this.currentSearch.statusText = 'Aucune pharmacie n’a répondu';
      this.notify();
      return;
    }

    const stage = PROGRESSIVE_STAGES[stageIndex];
    this.currentSearch.stageIndex = stageIndex;
    this.currentSearch.statusText = stage.statusText;

    // Trouver les pharmacies de garde dans ce rayon
    const pharmaciesInRadius = this.currentSearch.dutyPharmacies.filter(
      (p) => p.calculatedDistanceKm <= stage.radiusKm
    );

    // Règle : Si aucune pharmacie de garde n’est dans ce rayon, passer tout de suite au palier suivant
    if (pharmaciesInRadius.length === 0) {
      this.executeStage(stageIndex + 1);
      return;
    }

    // À chaque élargissement, n'envoyer qu'aux pharmacies qui n'ont pas déjà reçu la demande
    const newPharmacies = pharmaciesInRadius.filter(
      (p) => !this.currentSearch.dispatchedPharmacyIds.has(p.id)
    );

    if (newPharmacies.length > 0) {
      newPharmacies.forEach((pharmacy) => {
        this.currentSearch.dispatchedPharmacyIds.add(pharmacy.id);

        // Envoyer la demande à l'officine pour chaque médicament
        this.currentSearch.medicines.forEach((med) => {
          db.createAvailabilityRequest({
            pharmacyId: pharmacy.id,
            medicineName: med.name,
            dosage: med.dosage || '',
            prescriptionId: this.currentSearch.prescriptionId,
            prescriptionPhoto: this.currentSearch.prescriptionPhoto,
            medicinesList: this.currentSearch.medicines,
            patientZone: pharmacy.zone || 'Keur Massar',
            patientDistance: `${pharmacy.calculatedDistanceKm} km`
          });
        });
      });
    }

    this.notify();

    // Si nous sommes au dernier palier (6 km), on programme la fin après le délai
    const durationMs = (stage.durationSeconds || 120) * 1000;
    if (this.timer) clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      if (this.currentSearch && this.currentSearch.isActive && !this.currentSearch.hasAvailableResponse) {
        this.executeStage(stageIndex + 1);
      }
    }, durationMs);
  }

  // Dès qu'une pharmacie répond « Disponible », l'élargissement s'arrête
  handleAvailableResponse(request) {
    if (!this.currentSearch) return;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.currentSearch.hasAvailableResponse = true;
    this.currentSearch.isActive = false;
    this.currentSearch.statusText = `Pharmacie disponible trouvée dans le rayon de ${PROGRESSIVE_STAGES[this.currentSearch.stageIndex].label} !`;
    this.notify();
  }

  // Si le patient demande à voir plus d'options
  expandToMoreOptions() {
    if (!this.currentSearch) return;
    const nextIndex = this.currentSearch.stageIndex + 1;
    if (nextIndex < PROGRESSIVE_STAGES.length) {
      this.currentSearch.isActive = true;
      this.currentSearch.hasAvailableResponse = false;
      this.currentSearch.noResponse = false;
      this.executeStage(nextIndex);
    }
  }

  stopSearch() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.currentSearch) {
      this.currentSearch.isActive = false;
    }
    this.notify();
  }
}

export const progressiveSearchService = new ProgressiveSearchEngine();
