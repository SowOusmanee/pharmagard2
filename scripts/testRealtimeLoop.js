// Automated Test for End-to-End Real-Time Marketplace Loop

import { db } from '../src/services/db.js';
import { checkAvailability } from '../src/services/pharmacySearch.js';

console.log('🔄 Testing real-time marketplace loop...\n');

db.resetToDefault();

const medicines = [
  { name: 'Amoxicilline', dosage: '500 mg' },
  { name: 'Paracétamol', dosage: '1 g' },
  { name: 'Ibuprofène', dosage: '400 mg' }
];

const pharmacies = db.getPharmacies();

// Step 1: Initial check
console.log('--- ÉTAPE 1: Recherche initiale du patient ---');
let ranked = checkAvailability(medicines, pharmacies, { autoTriggerRequests: true });
console.log(`Rank 1: ${ranked[0].pharmacy.name} (${ranked[0].availableCount}/3 disponibles, distance: ${ranked[0].pharmacy.distanceKm} km)`);
console.log(`Rank 2: ${ranked[1].pharmacy.name} (${ranked[1].availableCount}/3 disponibles, distance: ${ranked[1].pharmacy.distanceKm} km)`);

// Step 2: Pharmacist gets the request and responds DISPONIBLE
console.log('\n--- ÉTAPE 2: La Pharmacie Niayes Pikine répond DISPONIBLE ---');
const niayesRequests = db.getRequests('pharmacy_001');
const pendingReq = niayesRequests.find((r) => r.medicineName === 'Ibuprofène' && r.status === 'PENDING');
console.log(`Demande trouvée: ID=${pendingReq.requestId}, Médicament=${pendingReq.medicineName} ${pendingReq.dosage}`);

db.respondToRequest(pendingReq.requestId, 'AVAILABLE');
console.log('Réponse enregistrée: DISPONIBLE');

// Step 3: Re-evaluate rankings in real time
console.log('\n--- ÉTAPE 3: Mise à jour en temps réel côté patient ---');
ranked = checkAvailability(medicines, pharmacies, { autoTriggerRequests: false });
console.log(`NOUVEAU Rank 1: ${ranked[0].pharmacy.name} (${ranked[0].availableCount}/3 disponibles, distance: ${ranked[0].pharmacy.distanceKm} km)`);
console.log(`NOUVEAU Rank 2: ${ranked[1].pharmacy.name} (${ranked[1].availableCount}/3 disponibles, distance: ${ranked[1].pharmacy.distanceKm} km)`);

if (ranked[0].pharmacy.id === 'pharmacy_001' && ranked[0].isComplete) {
  console.log('\n✅ SUCCÈS: Pharmacie Niayes Pikine est passée à 3/3 et a pris le Rank 1 grâce à la confirmation en temps réel !');
} else {
  console.error('\n❌ Échec: le reclassement en temps réel n\'a pas fonctionné comme prévu.');
}
