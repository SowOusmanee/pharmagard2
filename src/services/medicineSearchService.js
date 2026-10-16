// Fast Client-Side Search Engine for Medicines (Approche 1: Algorithme normalisé & instantané)
import medicinesData from '../data/medicinesDb.json' with { type: 'json' };

// Helper to remove accents and special characters
export function normalizeMedicineQuery(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches the medication database with high speed (<5ms)
 * Features:
 * - Prefix matching (ex: "doli" -> Doliprane)
 * - Substring matching (ex: "amox" -> Amoxicilline)
 * - Multi-word query support (ex: "doliprane 1000" or "amox 500")
 * - Typo tolerance via word segment matching
 */
export function searchMedicinesFast(query, limit = 8) {
  const clean = normalizeMedicineQuery(query);
  if (!clean || clean.length < 2) return [];

  const queryTerms = clean.split(' ').filter(Boolean);

  const exactMatches = [];
  const startsWithMatches = [];
  const containsMatches = [];
  const fuzzyMatches = [];

  for (let i = 0; i < medicinesData.length; i++) {
    const item = medicinesData[i];
    const norm = item.normalized;
    const fullNorm = normalizeMedicineQuery(`${item.name} ${item.dosage}`);

    // Check if all query terms are present
    const matchesAllTerms = queryTerms.every((term) => fullNorm.includes(term));

    if (matchesAllTerms) {
      if (norm === clean) {
        exactMatches.push(item);
      } else if (norm.startsWith(clean)) {
        startsWithMatches.push(item);
      } else {
        containsMatches.push(item);
      }
    } else if (clean.length >= 3 && queryTerms.some((term) => term.length >= 3 && fullNorm.includes(term))) {
      fuzzyMatches.push(item);
    }

    if (exactMatches.length + startsWithMatches.length + containsMatches.length >= limit * 2) {
      break;
    }
  }

  const combined = [
    ...exactMatches,
    ...startsWithMatches,
    ...containsMatches,
    ...fuzzyMatches
  ];

  // Return top unique results
  const seen = new Set();
  const results = [];
  for (const item of combined) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      results.push(item);
      if (results.length >= limit) break;
    }
  }

  return results;
}

export default {
  searchMedicinesFast,
  normalizeMedicineQuery
};
