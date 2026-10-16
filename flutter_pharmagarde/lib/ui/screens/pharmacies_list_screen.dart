import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/pharmacy_model.dart';
import '../../services/state_notifier.dart';

class PharmaciesListScreen extends StatelessWidget {
  final PharmaGardeState state;
  final VoidCallback onBack;
  final Function(PharmacyModel) onCall;
  final Function(PharmacyModel) onItinerary;

  const PharmaciesListScreen({
    super.key,
    required this.state,
    required this.onBack,
    required this.onCall,
    required this.onItinerary,
  });

  @override
  Widget build(BuildContext context) {
    final sortedPharmacies = List<PharmacyModel>.from(state.pharmacies)
      ..sort((a, b) => a.distanceKm.compareTo(b.distanceKm));

    final closestPharmacy = sortedPharmacies.isNotEmpty ? sortedPharmacies.first : null;
    final otherPharmacies = sortedPharmacies.isNotEmpty ? sortedPharmacies.sublist(1) : <PharmacyModel>[];

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // Top Header: Back Button + Title
            Row(
              children: [
                GestureDetector(
                  onTap: onBack,
                  child: Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.arrow_back, size: 20, color: Color(0xFF1A332E)),
                  ),
                ),
                const SizedBox(width: 14),
                const Text(
                  'Pharmacies',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF004740),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Nearest Pharmacy - Featured Card
            if (closestPharmacy != null) ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF3FBF8), Color(0xFFE6F7F1)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0x3D005F56), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF004740).withOpacity(0.14),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Badge: Plus proche de vous
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF005F56),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.star, size: 12, color: Color(0xFF5CE1B6)),
                              SizedBox(width: 4),
                              Text(
                                'PLUS PROCHE DE VOUS',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF5CE1B6).withOpacity(0.35),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${closestPharmacy.distanceKm} km',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF004740),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Name
                    Text(
                      closestPharmacy.name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF004740),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      closestPharmacy.address,
                      style: const TextStyle(fontSize: 13, color: Color(0xFF526E6A)),
                    ),
                    const SizedBox(height: 10),

                    // Hours & Duty
                    Row(
                      children: [
                        Icon(
                          Icons.access_time_rounded,
                          size: 15,
                          color: closestPharmacy.isDuty24h ? const Color(0xFF10B981) : const Color(0xFF526E6A),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          closestPharmacy.openingHours,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: closestPharmacy.isDuty24h ? const Color(0xFF047857) : const Color(0xFF526E6A),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Action buttons (Itinéraire & Appeler)
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => onItinerary(closestPharmacy),
                            icon: const Icon(Icons.navigation, size: 16),
                            label: const Text('Itinéraire', style: TextStyle(fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF005F56),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => onCall(closestPharmacy),
                            icon: const Icon(Icons.phone, size: 16),
                            label: const Text('Appeler', style: TextStyle(fontWeight: FontWeight.bold)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF005F56),
                              side: const BorderSide(color: Color(0xFF005F56), width: 1.5),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Other Pharmacies
            const Text(
              'Autres officines à proximité',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Color(0xFF334155),
              ),
            ),
            const SizedBox(height: 12),

            ...otherPharmacies.map((pharmacy) => Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              pharmacy.name,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '${pharmacy.distanceKm} km',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF475569),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        pharmacy.address,
                        style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 14,
                            color: pharmacy.isDuty24h ? const Color(0xFF10B981) : const Color(0xFF64748B),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            pharmacy.openingHours,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: pharmacy.isDuty24h ? const Color(0xFF047857) : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => onItinerary(pharmacy),
                              icon: const Icon(Icons.navigation, size: 14),
                              label: const Text('Itinéraire', style: TextStyle(fontSize: 13)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFF1F5F9),
                                foregroundColor: const Color(0xFF004740),
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => onCall(pharmacy),
                              icon: const Icon(Icons.phone, size: 14),
                              label: const Text('Appeler', style: TextStyle(fontSize: 13)),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF004740),
                                side: const BorderSide(color: Color(0xFFCBD5E1)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
