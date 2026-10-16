import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/medicine_model.dart';
import '../../data/models/pharmacy_model.dart';
import '../../services/state_notifier.dart';

class ConfirmedPharmaciesScreen extends StatefulWidget {
  final PharmaGardeState state;
  final List<MedicineModel> medicines;
  final VoidCallback onBackToHome;
  final Function(PharmacyModel) onCall;
  final Function(PharmacyModel) onItinerary;

  const ConfirmedPharmaciesScreen({
    super.key,
    required this.state,
    required this.medicines,
    required this.onBackToHome,
    required this.onCall,
    required this.onItinerary,
  });

  @override
  State<ConfirmedPharmaciesScreen> createState() => _ConfirmedPharmaciesScreenState();
}

class _ConfirmedPharmaciesScreenState extends State<ConfirmedPharmaciesScreen> {
  bool _showPrescriptionDetails = false;

  @override
  Widget build(BuildContext context) {
    final searchResults = widget.state.calculateRankedPharmacies(widget.medicines);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar: Back to Home + Screen Title
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: widget.onBackToHome,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.06),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Icon(Icons.arrow_back, size: 20, color: Color(0xFF004740)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Résultats & Disponibilités',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF004740),
                        ),
                      ),
                      Text(
                        'Officines les plus proches à Dakar',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF526E6A),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Scrollable Content
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                children: [
                  // 1. Slim Discreet Prescription Strip
                  if (widget.medicines.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE5EBEA)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          InkWell(
                            onTap: () {
                              setState(() {
                                _showPrescriptionDetails = !_showPrescriptionDetails;
                              });
                            },
                            child: Row(
                              children: [
                                Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE6FAF5),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.receipt_long, size: 16, color: Color(0xFF005F56)),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    '${widget.medicines.length} médicament${widget.medicines.length > 1 ? "s" : ""} recherché${widget.medicines.length > 1 ? "s" : ""}',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF004740),
                                    ),
                                  ),
                                ),
                                Icon(
                                  _showPrescriptionDetails ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                  color: const Color(0xFF526E6A),
                                ),
                              ],
                            ),
                          ),
                          if (_showPrescriptionDetails) ...[
                            const SizedBox(height: 10),
                            const Divider(height: 1, color: Color(0xFFF1F5F9)),
                            const SizedBox(height: 10),
                            ...widget.medicines.map((m) => Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        m.name,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF1E293B),
                                        ),
                                      ),
                                      Text(
                                        m.dosage,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ),
                                )),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],

                  // 2. Ranked Pharmacies List
                  ...searchResults.map((res) {
                    final pharm = res.pharmacy;
                    final isComplete = res.isComplete;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isComplete ? const Color(0xFF5CE1B6) : const Color(0xFFE2E8F0),
                          width: isComplete ? 1.5 : 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: isComplete
                                ? const Color(0xFF005F56).withOpacity(0.08)
                                : Colors.black.withOpacity(0.03),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header (Pharmacy Name + Distance + Availability Pill)
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      pharm.name,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF004740),
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '${pharm.distanceKm} km • ${pharm.address}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF526E6A),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isComplete ? const Color(0xFFE6FAF5) : const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(
                                    color: isComplete ? const Color(0xFF5CE1B6) : const Color(0xFFFDE68A),
                                  ),
                                ),
                                child: Text(
                                  '${res.availableCount}/${res.totalRequested} Dispo',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: isComplete ? const Color(0xFF004740) : const Color(0xFFB45309),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Medicines Breakdown Chips
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: res.medicinesBreakdown.map((item) {
                              final isAvail = item.status == AvailabilityStatus.available;
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isAvail ? const Color(0xFFF0FAF7) : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isAvail ? const Color(0xFFC8ECE3) : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      isAvail ? Icons.check_circle : Icons.cancel_outlined,
                                      size: 13,
                                      color: isAvail ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                                    ),
                                    const SizedBox(width: 5),
                                    Text(
                                      '${item.name} ${item.dosage}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: isAvail ? const Color(0xFF004740) : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 14),

                          // Action Buttons: Itinéraire + Appeler
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () => widget.onItinerary(pharm),
                                  icon: const Icon(Icons.navigation, size: 15),
                                  label: const Text('Itinéraire', style: TextStyle(fontWeight: FontWeight.bold)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: isComplete ? const Color(0xFF005F56) : const Color(0xFFF1F5F9),
                                    foregroundColor: isComplete ? Colors.white : const Color(0xFF004740),
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => widget.onCall(pharm),
                                  icon: const Icon(Icons.phone, size: 15),
                                  label: const Text('Appeler', style: TextStyle(fontWeight: FontWeight.bold)),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: const Color(0xFF005F56),
                                    side: const BorderSide(color: Color(0xFF005F56), width: 1.2),
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
