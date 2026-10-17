// Reactive In-Memory & LocalStorage Database Abstraction
// Supports multi-tab BroadcastChannel & live event listeners for real-time synchronization

import {
  INITIAL_PHARMACIES,
  INITIAL_MEDICINES,
  INITIAL_STOCK,
  DEFAULT_USER_LOCATION
} from '../data/mockData.js';

const STORAGE_KEYS = {
  PHARMACIES: 'pharmagarde_pharmacies',
  MEDICINES: 'pharmagarde_medicines',
  STOCK: 'pharmagarde_stock',
  REQUESTS: 'pharmagarde_requests',
  PRESCRIPTIONS: 'pharmagarde_prescriptions',
  USER: 'pharmagarde_current_user',
  PHARMACY_SESSION: 'pharmagarde_active_pharmacy',
  NOTIFICATIONS: 'pharmagarde_notifications'
};

export const SAMPLE_PRESCRIPTION_PHOTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640"><rect width="480" height="640" fill="%23FFFFFF" rx="20"/><rect x="28" y="28" width="76" height="76" rx="14" fill="%23E6F7F4"/><text x="50" y="74" font-size="36" font-family="system-ui,sans-serif" font-weight="900" fill="%23005F56">Rx</text><text x="120" y="52" font-size="18" font-family="system-ui,sans-serif" font-weight="bold" fill="%23005F56">DR. MAMADOU SALL</text><text x="120" y="74" font-size="13" font-family="system-ui,sans-serif" fill="%2364748B">Médecin Généraliste · Dakar</text><text x="120" y="92" font-size="12" font-family="system-ui,sans-serif" fill="%2394A3B8">Tél: +221 33 824 00 00</text><line x1="28" y1="120" x2="452" y2="120" stroke="%23CBD5E1" stroke-width="2"/><text x="28" y="160" font-size="14" font-family="system-ui,sans-serif" font-weight="800" fill="%23334155" letter-spacing="1">ORDONNANCE MÉDICALE</text><text x="28" y="184" font-size="12" font-family="system-ui,sans-serif" fill="%2364748B">Patient: M. Diallo · Date: Aujourd%27hui</text><rect x="28" y="210" width="424" height="76" rx="12" fill="%23F8FAFC" stroke="%23E2E8F0"/><text x="44" y="242" font-size="16" font-family="system-ui,sans-serif" font-weight="bold" fill="%230F172A">1. Amoxicilline 1g</text><text x="44" y="266" font-size="13" font-family="system-ui,sans-serif" fill="%23475569">1 comprimé matin et soir pendant 6 jours</text><rect x="28" y="302" width="424" height="76" rx="12" fill="%23F8FAFC" stroke="%23E2E8F0"/><text x="44" y="334" font-size="16" font-family="system-ui,sans-serif" font-weight="bold" fill="%230F172A">2. Paracétamol 1g</text><text x="44" y="358" font-size="13" font-family="system-ui,sans-serif" fill="%23475569">1 comprimé toutes les 8h si douleur</text><line x1="28" y1="420" x2="452" y2="420" stroke="%23E2E8F0" stroke-width="1.5"/><rect x="260" y="450" width="180" height="90" rx="12" fill="%23F1F5F9" stroke="%23CBD5E1" stroke-dasharray="4,4"/><text x="285" y="488" font-size="12" font-family="system-ui,sans-serif" font-weight="bold" fill="%23475569">CACHE ET SIGNATURE</text><path d="M 290 515 Q 330 495 370 525 T 410 510" fill="none" stroke="%23005F56" stroke-width="2.5"/></svg>';

// Safe memory storage fallback
const memoryStorage = new Map();
const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    } catch {}
    return memoryStorage.get(key) || null;
  },
  setItem: (key, val) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val);
        return;
      }
    } catch {}
    memoryStorage.set(key, val);
  },
  removeItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    } catch {}
    memoryStorage.delete(key);
  }
};

// Sauvegarde des demandes en tenant compte de la limite du navigateur (~5 Mo).
// Les photos d'ordonnance sont lourdes : si la sauvegarde échoue, on retire d'abord les photos
// des anciennes ordonnances, puis toutes les photos, pour que la demande arrive quand même.
const MAX_STORED_REQUESTS = 100;

function saveRequests(requests) {
  const tryWrite = (list) => {
    try {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  };
  if (typeof localStorage === 'undefined') {
    safeStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    return;
  }
  let list = requests.slice(0, MAX_STORED_REQUESTS);
  if (tryWrite(list)) return;

  const latestPrescription = list[0]?.prescriptionId;
  list = list.map((r) => (r.prescriptionId === latestPrescription ? r : { ...r, prescriptionPhoto: null }));
  if (tryWrite(list)) return;

  list = list.map((r) => ({ ...r, prescriptionPhoto: null }));
  if (tryWrite(list)) return;

  console.warn('Stockage plein : demandes conservées en mémoire uniquement');
  safeStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(list));
}

// Cloud pub/sub topic for cross-device real-time sync (between 2 phones)
const CLOUD_SYNC_TOPIC = 'https://ntfy.sh/pharmagarde_keurmassar_live';
// Le relais local /api/sync/events n'existe qu'avec le serveur de développement (npm run dev)
const USE_LOCAL_SYNC = Boolean(import.meta.env?.DEV);
const CLOUD_EVENT_TYPES = new Set(['REQUEST_CREATED', 'REQUEST_RESPONDED', 'REQUEST_SERVED', 'STOCK_UPDATED']);

// Cross-tab broadcast channel for real-time sync (same device)
const broadcastChannel = typeof window !== 'undefined' && window.BroadcastChannel
  ? new BroadcastChannel('pharmagarde_channel')
  : null;

class DatabaseService {
  constructor() {
    this.clientId = 'pg_dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    this.listeners = new Set();
    this.initDatabase();

    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        this.notifyLocalListeners(event.data);
      };
    }

    this.initCloudSync();
  }

  initCloudSync() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    try {
      // Connect to local Vite real-time sync endpoint first
      const localSseUrl = USE_LOCAL_SYNC ? '/api/sync/events' : `${CLOUD_SYNC_TOPIC}/sse`;
      this.cloudFallbackActive = !USE_LOCAL_SYNC;
      this.eventSource = new EventSource(localSseUrl);

      const handleIncomingMessage = (e) => {
        try {
          const raw = JSON.parse(e.data);
          let event = null;
          if (raw.event === 'message' && raw.message) {
            // ntfy wrapped format
            event = typeof raw.message === 'string' ? JSON.parse(raw.message) : raw.message;
          } else if (raw.type) {
            // Direct SSE event format
            event = raw;
          }
          if (!event || !event.type || event.senderId === this.clientId) return;

          // Messages regroupés (voir flushCloudQueue)
          if (event.type === 'BATCH' && Array.isArray(event.events)) {
            event.events.forEach((ev) => ev?.type && this.handleRemoteCloudEvent(ev));
            return;
          }
          this.handleRemoteCloudEvent(event);
        } catch {}
      };

      this.eventSource.onmessage = handleIncomingMessage;

      this.eventSource.onerror = () => {
        // Si le serveur local SSE n'est pas actif (ex: déploiement distant), fallback vers le cloud
        if (!this.cloudFallbackActive) {
          this.cloudFallbackActive = true;
          try {
            this.eventSource.close();
            this.eventSource = new EventSource(`${CLOUD_SYNC_TOPIC}/sse`);
            this.eventSource.onmessage = handleIncomingMessage;
          } catch {}
        }
      };
    } catch (err) {
      console.warn('PharmaGarde Sync initialization failed:', err);
    }
  }

  handleRemoteCloudEvent(event) {
    if (!event || !event.type) return;

    if (event.type === 'REQUEST_CREATED' && event.request) {
      const requests = this.getRequests();
      const exists = requests.some((r) => r.requestId === event.request.requestId);
      if (!exists) {
        requests.unshift(event.request);
        saveRequests(requests);
      }
    } else if (event.type === 'REQUEST_RESPONDED' && event.request) {
      const requests = this.getRequests();
      const index = requests.findIndex((r) => r.requestId === event.request.requestId);
      if (index !== -1) {
        requests[index] = { ...requests[index], ...event.request, status: event.status };
        saveRequests(requests);
      }
      if (event.request.pharmacyId && event.request.medicineId) {
        this.updateStockAvailability(event.request.pharmacyId, event.request.medicineId, event.status);
      }
    } else if (event.type === 'REQUEST_SERVED') {
      const requests = this.getRequests();
      const index = requests.findIndex((r) => r.requestId === event.requestId);
      if (index !== -1) {
        requests[index].status = 'SERVED';
        requests[index].servedAt = Date.now();
        requests[index].isReserved = false;
        saveRequests(requests);
      }
    } else if (event.type === 'STOCK_UPDATED') {
      const stock = this.getStock();
      const item = stock.find((s) => s.pharmacyId === event.pharmacyId && s.medicineId === event.medicineId);
      if (item) {
        item.availability = event.availability;
        item.lastUpdated = Date.now();
        safeStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
      }
    }

    this.notifyLocalListeners(event);
  }

  initDatabase() {
    const existingPharms = safeStorage.getItem(STORAGE_KEYS.PHARMACIES);
    const DB_VERSION_KEY = 'pharmagarde_db_version';
    const CURRENT_VERSION = 'v6_pharmacie_test_zoom';
    const currentVer = safeStorage.getItem(DB_VERSION_KEY);

    const isCorrupted = !existingPharms || 
      currentVer !== CURRENT_VERSION ||
      existingPharms.includes('pharmacy_maya') || 
      !existingPharms.includes('pharmacy_test') || 
      !existingPharms.includes('Cité Aïnoumady');

    if (isCorrupted) {
      safeStorage.setItem(STORAGE_KEYS.PHARMACIES, JSON.stringify(INITIAL_PHARMACIES));
      safeStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(INITIAL_STOCK));
      safeStorage.setItem(DB_VERSION_KEY, CURRENT_VERSION);
    }
    if (!safeStorage.getItem(STORAGE_KEYS.MEDICINES)) {
      safeStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(INITIAL_MEDICINES));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.STOCK) || safeStorage.getItem(STORAGE_KEYS.STOCK)?.includes('pharmacy_maya')) {
      safeStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(INITIAL_STOCK));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.REQUESTS)) {
      // Seed with initial pending request for Pharmacie Test (with sample prescription photo)
      const initialRequests = [
        {
          requestId: 'req_test_001',
          pharmacyId: 'pharmacy_test', // Pharmacie Test
          prescriptionId: 'presc_test_100',
          medicineId: 'med_amox_1g',
          medicineName: 'Amoxicilline',
          dosage: '1 g',
          patientZone: 'Terminus 75, Keur Massar Sud',
          patientDistance: '0,1 km',
          status: 'PENDING',
          prescriptionPhoto: SAMPLE_PRESCRIPTION_PHOTO,
          createdAt: Date.now() - 2 * 60 * 1000,
          expiresAt: Date.now() + 15 * 60 * 1000,
          respondedAt: null
        },
        {
          requestId: 'req_test_002',
          pharmacyId: 'pharmacy_test', // Pharmacie Test
          prescriptionId: 'presc_test_100',
          medicineId: 'med_para_1g',
          medicineName: 'Paracétamol',
          dosage: '1 g',
          patientZone: 'Terminus 75, Keur Massar Sud',
          patientDistance: '0,1 km',
          status: 'PENDING',
          prescriptionPhoto: SAMPLE_PRESCRIPTION_PHOTO,
          createdAt: Date.now() - 2 * 60 * 1000,
          expiresAt: Date.now() + 15 * 60 * 1000,
          respondedAt: null
        },
        {
          requestId: 'req_init_001',
          pharmacyId: 'pharmacy_005', // Pharmacie Aïnoumadi
          prescriptionId: 'presc_init_100',
          medicineId: 'med_ibup_400',
          medicineName: 'Ibuprofène',
          dosage: '400 mg',
          patientZone: 'Keur Massar Sud',
          patientDistance: '0,9 km',
          status: 'PENDING',
          prescriptionPhoto: SAMPLE_PRESCRIPTION_PHOTO,
          createdAt: Date.now() - 3 * 60 * 1000,
          expiresAt: Date.now() + 12 * 60 * 1000,
          respondedAt: null
        }
      ];
      saveRequests(initialRequests);
    }
    if (!safeStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS)) {
      safeStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify([]));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    }
  }

  // Event Subscription
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event) {
    this.notifyLocalListeners(event);
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(event);
      } catch (e) {
        console.error('BroadcastChannel post error:', e);
      }
    }
    this.broadcastToCloud(event);
  }

  broadcastToCloud(event) {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    // Seuls ces événements sont utiles à l'autre appareil (voir handleRemoteCloudEvent)
    if (!CLOUD_EVENT_TYPES.has(event.type)) return;
    try {
      let cloudEvent = { ...event, senderId: this.clientId };
      // Allège le payload : la photo et la liste complète restent sur l'appareil d'origine
      if (cloudEvent.request) {
        const { prescriptionPhoto: _photo, medicinesList: _list, ...lightRequest } = cloudEvent.request;
        cloudEvent = { ...cloudEvent, request: lightRequest };
      }

      if (!USE_LOCAL_SYNC) {
        this.queueCloudEvent(cloudEvent);
        return;
      }
      // Développement : synchronisation locale directe via le serveur Vite (réseau Wi-Fi local)
      fetch('/api/sync/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloudEvent)
      }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }).catch(() => this.queueCloudEvent(cloudEvent));
    } catch {}
  }

  // Le relais public ntfy.sh limite le nombre de messages (erreur 429) : les événements sont
  // regroupés pendant 1 s puis envoyés en quelques messages de moins de 4 Ko (limite de ntfy)
  queueCloudEvent(cloudEvent) {
    this.cloudQueue = this.cloudQueue || [];
    this.cloudQueue.push(cloudEvent);
    if (!this.cloudFlushTimer) {
      this.cloudFlushTimer = setTimeout(() => this.flushCloudQueue(), 1000);
    }
  }

  async flushCloudQueue() {
    this.cloudFlushTimer = null;
    const events = this.cloudQueue || [];
    this.cloudQueue = [];

    const batches = [];
    let current = [];
    for (const ev of events) {
      const candidate = [...current, ev];
      if (current.length > 0 && JSON.stringify({ type: 'BATCH', events: candidate }).length > 3500) {
        batches.push(current);
        current = [ev];
      } else {
        current = candidate;
      }
    }
    if (current.length > 0) batches.push(current);

    for (const batch of batches) {
      const body = JSON.stringify({ type: 'BATCH', senderId: this.clientId, events: batch });
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(CLOUD_SYNC_TOPIC, { method: 'POST', body });
          if (res.status !== 429) break;
        } catch {
          break;
        }
        // Trop de messages : on patiente avant de réessayer
        await new Promise((resolve) => setTimeout(resolve, 6000 * (attempt + 1)));
      }
    }
  }


  notifyLocalListeners(event) {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error in db listener callback:', err);
      }
    });
  }

  // --- Pharmacies ---
  getPharmacies() {
    const data = safeStorage.getItem(STORAGE_KEYS.PHARMACIES);
    return data ? JSON.parse(data) : INITIAL_PHARMACIES;
  }

  setPharmacies(pharmacies) {
    if (!Array.isArray(pharmacies) || pharmacies.length === 0) return;
    safeStorage.setItem(STORAGE_KEYS.PHARMACIES, JSON.stringify(pharmacies));

    // Ensure baseline stock for any new pharmacy
    const medicines = this.getMedicines();
    const stock = this.getStock();
    pharmacies.forEach((ph) => {
      medicines.forEach((med, mIndex) => {
        const exists = stock.some((s) => s.pharmacyId === ph.id && s.medicineId === med.id);
        if (!exists) {
          const avail = mIndex % 3 === 0 ? 'AVAILABLE' : (mIndex % 3 === 1 ? 'AVAILABLE' : 'UNKNOWN');
          stock.push({
            id: `st_${ph.id}_${med.id}`,
            pharmacyId: ph.id,
            medicineId: med.id,
            availability: avail,
            lastUpdated: Date.now() - (mIndex + 1) * 15 * 60 * 1000
          });
        }
      });
    });
    safeStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
    this.notify({ type: 'PHARMACIES_UPDATED', pharmacies });
  }

  getPharmacyById(id) {
    return this.getPharmacies().find((p) => p.id === id) || null;
  }

  // --- Medicines ---
  getMedicines() {
    const data = safeStorage.getItem(STORAGE_KEYS.MEDICINES);
    return data ? JSON.parse(data) : INITIAL_MEDICINES;
  }

  findMedicineByName(name, dosage = null) {
    if (!name) return null;
    const stripAccents = (str) =>
      str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';

    const cleanName = stripAccents(name);
    const cleanDosage = dosage ? stripAccents(dosage) : null;
    const allMeds = this.getMedicines();

    // Dictionnaire des noms de marque -> nom générique (pour la correspondance)
    const BRAND_TO_GENERIC = {
      // Paracétamol
      'doliprane': 'paracetamol', 'efferalgan': 'paracetamol', 'dafalgan': 'paracetamol',
      'perfalgan': 'paracetamol', 'panadol': 'paracetamol', 'roiper': 'paracetamol',
      // Amoxicilline
      'augmentin': 'amoxicilline', 'clamoxyl': 'amoxicilline', 'amoxil': 'amoxicilline',
      'flemoxin': 'amoxicilline', 'ospamox': 'amoxicilline',
      // Ibuprofene
      'advil': 'ibuprofene', 'nurofen': 'ibuprofene', 'brufen': 'ibuprofene',
      'antarene': 'ibuprofene',
      // Autres courants
      'rocephine': 'ceftriaxone', 'ryocef': 'ceftriaxone',
      'flagyl': 'metronidazole', 'bactrim': 'cotrimoxazole',
      'maxidrol': 'neomycine dexamethasone', // collyre
    };

    // Résoudre les noms de marque vers le générique
    const firstWord = cleanName.split(' ')[0];
    const resolvedName = BRAND_TO_GENERIC[cleanName] || BRAND_TO_GENERIC[firstWord] || cleanName;

    // Fonction de matching souple
    const nameMatches = (mNorm, target) => {
      return target.includes(mNorm) || mNorm.includes(target) ||
             (target.length >= 4 && mNorm.startsWith(target.substring(0, 4))) ||
             (mNorm.length >= 4 && target.startsWith(mNorm.substring(0, 4)));
    };

    // 1. Essai avec dosage si fourni
    if (cleanDosage) {
      const matchWithDosage = allMeds.find((m) => {
        const mNorm = stripAccents(m.normalizedName || m.name);
        const mDos = stripAccents(m.dosage);
        return (nameMatches(mNorm, resolvedName) || nameMatches(mNorm, cleanName)) &&
               (cleanDosage.includes(mDos) || mDos.includes(cleanDosage) ||
                cleanDosage.replace(/\s/g, '') === mDos.replace(/\s/g, ''));
      });
      if (matchWithDosage) return matchWithDosage;
    }

    // 2. Essai sans dosage sur le nom résolu (générique)
    const resolvedMatch = allMeds.find((m) => {
      const mNorm = stripAccents(m.normalizedName || m.name);
      return nameMatches(mNorm, resolvedName);
    });
    if (resolvedMatch) return resolvedMatch;

    // 3. Essai direct sur le nom brut
    const directMatch = allMeds.find((m) => {
      const mNorm = stripAccents(m.normalizedName || m.name);
      return nameMatches(mNorm, cleanName);
    });
    if (directMatch) return directMatch;

    // 4. Essai sur le premier mot (ex: "Doliprane 1000" -> first word "doliprane")
    if (firstWord && firstWord.length >= 3) {
      const firstResolved = BRAND_TO_GENERIC[firstWord] || firstWord;
      const wordMatch = allMeds.find((m) => {
        const mNorm = stripAccents(m.normalizedName || m.name);
        return nameMatches(mNorm, firstResolved) || nameMatches(mNorm, firstWord);
      });
      if (wordMatch) return wordMatch;
    }

    return null;
  }

  // --- Stock / Availability ---
  getStock() {
    const data = safeStorage.getItem(STORAGE_KEYS.STOCK);
    return data ? JSON.parse(data) : INITIAL_STOCK;
  }

  getPharmacyStock(pharmacyId) {
    return this.getStock().filter((s) => s.pharmacyId === pharmacyId);
  }

  getMedicineAvailability(pharmacyId, medicineName, medicineDosage) {
    const stock = this.getStock();
    const medicines = this.getMedicines();

    // Match medicine
    const med = this.findMedicineByName(medicineName, medicineDosage);
    if (!med) {
      return { availability: 'UNKNOWN', lastUpdated: null };
    }

    const item = stock.find((s) => s.pharmacyId === pharmacyId && s.medicineId === med.id);
    if (!item) {
      return { availability: 'UNKNOWN', lastUpdated: null };
    }

    return {
      availability: item.availability,
      lastUpdated: item.lastUpdated
    };
  }

  updateStockAvailability(pharmacyId, medicineId, availability) {
    const stock = this.getStock();
    const existingIndex = stock.findIndex(
      (s) => s.pharmacyId === pharmacyId && s.medicineId === medicineId
    );

    const now = Date.now();
    if (existingIndex >= 0) {
      stock[existingIndex].availability = availability;
      stock[existingIndex].lastUpdated = now;
    } else {
      stock.push({
        id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        pharmacyId,
        medicineId,
        availability,
        lastUpdated: now
      });
    }

    safeStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
    this.notify({ type: 'STOCK_UPDATED', pharmacyId, medicineId, availability });
  }

  // --- Availability Requests ---
  getRequests(pharmacyId = null) {
    const data = safeStorage.getItem(STORAGE_KEYS.REQUESTS);
    const list = data ? JSON.parse(data) : [];
    const now = Date.now();
    let hasChanges = false;

    // Auto-expiration check : 5 min sans réponse -> EXPIRED
    // Fin de mise de côté si le patient n'arrive pas -> réservation expirée
    const sanitized = list.map((r) => {
      if (r.status === 'PENDING' && r.expiresAt && now > r.expiresAt) {
        hasChanges = true;
        return { ...r, status: 'EXPIRED', expiredAt: now };
      }
      if (r.status === 'AVAILABLE' && r.isReserved && r.reservedUntil && now > r.reservedUntil) {
        hasChanges = true;
        return { ...r, isReserved: false, reservationExpired: true };
      }
      return r;
    });

    // Dédoublonnage et filtrage des faux positifs (ex: mentions 'termine', notes de bas de page)
    const seenKeys = new Set();
    const uniqueList = [];
    sanitized.forEach((r) => {
      const name = (r.medicineName || '').toLowerCase().trim();
      const cleanName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (cleanName === 'termine' || cleanName === 'terminer' || cleanName === 'ordonnance') {
        hasChanges = true;
        return;
      }
      const uniqueKey = `${r.prescriptionId || r.requestId}_${r.pharmacyId}_${name}`;
      if (!seenKeys.has(uniqueKey)) {
        seenKeys.add(uniqueKey);
        uniqueList.push(r);
      } else {
        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveRequests(uniqueList);
    }

    if (pharmacyId) {
      return uniqueList.filter((r) => r.pharmacyId === pharmacyId);
    }
    return uniqueList;
  }

  createAvailabilityRequest({
    pharmacyId,
    medicineName,
    dosage,
    matchedName = null,
    instructions = '',
    rawText = '',
    needsCheck = false,
    dci = '',
    alternatives = [],
    prescriptionId,
    patientZone,
    patientDistance,
    prescriptionPhoto = null,
    medicinesList = []
  }) {
    const requests = this.getRequests();
    const med = this.findMedicineByName(medicineName);

    // Éviter de recréer une demande déjà existante pour cette même ordonnance et officine
    if (prescriptionId) {
      const existing = requests.find(
        (r) =>
          r.prescriptionId === prescriptionId &&
          r.pharmacyId === pharmacyId &&
          r.medicineName.toLowerCase().trim() === medicineName.toLowerCase().trim()
      );
      if (existing) {
        return existing;
      }
    }

    const newRequest = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      pharmacyId,
      prescriptionId: prescriptionId || `presc_${Date.now()}`,
      medicineId: med ? med.id : `med_custom_${Date.now()}`,
      medicineName,
      dosage: dosage || '',
      matchedName,
      instructions,
      rawText,
      needsCheck,
      dci,
      alternatives,
      patientZone: patientZone || 'Keur Massar',
      patientDistance: patientDistance || '0,8 km',
      prescriptionPhoto: prescriptionPhoto || null,
      medicinesList: medicinesList || (med ? [{ name: med.name, dosage }] : [{ name: medicineName, dosage }]),
      status: 'PENDING',
      isReserved: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // Expire chez le pharmacien au bout de 5 min sans réponse
      respondedAt: null
    };

    requests.unshift(newRequest);
    saveRequests(requests);

    // Register simulated push notification for the pharmacy
    this.addNotification({
      pharmacyId,
      requestId: newRequest.requestId,
      title: 'Nouvelle demande de disponibilité',
      message: `${medicineName} ${dosage} demandée à proximité`,
      timestamp: Date.now()
    });

    this.notify({ type: 'REQUEST_CREATED', request: newRequest });
    return newRequest;
  }

  respondToRequest(requestId, status) {
    // status: 'AVAILABLE' | 'UNAVAILABLE'
    const requests = this.getRequests();
    const index = requests.findIndex((r) => r.requestId === requestId);
    if (index === -1) return null;

    const req = requests[index];
    req.status = status;
    req.respondedAt = Date.now();

    // Quand il répond « Disponible », il met le médicament de côté pour le patient
    if (status === 'AVAILABLE') {
      req.isReserved = true;
      req.reservedAt = Date.now();
      req.reservedUntil = Date.now() + 30 * 60 * 1000; // Mis de côté 30 minutes
    } else {
      req.isReserved = false;
    }

    requests[index] = req;
    saveRequests(requests);

    // Auto-update pharmacy stock table so future queries know availability
    if (req.medicineId && req.pharmacyId) {
      this.updateStockAvailability(req.pharmacyId, req.medicineId, status);
    }

    this.notify({ type: 'REQUEST_RESPONDED', request: req, status });
    return req;
  }

  // Ferme la demande lorsqu'un patient est servi
  markPatientServed(requestId) {
    const requests = this.getRequests();
    const index = requests.findIndex((r) => r.requestId === requestId);
    if (index === -1) return null;

    const req = requests[index];
    req.status = 'SERVED';
    req.servedAt = Date.now();
    req.isReserved = false;

    requests[index] = req;
    saveRequests(requests);

    this.notify({ type: 'REQUEST_SERVED', request: req, requestId });
    return req;
  }

  // Vérification de lecture d'ordonnance par un pharmacien
  verifyPrescriptionReading(prescriptionId, pharmacyId) {
    const requests = this.getRequests();
    let updated = false;

    requests.forEach((r) => {
      if (r.prescriptionId === prescriptionId) {
        r.readingVerifiedBy = pharmacyId;
        r.readingVerifiedAt = Date.now();
        updated = true;
      }
    });

    if (updated) {
      saveRequests(requests);
      this.notify({ type: 'READING_VERIFIED', prescriptionId, pharmacyId });
    }
  }

  isPrescriptionReadingVerified(prescriptionId) {
    if (!prescriptionId) return false;
    const requests = this.getRequests();
    return requests.some((r) => r.prescriptionId === prescriptionId && r.readingVerifiedBy);
  }

  // --- Notifications ---
  getNotifications(pharmacyId = null) {
    const data = safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const list = data ? JSON.parse(data) : [];
    if (pharmacyId) {
      return list.filter((n) => n.pharmacyId === pharmacyId);
    }
    return list;
  }

  addNotification(notif) {
    const list = this.getNotifications();
    list.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      read: false,
      ...notif
    });
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    this.notify({ type: 'NOTIFICATION_ADDED', notification: notif });
  }

  markNotificationRead(notifId) {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === notifId);
    if (item) {
      item.read = true;
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
      this.notify({ type: 'NOTIFICATION_READ', notifId });
    }
  }

  // Reset database to initial demo state
  resetToDefault() {
    safeStorage.setItem(STORAGE_KEYS.PHARMACIES, JSON.stringify(INITIAL_PHARMACIES));
    safeStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(INITIAL_MEDICINES));
    safeStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(INITIAL_STOCK));
    safeStorage.removeItem(STORAGE_KEYS.REQUESTS);
    safeStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    this.initDatabase();
    this.notify({ type: 'RESET' });
  }
}

export const db = new DatabaseService();
