// Script to parse, clean and generate structured medicine database for React & Flutter
import fs from 'fs';
import path from 'path';

// Sources : liste officielle des dénominations (scripts/data/medicaments_denominations.txt)
// + compléments locaux Sénégal (scripts/data/complements_senegal.txt).
// Une dénomination par ligne ; les lignes vides ou commençant par # sont ignorées.
const SOURCE_FILES = [
  'scripts/data/medicaments_denominations.txt',
  'scripts/data/complements_senegal.txt'
];

const rawMedicines = SOURCE_FILES.flatMap((file) =>
  fs
    .readFileSync(path.resolve(file), 'utf-8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
);

// Clean function to normalize accents and spaces
function normalize(str) {
  return str
    ? str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}

// Extract Name, Dosage, Form from denomination
function parseMedicine(line) {
  let cleaned = line.replace(/^"|"$/g, '').trim();
  
  // Split on ", " only: decimal commas ("0,5 POUR CENT", "7,5 mg") have no trailing space
  let parts = cleaned.split(/,\s+/);
  let nameAndDosage = parts[0].trim();
  let form = parts.slice(1).join(', ').trim() || 'Forme standard';

  // Dosage regex
  const dosageRegex = /(?<![A-Za-z\d])(\d+[\d\s.,]*\s*(?:mg|g|µg|microgrammes|ui|u\.i\.|u|units|unités|mmol|%|pour cent|ml|l|sachet|million[s]?|m\.u\.i\.|mui)(?:\s*\/\s*[\d\s.,]*\s*(?:mg|g|ml|l|dose))?)/i;
  const match = nameAndDosage.match(dosageRegex);

  let dosage = 'Dosage standard';
  let name = nameAndDosage;

  if (match) {
    dosage = match[0].trim();
    name = nameAndDosage.replace(dosage, '').replace(/\s+/g, ' ').trim();
  }

  // Capitalize name properly
  const formattedName = name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return {
    raw: cleaned,
    name: formattedName,
    normalized: normalize(name),
    dosage: dosage,
    form: form
  };
}

// Deduplicate and process
const seen = new Set();
const processed = [];

for (const raw of rawMedicines) {
  const parsed = parseMedicine(raw);
  const key = `${parsed.normalized}_${normalize(parsed.dosage)}`;
  if (!seen.has(key)) {
    seen.add(key);
    processed.push({
      id: `med_${processed.length + 1}`,
      name: parsed.name,
      normalized: parsed.normalized,
      dosage: parsed.dosage,
      form: parsed.form,
      fullTitle: `${parsed.name} ${parsed.dosage}`.trim()
    });
  }
}

console.log(`Generated ${processed.length} unique medicines.`);

// Write JSON for React
const reactDest = path.resolve('src/data/medicinesDb.json');
fs.writeFileSync(reactDest, JSON.stringify(processed), 'utf-8');
console.log(`Saved React medicines to ${reactDest}`);

// Write Dart static list for Flutter
const dartStr = (str) => str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$');

const flutterCode = `// Generated Medicines Database for fast patient search
class MedicineItem {
  final String id;
  final String name;
  final String normalized;
  final String dosage;
  final String form;
  final String fullTitle;

  const MedicineItem({
    required this.id,
    required this.name,
    required this.normalized,
    required this.dosage,
    required this.form,
    required this.fullTitle,
  });
}

class MedicinesDatabase {
  static const List<MedicineItem> all = [
${processed
  .map(
    m => `    MedicineItem(
      id: '${m.id}',
      name: '${dartStr(m.name)}',
      normalized: '${m.normalized}',
      dosage: '${dartStr(m.dosage)}',
      form: '${dartStr(m.form)}',
      fullTitle: '${dartStr(m.fullTitle)}',
    ),`
  )
  .join('\n')}
  ];
}
`;

const flutterDest = path.resolve('flutter_pharmagarde/lib/data/medicines_database.dart');
fs.writeFileSync(flutterDest, flutterCode, 'utf-8');
console.log(`Saved Flutter medicines to ${flutterDest}`);
