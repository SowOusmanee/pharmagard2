import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../services/state_notifier.dart';
import '../../data/models/medicine_model.dart';
import '../../data/medicines_database.dart';
import '../../services/fast_medicine_search_service.dart';
import 'search_results_screen.dart';

class MedicineSearchScreen extends StatefulWidget {
  final PharmaGardeState state;

  const MedicineSearchScreen({super.key, required this.state});

  @override
  State<MedicineSearchScreen> createState() => _MedicineSearchScreenState();
}

class _MedicineSearchScreenState extends State<MedicineSearchScreen> {
  final TextEditingController _controller = TextEditingController();
  List<MedicineItem> _suggestions = [];

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _controller.removeListener(_onSearchChanged);
    _controller.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _controller.text.trim();
    if (query.length >= 2) {
      final results = FastMedicineSearchService.search(query, limit: 5);
      setState(() {
        _suggestions = results;
      });
    } else {
      if (_suggestions.isNotEmpty) {
        setState(() {
          _suggestions = [];
        });
      }
    }
  }

  final List<Map<String, String>> _frequentMedicines = [
    {'name': 'Paracétamol', 'dosage': '1 g'},
    {'name': 'Amoxicilline', 'dosage': '500 mg'},
    {'name': 'Ibuprofène', 'dosage': '400 mg'},
    {'name': 'Sérum oral (SRO)', 'dosage': 'Sachet 1L'},
    {'name': 'Métronidazole', 'dosage': '500 mg'},
    {'name': 'Artéméther', 'dosage': '80 mg'},
  ];

  void _triggerSearch(String name, String dosage) {
    final med = MedicineModel(id: 'search_med', name: name, dosage: dosage);
    widget.state.setPrescriptionMedicines([med]);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SearchResultsScreen(
          state: widget.state,
          medicines: [med],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      children: [
        // Title matching Screenshot 1
        const Text(
          'Rechercher un médicament',
          style: TextStyle(
            fontFamily: 'serif',
            fontSize: 26,
            fontWeight: FontWeight.bold,
            color: AppTheme.primary,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Consultez la disponibilité immédiate en pharmacie',
          style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 16),

        // Search Input Box
        Container(
          decoration: BoxDecoration(
            color: AppTheme.bgInput,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFC2EBE2), width: 1.5),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          child: Row(
            children: [
              const Icon(Icons.search, color: AppTheme.primary, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _controller,
                  decoration: const InputDecoration(
                    hintText: 'Nom du médicament (ex: Amoxicilline)',
                    hintStyle: TextStyle(fontSize: 14, color: AppTheme.textMuted),
                    border: InputBorder.none,
                  ),
                  onSubmitted: (val) {
                    if (val.trim().isNotEmpty) {
                      _triggerSearch(val.trim(), 'Standard');
                    }
                  },
                ),
              ),
              if (_controller.text.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.clear, size: 18, color: Colors.grey),
                  onPressed: () {
                    setState(() {
                      _controller.clear();
                      _suggestions = [];
                    });
                  },
                ),
            ],
          ),
        ),

        // Instant Suggestions Dropdown
        if (_suggestions.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFC2EBE2), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withOpacity(0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _suggestions.length,
              separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
              itemBuilder: (context, index) {
                final item = _suggestions[index];
                return ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  title: Text(
                    item.name,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryDark,
                    ),
                  ),
                  subtitle: Text(
                    '${item.dosage} • ${item.form}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                  trailing: const Icon(Icons.arrow_outward, size: 16, color: AppTheme.primary),
                  onTap: () {
                    _controller.text = item.name;
                    _triggerSearch(item.name, item.dosage);
                  },
                );
              },
            ),
          ),
        const SizedBox(height: 20),

        // Médicaments fréquents (ACCÈS DIRECT) from Screenshot 1
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Médicaments fréquents',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppTheme.textMain,
              ),
            ),
            Text(
              'ACCÈS DIRECT',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: AppTheme.primary,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Quick Access Chips 2-Column Grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 2.6,
          ),
          itemCount: _frequentMedicines.length,
          itemBuilder: (context, index) {
            final item = _frequentMedicines[index];
            return InkWell(
              onTap: () => _triggerSearch(item['name']!, item['dosage']!),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.mintChip,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        item['name']!,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryDark,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const Icon(Icons.arrow_outward, size: 16, color: AppTheme.primary),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 18),

        // Primary Search Button
        ElevatedButton.icon(
          onPressed: () {
            final query = _controller.text.trim();
            if (query.isNotEmpty) {
              _triggerSearch(query, 'Standard');
            } else {
              // Default to Amoxicilline demo
              _triggerSearch('Amoxicilline', '500 mg');
            }
          },
          icon: const Icon(Icons.search, size: 20),
          label: const Text(
            'Rechercher',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            shape: const StadiumBorder(),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
        ),
        const SizedBox(height: 18),

        // MODE RÉSILIENT Banner from Screenshot 1
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF4F6F6),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: const BoxDecoration(
                  color: Color(0xFFD1F4EC),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.cell_tower, color: AppTheme.primary, size: 18),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'MODE RÉSILIENT',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary,
                        letterSpacing: 0.5,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Connexion lente... les disponibilités locales et officines de garde restent consultables hors-ligne.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF4A5568),
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
