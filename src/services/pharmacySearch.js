// Pharmacy Search & Multi-Tier Availability Engine
// Ranks results strictly based on:
// 1. Complete prescription match (all medicines available)
// 2. Freshness of availability confirmation
// 3. Proximity / Distance

import { db } from './db.js';
import { DEFAULT_USER_LOCATION } from '../data/mockData.js';

export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Calcul de distance par la route réelle (Itinéraire routier GPS via OSRM)
const roadDistanceCache = new Map();

export async function calculateRoadDistance(lat1, lon1, lat2, lon2) {
  const cacheKey = `${Number(lat1).toFixed(4)},${Number(lon1).toFixed(4)}_${Number(lat2).toFixed(4)},${Number(lon2).toFixed(4)}`;
  if (roadDistanceCache.has(cacheKey)) {
    return roadDistanceCache.get(cacheKey);
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const meters = data.routes[0].distance;
        const durationSec = data.routes[0].duration;
        const distKm = Math.round((meters / 1000) * 10) / 10;
        const durationMin = Math.max(1, Math.round(durationSec / 60));
        const result = {
          distanceKm: distKm,
          durationMin,
          formattedDistance: formatDistance(distKm),
          travelTimeText: `${durationMin} min`
        };
        roadDistanceCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    // Mode dégradé si réseau OSRM inaccessible
  }

  // Facteur de détour moyen par le réseau routier de Dakar (1.25x vol d'oiseau)
  const straight = calculateDistanceKm(lat1, lon1, lat2, lon2);
  const roadEst = Math.round(straight * 1.25 * 10) / 10;
  const durationEst = Math.max(2, Math.round(roadEst * 2.5));
  const fallbackResult = {
    distanceKm: roadEst,
    durationMin: durationEst,
    formattedDistance: formatDistance(roadEst),
    travelTimeText: `${durationEst} min`
  };
  roadDistanceCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}

export function formatDistance(distKm) {
  if (distKm === undefined || distKm === null || isNaN(distKm)) return '';
  const num = Number(distKm);
  if (num < 1) {
    return `${Math.round(num * 1000)} m`;
  }
  const rounded = Math.round(num * 10) / 10;
  return `${rounded.toString().replace('.', ',')} km`;
}

export function findNearbyPharmacies(userLocation = DEFAULT_USER_LOCATION) {
  const pharmacies = db.getPharmacies();
  return pharmacies
    .map((pharmacy) => {
      const dist = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        pharmacy.latitude,
        pharmacy.longitude
      );
      return {
        ...pharmacy,
        distanceKm: dist,
        calculatedDistanceKm: dist,
        formattedDistance: formatDistance(dist)
      };
    })
    .sort((a, b) => a.calculatedDistanceKm - b.calculatedDistanceKm);
}

export function checkAvailability(medicines, pharmacies, options = {}) {
  const { autoTriggerRequests = false, prescriptionId } = options;
  const requests = db.getRequests();

  const results = pharmacies.map((pharmacy) => {
    let availableCount = 0;
    let unavailableCount = 0;
    let unknownCount = 0;
    let latestConfirmationTime = 0;

    const medicineBreakdown = medicines.map((med) => {
      // Step 1: Check known stock directly in database
      const stockInfo = db.getMedicineAvailability(pharmacy.id, med.name, med.dosage);

      // Check if there is an active stock update or request for this pharmacy
      const activeReq = requests.find(
        (r) =>
          r.pharmacyId === pharmacy.id &&
          r.medicineName.toLowerCase() === med.name.toLowerCase()
      );

      let status = stockInfo.availability; // 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN'
      let updatedTime = stockInfo.lastUpdated;

      if (activeReq) {
        if (activeReq.status === 'AVAILABLE') {
          status = 'AVAILABLE';
          updatedTime = activeReq.respondedAt || activeReq.createdAt;
        } else if (activeReq.status === 'UNAVAILABLE') {
          status = 'UNAVAILABLE';
          updatedTime = activeReq.respondedAt || activeReq.createdAt;
        }
      }

      // If status is unknown, consider unavailable from database
      if (status === 'UNKNOWN') {
        if (autoTriggerRequests) {
          db.createAvailabilityRequest({
            pharmacyId: pharmacy.id,
            medicineName: med.name,
            dosage: med.dosage,
            prescriptionId: prescriptionId || `presc_${Date.now()}`,
            patientZone: 'Keur Massar',
            patientDistance: pharmacy.formattedDistance
          });
          status = 'PENDING_REQUEST';
          updatedTime = Date.now();
        } else {
          status = 'UNAVAILABLE';
        }
      }

      if (status === 'AVAILABLE') availableCount++;
      else if (status === 'UNAVAILABLE') unavailableCount++;
      else unknownCount++;

      if (updatedTime && updatedTime > latestConfirmationTime) {
        latestConfirmationTime = updatedTime;
      }

      return {
        name: med.name,
        dosage: med.dosage,
        status,
        lastUpdated: updatedTime
      };
    });

    const isComplete = availableCount === medicines.length;
    const isPartial = availableCount > 0 && availableCount < medicines.length;

    return {
      pharmacy,
      medicinesBreakdown: medicineBreakdown,
      totalRequested: medicines.length,
      availableCount,
      unavailableCount,
      unknownCount,
      isComplete,
      isPartial,
      latestConfirmationTime,
      confirmationText: formatConfirmationTime(latestConfirmationTime)
    };
  });

  // Ranking Logic:
  // 1. Complete prescription first
  // 2. Fresh confirmation timestamp
  // 3. Proximity (distance)
  return results.sort((a, b) => {
    // 1. Completeness
    if (a.isComplete && !b.isComplete) return -1;
    if (!a.isComplete && b.isComplete) return 1;

    // Number of available meds
    if (a.availableCount !== b.availableCount) {
      return b.availableCount - a.availableCount;
    }

    // 2. Freshness of availability
    if (Math.abs(a.latestConfirmationTime - b.latestConfirmationTime) > 30 * 60 * 1000) {
      return b.latestConfirmationTime - a.latestConfirmationTime;
    }

    // 3. Distance
    return a.pharmacy.calculatedDistanceKm - b.pharmacy.calculatedDistanceKm;
  });
}

function formatConfirmationTime(timestamp) {
  if (!timestamp) return 'Vérifié en base';
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);

  if (diffMinutes < 1) return "Mis à jour à l'instant";
  if (diffMinutes < 60) return `Mis à jour il y a ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Mis à jour il y a ${diffHours} h`;
  return 'Stock synchronisé';
}
