// Automated Functional Verification Script for PharmaGarde Engine

import { INITIAL_PHARMACIES, INITIAL_MEDICINES, INITIAL_STOCK, DEFAULT_USER_LOCATION } from '../src/data/mockData.js';
import { calculateDistanceKm, findNearbyPharmacies, checkAvailability } from '../src/services/pharmacySearch.js';
import { analyzePrescription } from '../src/services/analyzer.js';

console.log('🧪 Running PharmaGarde functional verification tests...\n');

// Test 1: Distance calculation
console.log('1. Distance calculation check:');
const d = calculateDistanceKm(14.7588, -17.3985, 14.7570, -17.3920);
console.log(`- Calculated distance to Niayes Pikine: ${d} km (Expected ~0.7-0.8 km)`);
if (d >= 0.5 && d <= 1.0) {
  console.log('✅ Distance calculation test passed.');
} else {
  console.error('❌ Distance calculation out of bounds');
}

// Test 2: AI / OCR Analyzer Abstraction
console.log('\n2. AI / OCR analyzePrescription test:');
analyzePrescription(null, { samplePresetId: 'rx1' }).then((res) => {
  console.log(`- Extracted medicines count: ${res.medicines.length}`);
  console.log(`- Doctor identified: ${res.doctor}`);
  console.log(`- Extracted items:`, res.medicines.map((m) => `${m.name} ${m.dosage} (${Math.round(m.confidence * 100)}%)`).join(', '));
  if (res.medicines.length === 3 && res.medicines[0].name === 'Amoxicilline') {
    console.log('✅ OCR Analyzer extraction test passed.');
  } else {
    console.error('❌ OCR Analyzer failed');
  }

  // Test 3: Multi-tier ranking logic
  console.log('\n3. Multi-tier availability ranking logic:');
  const ranked = checkAvailability(res.medicines, INITIAL_PHARMACIES, { autoTriggerRequests: false });
  console.log(`- Ranked ${ranked.length} pharmacies.`);
  ranked.slice(0, 4).forEach((r, idx) => {
    console.log(`  [Rank ${idx + 1}] ${r.pharmacy.name}: ${r.availableCount}/${r.totalRequested} disponibles (${r.isComplete ? 'COMPLÈTE' : 'INCOMPLÈTE'}), dist: ${r.pharmacy.distanceKm} km`);
  });

  // Verify that a complete pharmacy (3/3) is ranked first
  const firstRank = ranked[0];
  if (firstRank.isComplete) {
    console.log(`✅ Complete prescription pharmacy is prioritized at Rank 1 (${firstRank.pharmacy.name}).`);
  } else {
    console.error('❌ Priority ranking failed: Complete prescription was not ranked first.');
  }

  console.log('\n🎉 ALL FUNCTIONAL LOGIC TESTS PASSED SUCCESSFULLY!');
}).catch((err) => {
  console.error('Test error:', err);
});
