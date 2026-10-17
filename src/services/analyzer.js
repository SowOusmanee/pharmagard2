// PharmaGarde Prescription Vision & OCR Engine
// Anonymized extraction of medications with strict patient privacy protection

import { storageService } from './storageService.js';
import { findBestMedicineMatch, normalizeMedicineQuery } from './medicineSearchService.js';

// Formats acceptés directement par Gemini (inline_data)
const GEMINI_INLINE_MIME = /^data:(image\/(jpeg|jpg|png|webp|heic|heif)|application\/pdf);base64,/i;

// Erreur lisible par l'utilisateur (affichée à l'écran au lieu de médicaments inventés)
export class PrescriptionAnalysisError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'PrescriptionAnalysisError';
    this.code = code;
  }
}

export const OCR_STAGES = [
  { id: 'reading', label: "Lecture sécurisée du document", durationMs: 900 },
  { id: 'identifying', label: "Extraction et vérification des molécules", durationMs: 1100 },
  { id: 'matching', label: "Préparation des disponibilités officines", durationMs: 700 }
];

/**
 * Extracts medications from an image with strict privacy enforcement:
 * - Patient names, identities, and personal data are strictly ignored and eliminated
 * - Only pharmaceutical data (molecule, dosage, form, instructions) is extracted
 */
export async function analyzePrescription(imagePayload, options = {}) {
  const { onProgress, presetMedicines } = options;

  // Save temporary image reference with 10-minute auto-expiry for medical privacy
  let imageMeta = null;
  if (imagePayload) {
    imageMeta = storageService.saveTemporaryPrescriptionImage(
      typeof imagePayload === 'string' ? imagePayload : 'data:image/svg+xml;base64,placeholder'
    );
  }

  // Step 1: Document reading & pre-processing
  if (onProgress) onProgress({ stage: OCR_STAGES[0], percent: 30 });

  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || (typeof window !== 'undefined' ? window.__PHARMAGARDE_AI_KEY__ : null);

  let medicines;
  let missingLines = 0;

  if (!imagePayload) {
    // Exemple de démonstration choisi explicitement : on affiche ses médicaments tels quels
    if (!Array.isArray(presetMedicines) || presetMedicines.length === 0) {
      throw new PrescriptionAnalysisError("Aucune photo reçue. Reprenez la photo ou importez une image de l'ordonnance.", 'NO_IMAGE');
    }
    medicines = presetMedicines.map((m, index) => ({
      id: `med_demo_${Date.now()}_${index}`,
      confidence: 0.95,
      isVerified: true,
      ...m
    }));
  } else {
    if (!apiKey) {
      throw new PrescriptionAnalysisError(
        "Lecture automatique indisponible : clé Gemini manquante (VITE_GEMINI_API_KEY dans le fichier .env).",
        'NO_API_KEY'
      );
    }
    if (typeof imagePayload !== 'string' || !/^data:(image\/|application\/pdf)/i.test(imagePayload)) {
      throw new PrescriptionAnalysisError("Format de fichier non pris en charge. Utilisez une photo (JPG, PNG) ou un PDF.", 'BAD_FORMAT');
    }

    if (onProgress) onProgress({ stage: OCR_STAGES[1], percent: 65 });
    const optimizedImage = await optimizeImageForOcr(imagePayload);
    if (!GEMINI_INLINE_MIME.test(optimizedImage)) {
      throw new PrescriptionAnalysisError("Format d'image non pris en charge. Utilisez une photo JPG ou PNG.", 'BAD_FORMAT');
    }
    const extraction = await callVisionExtractionApi(optimizedImage, apiKey);
    medicines = extraction.medicines.map(attachDatabaseMatch);
    // Lignes de l'ordonnance que Gemini a comptées mais pas réussi à lire
    missingLines = extraction.lineCount ? Math.max(extraction.lineCount - medicines.length, 0) : 0;

    // Médicaments absents de la base ou lus avec doute : vérification par recherche Google
    if (medicines.some(needsOnlineCheck)) {
      if (onProgress) onProgress({ stage: { id: 'verifying', label: 'Vérification en ligne des médicaments' }, percent: 85 });
      medicines = await verifyMedicinesOnline(medicines, apiKey);
    }
  }

  let hasLowConfidence = false;

  // Check if any extracted medicine has low confidence
  hasLowConfidence = medicines.some((m) => m.confidence && m.confidence < 0.70);

  // Step 3: Preparation completed
  if (onProgress) onProgress({ stage: OCR_STAGES[2], percent: 100 });
  await new Promise((res) => setTimeout(res, 400));

  return {
    success: true,
    prescriptionId: `presc_${Date.now()}`,
    medicines,
    missingLines,
    hasLowConfidence,
    imageMeta,
    timestamp: Date.now()
  };
}

/**
 * Calls the multimodal vision API with strict anonymisation prompt
 */
async function callVisionExtractionApi(dataUrl, apiKey) {
  const match = dataUrl.match(/^data:((?:image|application)\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Format image invalide');
  }

  const mimeType = match[1];
  const base64Data = match[2];

  // Prompt focusing strictly on pharmaceutical information, medical devices, and consumables
  const promptText = `
Tu es le moteur expert d'analyse d'ordonnances médicales manuscrites et imprimées de PharmaGarde.

DIRECTIVES ABSOLUES DE SÉCURITÉ ET D'EXTRACTION MÉDICALE :
1. PROTECTION DE LA VIE PRIVÉE : Tu dois STRICTEMENT IGNORER le nom, prénom, âge, sexe, adresse, numéro de téléphone, numéro de sécurité sociale ou tout identifiant personnel du patient ou médecin.
2. EXTRACTION COMPLÈTE : Tu dois extraire TOUS les éléments prescrits sans exception :
   - Les médicaments et molécules (ex: Ryocef/Rocephine 1g, Roiper/Perfalgan 1000mg, Maxidrol collyre, Diclo Denk 75mg, etc.)
   - Les dispositifs médicaux et consommables d'injection prescrits (ex: Seringues 10 cc/ml, Seringues 5 cc/ml, Épicrânienne, Aiguilles, Catheter, Perfuseur, Tubulure, etc.). NE LES EXCLUS JAMAIS !
3. ATTENTION AUX TAMPONS / CACHETS : Lis attentivement les lignes manuscrites même si elles touchent ou sont adjacentes à un tampon médical ou cachet rond (ex: "Seringues 10cc - 08", "Seringues 5cc - 05", "Épicrânienne - 08"). Ne confonds pas le texte manuscrit avec les mentions du cachet.
4. EXCLUSIONS STRICTES : Ne confonds JAMAIS des instructions ou mentions comme 'Terminé', 'Terminer', 'Traitement', 'Date', 'Signature', 'Docteur', 'Ordonnance' avec un médicament. N'extrais UNIQUEMENT que de réels médicaments pharmaceutiques ou consommables médicaux.

5. CONTEXTE SÉNÉGAL : les ordonnances viennent de Dakar et sa banlieue ; les noms de marque locaux (Afrique de l'Ouest, Maroc, Inde) sont fréquents. Déchiffre chaque lettre manuscrite avec soin AVANT de choisir un nom : ne remplace pas un nom par une marque plus connue qui commence par d'autres lettres (ex: une écriture « Neuclav » doit rester Neuclav, pas devenir Synclav).
6. CHIFFRES EN MARGE : les nombres isolés écrits dans la marge gauche ou droite (ex: '4030', '6035', '1100', '500x4') sont des PRIX notés par la pharmacie. Ce ne sont ni des médicaments ni des dosages : ignore-les.
7. NE RIEN OUBLIER : les lignes sont souvent numérotées (1°, 2°, 3°, 4°...). Compte les lignes prescrites et renvoie exactement un élément par ligne, même si l'écriture est difficile : dans ce cas donne ta meilleure lecture avec une confidence basse (ex: 0.4) plutôt que d'omettre la ligne.

Pour chaque produit ou matériel prescrit :
- raw : transcription lettre par lettre de la ligne manuscrite, telle qu'elle est écrite
- name : Nom du produit (ex: 'Ryocef', 'Maxidrol', 'Seringue 10 cc', 'Épicrânienne')
- dosage : Dosage, volume ou spécification (ex: '1 g', '75 mg', '10 ml / 10 cc', '5 ml / 5 cc', 'Collyre', 'Quantité: 8')
- form : Forme ou type (ex: 'Injectable', 'Collyre', 'Dispositif médical / Consommable', 'Comprimé')
- instructions : Quantité prescrite ou posologie (ex: '08 flacons', '08 unités', '2 gttes x 3/j', '1 flacon')
- confidence : Niveau de certitude entre 0.0 et 1.0 (ex: 0.90)

RÉPONDS STRICTEMENT EN JSON VALIDE au format suivant :
{
  "prescribedLineCount": 4,
  "medicines": [
    {
      "raw": "Transcription brute de la ligne",
      "name": "Nom du produit ou dispositif",
      "dosage": "Dosage ou Volume/Taille",
      "form": "Forme ou Consommable",
      "instructions": "Posologie ou Quantité",
      "confidence": 0.90
    }
  ]
}
`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      // Haute résolution : indispensable pour l'écriture manuscrite
      mediaResolution: 'MEDIA_RESOLUTION_HIGH'
    }
  };

  // Modèles disponibles dans l'ordre de priorité (vision OCR haute précision)
  // VITE_GEMINI_MODEL permet de forcer un modèle précis sans toucher au code
  const preferredModel = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_MODEL : null;
  // Les meilleurs modèles réellement disponibles pour la clé (Pro d'abord), puis une liste de secours
  const discovered = await getBestVisionModels(apiKey);
  const models = [...new Set([
    preferredModel,
    ...discovered,
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-flash-latest'
  ].filter(Boolean))];
  let lastError = null;
  const attemptErrors = []; // raison de l'échec de chaque modèle, affichée au patient pour le diagnostic

  // Limites de temps : sans elles, un appel Gemini bloqué laisse « Scan en cours… » indéfiniment
  // Les modèles Pro réfléchissent plus longtemps : on leur laisse plus de temps
  const PER_MODEL_TIMEOUT_MS = 45000;
  const PRO_MODEL_TIMEOUT_MS = 90000;
  const TOTAL_TIMEOUT_MS = 150000;
  const deadline = Date.now() + TOTAL_TIMEOUT_MS;

  for (const model of models) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;
    const controller = new AbortController();
    const modelTimeout = /pro/i.test(model) ? PRO_MODEL_TIMEOUT_MS : PER_MODEL_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), Math.min(modelTimeout, remainingMs));
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiMessage = errorData?.error?.message || `HTTP ${response.status}`;
        // Option haute résolution refusée par ce modèle : on la retire et on réessaie ce modèle
        if (response.status === 400 && /media.?resolution/i.test(apiMessage) && requestBody.generationConfig.mediaResolution) {
          delete requestBody.generationConfig.mediaResolution;
          models.splice(models.indexOf(model) + 1, 0, model);
        }
        // Clé invalide / refusée : inutile d'essayer les autres modèles
        if (response.status === 400 && /api key/i.test(apiMessage) || response.status === 401 || response.status === 403) {
          throw new PrescriptionAnalysisError(`Clé Gemini refusée : ${apiMessage}`, 'BAD_API_KEY');
        }
        throw new Error(`${model} : ${apiMessage}`);
      }

      const data = await response.json();
      // Les modèles récents peuvent renvoyer plusieurs morceaux (dont des « pensées ») : on garde le texte final
      const rawText = (data?.candidates?.[0]?.content?.parts || [])
        .filter((part) => !part.thought)
        .map((part) => part.text || '')
        .join('');
      if (!rawText) throw new Error('Réponse vide du moteur de vision');

      // Nettoyage des balises markdown éventuelles (```json ... ```)
      const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleanText);
      } catch {
        // Tentative d'extraction JSON partielle depuis le texte
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('JSON non parsable dans la réponse');
        }
      }
      const items = Array.isArray(parsed?.medicines)
        ? parsed.medicines
        : Array.isArray(parsed)
        ? parsed
        : [];

      // Blacklist of non-medication terms, medical notes, and French stop words
      const NON_MED_BLACKLIST = new Set([
        'termine', 'terminer', 'terminee', 'fin',
        'ordonnance', 'prescription', 'traitement',
        'signature', 'date', 'cachet', 'tampon', 'dr', 'docteur', 'medecin',
        'patient', 'nom', 'prenom', 'age', 'sexe',
        'posologie', 'matin', 'midi', 'soir', 'coucher', 'jour', 'jours', 'semaine', 'mois',
        'dosage standard', 'standard', 'total', 'quantite', 'nb', 'validite'
      ]);

      const validItems = items.filter((item) => {
        const rawName = (item.name || '').trim().toLowerCase();
        const cleanName = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!cleanName || cleanName.length < 3) return false;
        if (NON_MED_BLACKLIST.has(cleanName)) return false;
        return true;
      });

      if (validItems.length > 0) {
        console.info(`Ordonnance lue par ${model}`);
        const lineCount = Number.isInteger(parsed?.prescribedLineCount) ? parsed.prescribedLineCount : null;
        const medicines = validItems.map((item, index) => ({
          id: `med_ai_${Date.now()}_${index}`,
          name: (item.name || 'Médicament non identifié').trim(),
          dosage: (item.dosage || 'Dosage standard').trim(),
          form: item.form || '',
          instructions: item.instructions || '',
          raw: typeof item.raw === 'string' ? item.raw.trim() : '',
          confidence: typeof item.confidence === 'number' ? Math.min(Math.max(item.confidence, 0.1), 1.0) : 0.90,
          isVerified: typeof item.confidence === 'number' ? item.confidence >= 0.70 : true
        }));
        return { medicines, lineCount };
      }
      // Réponse valide mais aucun produit reconnu
      lastError = new PrescriptionAnalysisError(
        "Aucun médicament lisible sur la photo. Cadrez l'ordonnance en entier, avec un bon éclairage, puis réessayez.",
        'NO_MEDICINE'
      );
      break;
    } catch (err) {
      if (err instanceof PrescriptionAnalysisError) throw err;
      const failure = err?.name === 'AbortError' ? new Error(`${model} : délai de réponse dépassé`) : err;
      console.warn(`Tentative modèle ${model} échouée:`, failure.message);
      attemptErrors.push(failure.message.startsWith(model) ? failure.message : `${model} : ${failure.message}`);
      lastError = failure;
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError instanceof PrescriptionAnalysisError) throw lastError;
  throw new PrescriptionAnalysisError(
    `Le service de lecture d'ordonnance ne répond pas. Détail : ${attemptErrors.join(' | ') || lastError?.message || 'erreur inconnue'}`,
    'API_UNAVAILABLE'
  );
}

// ---------------------------------------------------------------------------
// Vérification en ligne (Gemini + recherche Google) des produits que la base ne connaît pas
// ---------------------------------------------------------------------------
const WEB_CACHE_KEY = 'pharmagarde_web_medicines';
const WEB_LOOKUP_TIMEOUT_MS = 25000;
const MAX_WEB_LOOKUPS = 6;

function needsOnlineCheck(med) {
  return !med.dbMatch || (typeof med.confidence === 'number' && med.confidence < 0.8);
}

function webCacheKey(med) {
  return normalizeMedicineQuery(`${med.name} ${med.dosage || ''}`);
}

function readWebCache() {
  try {
    return JSON.parse(localStorage.getItem(WEB_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeWebCache(cache) {
  try {
    const keys = Object.keys(cache);
    // On garde les 200 dernières recherches
    for (const k of keys.slice(0, Math.max(keys.length - 200, 0))) delete cache[k];
    localStorage.setItem(WEB_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // stockage indisponible : pas de cache
  }
}

async function lookupMedicineOnline(med, apiKey, model) {
  const prompt = `Un médicament a été lu sur une ordonnance MANUSCRITE au Sénégal (Dakar). L'écriture peut avoir été mal lue.
Lecture : « ${med.name} »${med.dosage ? `, dosage « ${med.dosage} »` : ''}${med.instructions ? `, posologie « ${med.instructions} »` : ''}.

Fais une recherche Google pour :
1. Vérifier si un médicament portant ce nom est commercialisé (en priorité au Sénégal et en Afrique de l'Ouest, sinon Maroc, France).
2. Lister les autres noms de médicaments RÉELS qui s'écrivent de façon proche et sont compatibles avec ce dosage (confusions d'écriture manuscrite possibles).

Réponds UNIQUEMENT avec un objet JSON, sans texte autour :
{"found": true, "name": "nom commercial exact", "dci": "principe(s) actif(s)", "dosage": "dosage", "form": "forme", "alternatives": ["autre nom proche"], "confidence": 0.8}
Si rien de fiable n'est trouvé : {"found": false, "alternatives": [], "confidence": 0}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEB_LOOKUP_TIMEOUT_MS);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.1 }
        }),
        signal: controller.signal
      }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const result = JSON.parse(jsonMatch[0]);
    return {
      found: Boolean(result.found && result.name),
      name: (result.name || '').trim(),
      dci: (result.dci || '').trim(),
      dosage: (result.dosage || '').trim(),
      form: (result.form || '').trim(),
      alternatives: Array.isArray(result.alternatives) ? result.alternatives.filter((a) => typeof a === 'string' && a.trim()).slice(0, 3) : [],
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.5
    };
  } finally {
    clearTimeout(timer);
  }
}

async function verifyMedicinesOnline(medicines, apiKey) {
  const model = await getFastModel(apiKey);
  const cache = readWebCache();
  const targets = medicines.filter(needsOnlineCheck).slice(0, MAX_WEB_LOOKUPS);

  const lookups = await Promise.all(
    targets.map(async (med) => {
      const key = webCacheKey(med);
      if (cache[key]) return [med.id, cache[key]];
      try {
        const result = await lookupMedicineOnline(med, apiKey, model);
        if (result) cache[key] = result;
        return [med.id, result];
      } catch (err) {
        console.warn(`Vérification en ligne de ${med.name} échouée:`, err.message);
        return [med.id, null];
      }
    })
  );
  writeWebCache(cache);

  const byId = new Map(lookups);
  return medicines.map((med) => {
    const web = byId.get(med.id);
    if (!web) return med;
    const readName = normalizeMedicineQuery(med.name);
    const alternatives = web.alternatives.filter((a) => {
      const n = normalizeMedicineQuery(a);
      return n && n !== readName && n !== normalizeMedicineQuery(web.name);
    });
    return {
      ...med,
      // La base locale reste prioritaire ; sinon on retient le résultat web
      dbMatch: med.dbMatch || (web.found
        ? { name: web.name, dosage: web.dosage, form: web.form, dci: web.dci, fullTitle: `${web.name} ${web.dosage}`.trim(), score: web.confidence, source: 'web' }
        : null),
      dci: web.dci || med.dbMatch?.dci || '',
      alternatives,
      webVerified: web.found,
      // Produit confirmé en ligne sans autre nom possible : plus besoin de vérifier
      isVerified: med.isVerified || (web.found && web.confidence >= 0.8 && alternatives.length === 0 && normalizeMedicineQuery(web.name) === readName)
    };
  });
}

// ---------------------------------------------------------------------------
// Choix automatique du meilleur modèle Gemini disponible pour la clé
// (les noms de modèles changent souvent : on interroge l'API au lieu de les figer dans le code)
// ---------------------------------------------------------------------------
const MODELS_CACHE_KEY = 'pharmagarde_gemini_models';
const MODELS_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const EXCLUDED_MODEL_WORDS = /(tts|image|embedding|live|audio|native|computer|robotics|nano|gemma|aqa|learnlm|veo|imagen|lite)/i;

function rankModel(name) {
  const tier = /pro/i.test(name) ? 2 : /flash/i.test(name) ? 1 : 0;
  const version = parseFloat((name.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || '0');
  const stable = /preview|exp/i.test(name) ? 0 : 1;
  return tier * 1000 + version * 10 + stable;
}

async function listAvailableModels(apiKey) {
  try {
    const cached = JSON.parse(localStorage.getItem(MODELS_CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.at < MODELS_CACHE_TTL_MS && Array.isArray(cached.models)) return cached.models;
  } catch {
    // cache illisible : on interroge l'API
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${apiKey}`, { signal: controller.signal });
    if (!response.ok) return [];
    const data = await response.json();
    const models = (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => (m.name || '').replace(/^models\//, ''))
      .filter((name) => name.startsWith('gemini-') && !EXCLUDED_MODEL_WORDS.test(name));
    try {
      localStorage.setItem(MODELS_CACHE_KEY, JSON.stringify({ at: Date.now(), models }));
    } catch {
      // stockage indisponible
    }
    return models;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// Lecture d'ordonnance : les 2 meilleurs Pro puis le meilleur Flash
async function getBestVisionModels(apiKey) {
  const ranked = (await listAvailableModels(apiKey)).sort((a, b) => rankModel(b) - rankModel(a));
  const pros = ranked.filter((m) => /pro/i.test(m)).slice(0, 2);
  const flashes = ranked.filter((m) => /flash/i.test(m)).slice(0, 1);
  return [...pros, ...flashes];
}

// Recherche web : un modèle Flash suffit et répond plus vite
async function getFastModel(apiKey) {
  const ranked = (await listAvailableModels(apiKey)).sort((a, b) => rankModel(b) - rankModel(a));
  return ranked.find((m) => /flash/i.test(m)) || 'gemini-2.5-flash';
}

/**
 * Rapproche chaque produit lu de la base officielle des médicaments.
 * Un produit introuvable n'est pas supprimé mais marqué « à vérifier ».
 */
function attachDatabaseMatch(med) {
  const match = findBestMedicineMatch(med.name, med.dosage);
  if (!match) {
    return { ...med, dbMatch: null, isVerified: false };
  }
  return {
    ...med,
    dbMatch: {
      id: match.item.id,
      name: match.item.name,
      dosage: match.item.dosage,
      form: match.item.form,
      fullTitle: match.item.fullTitle,
      score: match.score
    },
    // Faute de lecture probable si le nom a dû être corrigé
    isVerified: med.isVerified && match.score === 1
  };
}

/**
 * Version allégée de la photo envoyée aux pharmacies (aperçu lisible, ~200 Ko au lieu de plusieurs Mo)
 */
export function compressPhotoForSharing(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return Promise.resolve(dataUrl);
  return optimizeImageForOcr(dataUrl, 1400, 0.75);
}

/**
 * Optimizes oversized mobile photos for OCR transmission
 * (convertit aussi en JPEG quand le navigateur sait décoder l'image ; PDF transmis tel quel)
 */
function optimizeImageForOcr(dataUrl, maxDimension = 2400, quality = 0.92) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.Image) return resolve(dataUrl);
    if (/^data:application\/pdf/i.test(dataUrl)) return resolve(dataUrl);
    const img = new window.Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
