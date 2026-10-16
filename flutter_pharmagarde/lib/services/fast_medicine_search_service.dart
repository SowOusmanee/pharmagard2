import '../data/medicines_database.dart';

class FastMedicineSearchService {
  static String normalize(String str) {
    return str
        .toLowerCase()
        .replaceAll(RegExp(r'[éèêë]'), 'e')
        .replaceAll(RegExp(r'[àâ]'), 'a')
        .replaceAll(RegExp(r'[ùû]'), 'u')
        .replaceAll(RegExp(r'[îï]'), 'i')
        .replaceAll(RegExp(r'[ô]'), 'o')
        .replaceAll(RegExp(r'[^a-z0-9]'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  /// Searches medicines instantly with prefix, substring and multi-token matching
  static List<MedicineItem> search(String query, {int limit = 5}) {
    final clean = normalize(query);
    if (clean.length < 2) return [];

    final terms = clean.split(' ').where((t) => t.isNotEmpty).toList();

    final List<MedicineItem> exact = [];
    final List<MedicineItem> startsWith = [];
    final List<MedicineItem> contains = [];
    final List<MedicineItem> fuzzy = [];

    for (final item in MedicinesDatabase.all) {
      final fullNorm = '${item.normalized} ${normalize(item.dosage)}';

      final matchesAll = terms.every((t) => fullNorm.contains(t));

      if (matchesAll) {
        if (item.normalized == clean) {
          exact.add(item);
        } else if (item.normalized.startsWith(clean)) {
          startsWith.add(item);
        } else {
          contains.add(item);
        }
      } else if (clean.length >= 3 && terms.any((t) => t.length >= 3 && fullNorm.contains(t))) {
        fuzzy.add(item);
      }

      if (exact.length + startsWith.length + contains.length >= limit * 2) {
        break;
      }
    }

    final combined = [...exact, ...startsWith, ...contains, ...fuzzy];
    final Set<String> seen = {};
    final List<MedicineItem> results = [];

    for (final m in combined) {
      if (!seen.contains(m.id)) {
        seen.add(m.id);
        results.add(m);
        if (results.length >= limit) break;
      }
    }

    return results;
  }
}
