// Fast Client-Side Search Engine for Medicines (Approche 1: Algorithme normalisé & instantané)
import medicinesData from '../data/medicinesDb.json' with { type: 'json' };

// Helper to remove accents and special characters
export function normalizeMedicineQuery(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Pré-calcul unique de l'index (nom + dosage normalisés) pour ~15 000 entrées
const searchIndex = medicinesData.map((item) => ({
  item,
  norm: item.normalized,
  fullNorm: normalizeMedicineQuery(`${item.name} ${item.dosage}`),
  firstWord: item.normalized.split(' ')[0] || ''
}));

/**
 * Searches the medication database with high speed
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
  const wordStartMatches = [];
  const containsMatches = [];
  const fuzzyMatches = [];

  const nameTerm = queryTerms[0];

  for (const { item, norm, fullNorm } of searchIndex) {
    // Check if all query terms are present
    const matchesAllTerms = queryTerms.every((term) => fullNorm.includes(term));

    if (matchesAllTerms) {
      if (norm === clean) {
        exactMatches.push(item);
      } else if (norm.startsWith(clean) || fullNorm.startsWith(clean)) {
        startsWithMatches.push(item);
      } else if (queryTerms.every((term) => ` ${fullNorm}`.includes(` ${term}`))) {
        // Chaque terme commence un mot (ex: "amox 500" -> "Amoxicilline ... 500 mg", pas "Diamox")
        wordStartMatches.push(item);
      } else {
        containsMatches.push(item);
      }
    } else if (nameTerm.length >= 3 && fuzzyMatches.length < limit && norm.includes(nameTerm)) {
      // Le nom correspond mais pas le dosage : on propose quand même le produit
      fuzzyMatches.push(item);
    }
  }

  // Les noms courts (ex: "Doliprane 1000 mg") passent avant les variantes longues
  const byLength = (a, b) => a.fullTitle.length - b.fullTitle.length;
  startsWithMatches.sort(byLength);
  wordStartMatches.sort(byLength);
  containsMatches.sort(byLength);
  fuzzyMatches.sort(byLength);

  const combined = [
    ...exactMatches,
    ...startsWithMatches,
    ...wordStartMatches,
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

// Distance d'édition (Levenshtein) pour tolérer les fautes de lecture OCR
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * Rapproche un nom lu sur l'ordonnance de la base officielle.
 * Retourne { item, score } (score entre 0 et 1) ou null si rien de crédible.
 * - Recherche directe d'abord (nom + dosage, puis nom seul)
 * - Sinon tolérance aux fautes sur le premier mot (ex: "Amoxiciline" -> "Amoxicilline")
 */
export function findBestMedicineMatch(name, dosage = '') {
  const cleanName = normalizeMedicineQuery(name);
  if (!cleanName || cleanName.length < 3) return null;

  const direct =
    (dosage && searchMedicinesFast(`${cleanName} ${dosage}`, 1)[0]) ||
    searchMedicinesFast(cleanName, 1)[0];
  if (direct && direct.normalized.startsWith(cleanName.split(' ')[0])) {
    return { item: direct, score: 1 };
  }

  const firstWord = cleanName.split(' ')[0];
  if (firstWord.length < 4) return null;
  const maxDistance = firstWord.length >= 8 ? 2 : 1;

  let best = null;
  for (const entry of searchIndex) {
    if (Math.abs(entry.firstWord.length - firstWord.length) > maxDistance) continue;
    const d = editDistance(firstWord, entry.firstWord);
    if (d <= maxDistance && (!best || d < best.d || (d === best.d && entry.item.fullTitle.length < best.item.fullTitle.length))) {
      best = { item: entry.item, d };
      if (d === 0) break;
    }
  }
  if (!best) return null;
  // Nom corrigé : on retente avec le dosage pour choisir la bonne présentation
  const corrected = dosage && searchMedicinesFast(`${best.item.normalized.split(' ')[0]} ${dosage}`, 1)[0];
  return { item: corrected || best.item, score: 1 - best.d / firstWord.length };
}

export default {
  searchMedicinesFast,
  findBestMedicineMatch,
  normalizeMedicineQuery
};
