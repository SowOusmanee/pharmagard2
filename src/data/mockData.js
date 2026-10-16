// Senegalese HealthTech - PharmaGarde Mock Data
// Dakar & Suburbs (Keur Massar, Dakar centre, Parcelles, etc.)

export const DEFAULT_USER_LOCATION = {
  latitude: 14.77906,
  longitude: -17.30422,
  name: "Avenue Sotrac, Keur Massar Sud, Dakar",
  accuracy: 10
};

export const ZONES = [
  { id: "keur_massar", name: "Keur Massar", description: "Rond-point, Jaxaay, Aynoumady, Unité 1 à 15, Boune" },
  { id: "parcelles", name: "Parcelles Assainies", description: "Unités 1 à 26, Case Bi" },
  { id: "dakar_centre", name: "Dakar Centre", description: "Plateau, Médina, Fann" }
];

export const INITIAL_PHARMACIES = [
  {
    id: "pharmacy_test",
    name: "Pharmacie Test",
    address: "Terminus 75, Keur Massar Sud",
    zone: "keur_massar",
    latitude: 14.7750,
    longitude: -17.3015,
    distanceKm: 0.1,
    phone: "+221 77 000 00 00",
    openingHours: "Ouvert 24h/24",
    isDuty24h: true,
    isPriority: true,
    status: "active",
    landmark: "Près du Terminus 75, Keur Massar Sud",
    pharmacistName: "Dr. Admin Test"
  },
  {
    id: "pharmacy_005",
    name: "Pharmacie Aïnoumadi",
    address: "Cité Aïnoumadi 1048, Keur Massar",
    zone: "keur_massar",
    latitude: 14.7731,
    longitude: -17.3096,
    distanceKm: 0.9,
    phone: "+221 33 878 51 08",
    openingHours: "Ouvert 24h/24",
    isDuty24h: true,
    isPriority: true,
    status: "active",
    landmark: "En face du dispensaire Mme Ba, Cité Aïnoumadi",
    pharmacistName: "Dr. Ibrahima Ndiaye"
  },
  {
    id: "pharmacy_001",
    name: "Pharmacie Keur Massar",
    address: "Face Rond-point Keur Massar, Route de Boune",
    zone: "keur_massar",
    latitude: 14.7820,
    longitude: -17.3115,
    distanceKm: 0.8,
    phone: "+221 33 878 12 12",
    openingHours: "Ouvert 24h/24",
    isDuty24h: true,
    isPriority: false,
    status: "active",
    landmark: "Face Rond-point Keur Massar",
    pharmacistName: "Dr. Ousmane Diop"
  },
  {
    id: "pharmacy_002",
    name: "Pharmacie Al Amin Keur Massar",
    address: "Terminus Keur Massar, Unité 3",
    zone: "keur_massar",
    latitude: 14.7845,
    longitude: -17.3090,
    distanceKm: 0.8,
    phone: "+221 33 878 45 45",
    openingHours: "Ouvert 24h/24",
    isDuty24h: true,
    isPriority: false,
    status: "active",
    landmark: "Près du Terminus des bus",
    pharmacistName: "Dr. Aïssatou Sow"
  },
  {
    id: "pharmacy_dioma",
    name: "Pharmacie Dioma",
    address: "Cité Aïnoumady N° 755, Keur Massar",
    zone: "keur_massar",
    latitude: 14.77458,
    longitude: -17.31329,
    distanceKm: 1.1,
    phone: "+221 33 837 75 75",
    openingHours: "Ouvert 24h/24",
    isDuty24h: true,
    isPriority: false,
    status: "active",
    landmark: "Cité Aïnoumady N° 755, près ENO Keur Massar",
    pharmacistName: "Dr. Françoise Ndour Ngom"
  },
  {
    id: "pharmacy_003",
    name: "Pharmacie Diaraf Keur Massar",
    address: "Carrefour Diaraf, Route des Niayes",
    zone: "keur_massar",
    latitude: 14.7790,
    longitude: -17.3140,
    distanceKm: 1.1,
    phone: "+221 33 878 60 70",
    openingHours: "08h00 - 23h00",
    isDuty24h: false,
    isPriority: false,
    status: "active",
    landmark: "Carrefour Diaraf, Route des Niayes",
    pharmacistName: "Dr. Cheikh Tidiane Sy"
  },
  {
    id: "pharmacy_004",
    name: "Pharmacie Jaxaay",
    address: "Entrée principale Jaxaay 1",
    zone: "keur_massar",
    latitude: 14.7890,
    longitude: -17.2980,
    distanceKm: 1.3,
    phone: "+221 33 878 90 90",
    openingHours: "Ouvert 24h/24",
    isDuty24h: true,
    isPriority: false,
    status: "active",
    landmark: "Entrée principale Jaxaay",
    pharmacistName: "Dr. Marième Ba"
  },
  {
    id: "pharmacy_bayeniass",
    name: "Pharmacie Baye Niass",
    address: "Plan Jaxaay 01, Keur Massar Sud",
    zone: "keur_massar",
    latitude: 14.7709,
    longitude: -17.2939,
    distanceKm: 1.4,
    phone: "+221 33 878 55 55",
    openingHours: "08h00 - 23h00",
    isDuty24h: false,
    isPriority: false,
    status: "active",
    landmark: "Plan Jaxaay 01",
    pharmacistName: "Dr. Abdoulaye Niass"
  },
  {
    id: "pharmacy_006",
    name: "Pharmacie Darou Salam",
    address: "Quartier Darou Salam, Keur Massar",
    zone: "keur_massar",
    latitude: 14.7860,
    longitude: -17.3160,
    distanceKm: 1.5,
    phone: "+221 33 878 77 88",
    openingHours: "08h30 - 22h00",
    isDuty24h: false,
    isPriority: false,
    status: "active",
    landmark: "Près de l'école Darou Salam",
    pharmacistName: "Dr. Khady Seck"
  },
  {
    id: "pharmacy_007",
    name: "Pharmacie Castors",
    address: "Allées Seydou Nourou Tall, Castors",
    zone: "dakar_centre",
    latitude: 14.7120,
    longitude: -17.4520,
    distanceKm: 6.2,
    phone: "+221 33 824 15 30",
    openingHours: "08h00 - 23h00",
    isDuty24h: false,
    isPriority: false,
    status: "active",
    landmark: "Près du Rond-point Castors",
    pharmacistName: "Dr. Babacar Diagne"
  },
  {
    id: "pharmacy_008",
    name: "Pharmacie Liberté 6",
    address: "Rond-point Liberté 6",
    zone: "dakar_centre",
    latitude: 14.7230,
    longitude: -17.4610,
    distanceKm: 5.8,
    phone: "+221 33 827 88 12",
    openingHours: "Ouvert 24h/24",
    isDuty24h: true,
    isPriority: false,
    status: "active",
    landmark: "Face terminus Dakar Dem Dikk",
    pharmacistName: "Dr. Fatou Samb"
  }
];

export const INITIAL_MEDICINES = [
  {
    id: "med_amox_500",
    name: "Amoxicilline",
    normalizedName: "amoxicilline",
    dosage: "500 mg",
    category: "Antibiotique",
    form: "Gélules",
    active: true
  },
  {
    id: "med_amox_1g",
    name: "Amoxicilline",
    normalizedName: "amoxicilline",
    dosage: "1 g",
    category: "Antibiotique",
    form: "Comprimés dispersibles",
    active: true
  },
  {
    id: "med_para_1g",
    name: "Paracétamol",
    normalizedName: "paracetamol",
    dosage: "1 g",
    category: "Antalgique / Antipyrétique",
    form: "Comprimés effervescents",
    active: true
  },
  {
    id: "med_ibup_400",
    name: "Ibuprofène",
    normalizedName: "ibuprofene",
    dosage: "400 mg",
    category: "Anti-inflammatoire",
    form: "Comprimés pelliculés",
    active: true
  },
  {
    id: "med_sro",
    name: "Sérum oral (SRO)",
    normalizedName: "serum oral sro",
    dosage: "Sachet 1L",
    category: "Réhydratation",
    form: "Poudre pour solution buvable",
    active: true
  },
  {
    id: "med_metro_500",
    name: "Métronidazole",
    normalizedName: "metronidazole",
    dosage: "500 mg",
    category: "Anti-infectieux",
    form: "Comprimés",
    active: true
  },
  {
    id: "med_arte_80",
    name: "Artéméther",
    normalizedName: "artemether",
    dosage: "80 mg",
    category: "Antipaludique",
    form: "Injectable / Comprimés",
    active: true
  },
  {
    id: "med_cipro_500",
    name: "Ciprofloxacine",
    normalizedName: "ciprofloxacine",
    dosage: "500 mg",
    category: "Antibiotique",
    form: "Comprimés",
    active: true
  }
];

// Initial stock matrix (pharmacyId x medicineId)
// availability: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN'
export const INITIAL_STOCK = [
  // Pharmacie Test (Duty & Priority 24h/24)
  { id: "st_m_1", pharmacyId: "pharmacy_test", medicineId: "med_amox_500", availability: "AVAILABLE", lastUpdated: Date.now() - 15 * 60 * 1000 },
  { id: "st_m_2", pharmacyId: "pharmacy_test", medicineId: "med_para_1g", availability: "AVAILABLE", lastUpdated: Date.now() - 10 * 60 * 1000 },
  { id: "st_m_3", pharmacyId: "pharmacy_test", medicineId: "med_ibup_400", availability: "UNKNOWN", lastUpdated: Date.now() - 25 * 60 * 1000 },
  { id: "st_m_4", pharmacyId: "pharmacy_test", medicineId: "med_sro", availability: "AVAILABLE", lastUpdated: Date.now() - 20 * 60 * 1000 },
  { id: "st_m_5", pharmacyId: "pharmacy_test", medicineId: "med_metro_500", availability: "AVAILABLE", lastUpdated: Date.now() - 30 * 60 * 1000 },

  // Pharmacie Aïnoumadi (Duty 24h/24)
  { id: "st_5_1", pharmacyId: "pharmacy_005", medicineId: "med_amox_500", availability: "AVAILABLE", lastUpdated: Date.now() - 15 * 60 * 1000 },
  { id: "st_5_2", pharmacyId: "pharmacy_005", medicineId: "med_para_1g", availability: "AVAILABLE", lastUpdated: Date.now() - 10 * 60 * 1000 },
  { id: "st_5_3", pharmacyId: "pharmacy_005", medicineId: "med_ibup_400", availability: "UNKNOWN", lastUpdated: Date.now() - 25 * 60 * 1000 },
  { id: "st_5_4", pharmacyId: "pharmacy_005", medicineId: "med_sro", availability: "AVAILABLE", lastUpdated: Date.now() - 20 * 60 * 1000 },
  { id: "st_5_5", pharmacyId: "pharmacy_005", medicineId: "med_metro_500", availability: "AVAILABLE", lastUpdated: Date.now() - 30 * 60 * 1000 },

  // Pharmacie Keur Massar (Duty & Priority)
  { id: "st_1_1", pharmacyId: "pharmacy_001", medicineId: "med_amox_500", availability: "AVAILABLE", lastUpdated: Date.now() - 25 * 60 * 1000 },
  { id: "st_1_2", pharmacyId: "pharmacy_001", medicineId: "med_para_1g", availability: "AVAILABLE", lastUpdated: Date.now() - 15 * 60 * 1000 },
  { id: "st_1_3", pharmacyId: "pharmacy_001", medicineId: "med_ibup_400", availability: "UNKNOWN", lastUpdated: Date.now() - 3 * 3600 * 1000 }, // Will trigger live availability request!
  { id: "st_1_4", pharmacyId: "pharmacy_001", medicineId: "med_sro", availability: "AVAILABLE", lastUpdated: Date.now() - 10 * 60 * 1000 },

  // Pharmacie Al Amin Keur Massar (Duty)
  { id: "st_2_1", pharmacyId: "pharmacy_002", medicineId: "med_amox_500", availability: "AVAILABLE", lastUpdated: Date.now() - 40 * 60 * 1000 },
  { id: "st_2_2", pharmacyId: "pharmacy_002", medicineId: "med_para_1g", availability: "AVAILABLE", lastUpdated: Date.now() - 30 * 60 * 1000 },
  { id: "st_2_3", pharmacyId: "pharmacy_002", medicineId: "med_ibup_400", availability: "UNAVAILABLE", lastUpdated: Date.now() - 2 * 3600 * 1000 },

  // Pharmacie Diaraf Keur Massar
  { id: "st_3_1", pharmacyId: "pharmacy_003", medicineId: "med_amox_500", availability: "AVAILABLE", lastUpdated: Date.now() - 60 * 60 * 1000 },
  { id: "st_3_2", pharmacyId: "pharmacy_003", medicineId: "med_para_1g", availability: "AVAILABLE", lastUpdated: Date.now() - 45 * 60 * 1000 },
  { id: "st_3_3", pharmacyId: "pharmacy_003", medicineId: "med_ibup_400", availability: "AVAILABLE", lastUpdated: Date.now() - 50 * 60 * 1000 },

  // Pharmacie Jaxaay (Duty)
  { id: "st_4_1", pharmacyId: "pharmacy_004", medicineId: "med_amox_500", availability: "AVAILABLE", lastUpdated: Date.now() - 20 * 60 * 1000 },
  { id: "st_4_2", pharmacyId: "pharmacy_004", medicineId: "med_sro", availability: "AVAILABLE", lastUpdated: Date.now() - 15 * 60 * 1000 },
  { id: "st_4_3", pharmacyId: "pharmacy_004", medicineId: "med_metro_500", availability: "AVAILABLE", lastUpdated: Date.now() - 10 * 60 * 1000 },

  // Pharmacie Aynoumady
  { id: "st_5_1", pharmacyId: "pharmacy_005", medicineId: "med_amox_500", availability: "UNKNOWN", lastUpdated: Date.now() - 24 * 3600 * 1000 },
  { id: "st_5_2", pharmacyId: "pharmacy_005", medicineId: "med_para_1g", availability: "AVAILABLE", lastUpdated: Date.now() - 12 * 3600 * 1000 },

  // Pharmacie Darou Salam
  { id: "st_6_1", pharmacyId: "pharmacy_006", medicineId: "med_amox_500", availability: "UNAVAILABLE", lastUpdated: Date.now() - 3 * 3600 * 1000 },
  { id: "st_6_2", pharmacyId: "pharmacy_006", medicineId: "med_para_1g", availability: "AVAILABLE", lastUpdated: Date.now() - 2 * 3600 * 1000 },
  { id: "st_6_3", pharmacyId: "pharmacy_006", medicineId: "med_ibup_400", availability: "UNAVAILABLE", lastUpdated: Date.now() - 4 * 3600 * 1000 }
];

export const SAMPLE_PRESCRIPTIONS = [
  {
    id: "sample_rx_1",
    title: "Ordonnance Dr. Amadou Fall (3 médicaments)",
    doctor: "Dr. Amadou Fall - Médecin Généraliste",
    clinic: "Centre de Santé de Keur Massar",
    date: "Aujourd'hui",
    previewSvg: "rx1",
    medicines: [
      { name: "Amoxicilline", dosage: "500 mg", confidence: 0.96 },
      { name: "Paracétamol", dosage: "1 g", confidence: 0.94 },
      { name: "Ibuprofène", dosage: "400 mg", confidence: 0.89 }
    ]
  },
  {
    id: "sample_rx_2",
    title: "Ordonnance Pédiatrique (2 médicaments)",
    doctor: "Dr. Fatou Ndiaye - Pédiatre",
    clinic: "Hôpital Traditionnel de Keur Massar",
    date: "Hier",
    previewSvg: "rx2",
    medicines: [
      { name: "Sérum oral (SRO)", dosage: "Sachet 1L", confidence: 0.98 },
      { name: "Métronidazole", dosage: "500 mg", confidence: 0.91 }
    ]
  },
  {
    id: "sample_rx_3",
    title: "Ordonnance Paludisme (Incertitude OCR)",
    doctor: "Dr. Babacar Diagne",
    clinic: "Dispensaire Saint-Jean",
    date: "Aujourd'hui",
    previewSvg: "rx3",
    medicines: [
      { name: "Artéméther", dosage: "80 mg", confidence: 0.95 },
      { name: "Médicament Illisible", dosage: "?", confidence: 0.42 } // For low confidence warning requirement
    ]
  }
];
