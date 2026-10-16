// PharmaGarde Prescription Vision & OCR Engine
// Anonymized extraction of medications with strict patient privacy protection

import { storageService } from './storageService.js';
import { findBestMedicineMatch } from './medicineSearchService.js';

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
    medicines = (await callVisionExtractionApi(optimizedImage, apiKey)).map(attachDatabaseMatch);
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

Pour chaque produit ou matériel prescrit :
- name : Nom du produit (ex: 'Ryocef', 'Maxidrol', 'Seringue 10 cc', 'Épicrânienne')
- dosage : Dosage, volume ou spécification (ex: '1 g', '75 mg', '10 ml / 10 cc', '5 ml / 5 cc', 'Collyre', 'Quantité: 8')
- form : Forme ou type (ex: 'Injectable', 'Collyre', 'Dispositif médical / Consommable', 'Comprimé')
- instructions : Quantité prescrite ou posologie (ex: '08 flacons', '08 unités', '2 gttes x 3/j', '1 flacon')
- confidence : Niveau de certitude entre 0.0 et 1.0 (ex: 0.90)

RÉPONDS STRICTEMENT EN JSON VALIDE au format suivant :
{
  "medicines": [
    {
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
      responseMimeType: "application/json"
    }
  };

  // Modèles disponibles dans l'ordre de priorité (vision OCR haute précision)
  // VITE_GEMINI_MODEL permet de forcer un modèle précis sans toucher au code
  const preferredModel = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_MODEL : null;
  const models = [...new Set([
    preferredModel,
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest'
  ].filter(Boolean))];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiMessage = errorData?.error?.message || `HTTP ${response.status}`;
        // Clé invalide / refusée : inutile d'essayer les autres modèles
        if (response.status === 400 && /api key/i.test(apiMessage) || response.status === 401 || response.status === 403) {
          throw new PrescriptionAnalysisError(`Clé Gemini refusée : ${apiMessage}`, 'BAD_API_KEY');
        }
        throw new Error(`${model} : ${apiMessage}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
        return validItems.map((item, index) => ({
          id: `med_ai_${Date.now()}_${index}`,
          name: (item.name || 'Médicament non identifié').trim(),
          dosage: (item.dosage || 'Dosage standard').trim(),
          form: item.form || '',
          instructions: item.instructions || '',
          confidence: typeof item.confidence === 'number' ? Math.min(Math.max(item.confidence, 0.1), 1.0) : 0.90,
          isVerified: typeof item.confidence === 'number' ? item.confidence >= 0.70 : true
        }));
      }
      // Réponse valide mais aucun produit reconnu
      lastError = new PrescriptionAnalysisError(
        "Aucun médicament lisible sur la photo. Cadrez l'ordonnance en entier, avec un bon éclairage, puis réessayez.",
        'NO_MEDICINE'
      );
      break;
    } catch (err) {
      if (err instanceof PrescriptionAnalysisError) throw err;
      console.warn(`Tentative modèle ${model} échouée:`, err.message);
      lastError = err;
    }
  }

  if (lastError instanceof PrescriptionAnalysisError) throw lastError;
  throw new PrescriptionAnalysisError(
    `Le service de lecture d'ordonnance ne répond pas (${lastError?.message || 'erreur inconnue'}). Réessayez dans un instant.`,
    'API_UNAVAILABLE'
  );
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
 * Optimizes oversized mobile photos for OCR transmission
 * (convertit aussi en JPEG quand le navigateur sait décoder l'image ; PDF transmis tel quel)
 */
function optimizeImageForOcr(dataUrl, maxDimension = 1800, quality = 0.90) {
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
