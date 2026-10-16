import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../services/state_notifier.dart';
import '../../data/models/medicine_model.dart';
import 'search_results_screen.dart';

class ScanScreen extends StatefulWidget {
  final PharmaGardeState state;

  const ScanScreen({super.key, required this.state});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  int _selectedPreset = 0;
  bool _isProcessing = false;
  String _processingStep = "Lecture de l'ordonnance";
  double _progress = 0.3;

  final List<Map<String, dynamic>> _samplePrescriptions = [
    {
      'title': 'Dr. Amadou Fall (3 méd.)',
      'doctor': 'Dr. Amadou Fall - Médecine Générale',
      'medicines': [
        const MedicineModel(id: '1', name: 'Amoxicilline', dosage: '500 mg', confidence: 0.96),
        const MedicineModel(id: '2', name: 'Paracétamol', dosage: '1 g', confidence: 0.94),
        const MedicineModel(id: '3', name: 'Ibuprofène', dosage: '400 mg', confidence: 0.88),
      ],
    },
    {
      'title': 'Pédiatrie CHN Pikine (2 méd.)',
      'doctor': 'Dr. Fatou Ndiaye - Pédiatrie',
      'medicines': [
        const MedicineModel(id: '4', name: 'Sérum oral (SRO)', dosage: 'Sachet 1L', confidence: 0.98),
        const MedicineModel(id: '5', name: 'Métronidazole', dosage: '500 mg', confidence: 0.91),
      ],
    },
  ];

  Future<void> _startOcrProcessing() async {
    setState(() {
      _isProcessing = true;
      _processingStep = "Lecture de l'ordonnance";
      _progress = 0.3;
    });

    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() {
      _processingStep = "Identification des médicaments";
      _progress = 0.7;
    });

    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() {
      _processingStep = "Recherche des pharmacies";
      _progress = 1.0;
    });

    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;

    final meds = _samplePrescriptions[_selectedPreset]['medicines'] as List<MedicineModel>;
    widget.state.setPrescriptionMedicines(meds);

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => SearchResultsScreen(
          state: widget.state,
          medicines: meds,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isProcessing) {
      return Scaffold(
        backgroundColor: const Color(0xFF041715),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 120,
                  height: 160,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0A2623),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.mint.withOpacity(0.5)),
                  ),
                  child: const Center(
                    child: Icon(Icons.document_scanner, size: 48, color: AppTheme.mint),
                  ),
                ),
                const SizedBox(height: 28),
                const Text(
                  "Traitement de l'ordonnance",
                  style: TextStyle(
                    fontFamily: 'serif',
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _processingStep,
                  style: const TextStyle(fontSize: 14, color: AppTheme.mint),
                ),
                const SizedBox(height: 24),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: _progress,
                    backgroundColor: const Color(0xFF0D3833),
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.mint),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final currentMeds = _samplePrescriptions[_selectedPreset]['medicines'] as List<MedicineModel>;

    return Scaffold(
      backgroundColor: const Color(0xFF041715),
      appBar: AppBar(
        backgroundColor: const Color(0xFF041715),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Scanner l'ordonnance",
          style: TextStyle(color: AppTheme.mint, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Camera Target Viewfinder
          Expanded(
            child: Center(
              child: Container(
                width: 310,
                height: 380,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.mint, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.mint.withOpacity(0.2),
                      blurRadius: 20,
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'RÉPUBLIQUE DU SÉNÉGAL',
                      style: TextStyle(
                        fontFamily: 'serif',
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary,
                      ),
                    ),
                    Text(
                      _samplePrescriptions[_selectedPreset]['doctor'],
                      style: const TextStyle(fontSize: 11, color: Colors.black54),
                    ),
                    const Divider(color: AppTheme.primary, thickness: 1.5),
                    const SizedBox(height: 8),
                    ...currentMeds.map(
                      (m) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(6),
                          border: const Border(left: BorderSide(color: AppTheme.primary, width: 3)),
                        ),
                        child: Text(
                          '${m.name} ${m.dosage}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Preset prescription selector
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _samplePrescriptions.length,
              itemBuilder: (context, idx) {
                final isSel = _selectedPreset == idx;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(_samplePrescriptions[idx]['title']),
                    selected: isSel,
                    selectedColor: AppTheme.mint,
                    onSelected: (val) {
                      if (val) setState(() => _selectedPreset = idx);
                    },
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),

          // Confirm Action
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            decoration: const BoxDecoration(
              color: Color(0xFF031210),
              border: Border(top: BorderSide(color: Color(0xFF113833))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _startOcrProcessing,
                    icon: const Icon(Icons.check_circle, color: AppTheme.primaryDark),
                    label: const Text(
                      'Confirmer la photo',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryDark,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.mint,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
