# Lancer PharmaGarde sur PC

1. Installer Node.js 20+ puis, dans le dossier du projet :
   ```bash
   npm install
   cp .env.example .env   # puis coller la clé Gemini dans VITE_GEMINI_API_KEY
   npm run dev
   ```
2. Ouvrir les deux liens (deux onglets ou deux fenêtres) :
   - Patient : http://localhost:5173/?role=patient
   - Pharmacie : http://localhost:5173/?role=pharmacie (connexion automatique « Pharmacie Test »)

Les demandes envoyées par le patient arrivent en temps réel côté pharmacie.
Sur un site déployé (Netlify…), les mêmes paramètres fonctionnent :
`https://<votre-site>/?role=patient` et `https://<votre-site>/?role=pharmacie`.

## Base des médicaments
La base (`src/data/medicinesDb.json` + version Flutter) est générée depuis
`scripts/data/medicaments_denominations.txt` et `scripts/data/complements_senegal.txt` :
```bash
node scripts/generateMedicinesDb.js
```
Pour ajouter un produit local, ajoutez une ligne dans `complements_senegal.txt`
(format : `NOM DOSAGE, forme`) puis relancez la commande.
