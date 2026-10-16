import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/pharmacy_model.dart';
import '../../core/constants/mock_data.dart';
import '../../core/widgets/dakar_osm_map.dart';
import '../modals/call_modal.dart';
import '../modals/itinerary_modal.dart';

class DutyPharmaciesScreen extends StatefulWidget {
  const DutyPharmaciesScreen({super.key});

  @override
  State<DutyPharmaciesScreen> createState() => _DutyPharmaciesScreenState();
}

class _DutyPharmaciesScreenState extends State<DutyPharmaciesScreen> {
  bool _isMapView = false;
  PharmacyModel? _selectedPharmacy;

  @override
  Widget build(BuildContext context) {
    final dutyPharmacies = MockData.initialPharmacies.where((p) => p.isDuty24h).toList();

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      children: [
        // Title matching Screenshot 3
        const Text(
          "Pharmacies de garde aujourd'hui",
          style: TextStyle(
            fontFamily: 'serif',
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: AppTheme.primary,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 4),
        const Row(
          children: [
            Icon(Icons.circle, size: 8, color: AppTheme.accentGreen),
            SizedBox(width: 6),
            Text(
              "Aujourd'hui · Ouvertes 24h/24 et la nuit",
              style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Toggle Switch: Liste / Carte from Screenshot 3
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: const Color(0xFFEAEFEF),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => setState(() => _isMapView = false),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: !_isMapView ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: !_isMapView
                          ? [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4)]
                          : null,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.format_list_bulleted,
                          size: 16,
                          color: !_isMapView ? AppTheme.primaryDark : AppTheme.textMuted,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Liste',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: !_isMapView ? AppTheme.primaryDark : AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: () => setState(() => _isMapView = true),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: _isMapView ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: _isMapView
                          ? [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4)]
                          : null,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.map,
                          size: 16,
                          color: _isMapView ? AppTheme.primaryDark : AppTheme.textMuted,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Carte',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: _isMapView ? AppTheme.primaryDark : AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Real Interactive OpenStreetMap View
        Container(
          height: _isMapView ? 340 : 160,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppTheme.borderColor),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Stack(
            children: [
              DakarOsmMap(
                pharmacies: dutyPharmacies,
                selectedPharmacy: _selectedPharmacy,
                initialZoom: _isMapView ? 13.5 : 12.5,
                onPharmacySelected: (pharmacy) {
                  setState(() {
                    _selectedPharmacy = pharmacy;
                  });
                },
              ),
              Positioned(
                top: 10,
                left: 10,
                right: 10,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 4),
                        ],
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.near_me, size: 12, color: AppTheme.primary),
                          SizedBox(width: 4),
                          Text(
                            'À proximité',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 4),
                        ],
                      ),
                      child: const Text(
                        'Pikine - Guédiawaye',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
                      ),
                    ),
                  ],
                ),
              ),
              Positioned(
                bottom: 10,
                left: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    borderRadius: BorderRadius.circular(999),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 4),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.nightlight_round, color: Colors.white, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        '${dutyPharmacies.length} ouvertes la nuit',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        if (_selectedPharmacy != null && _isMapView) ...[
          const SizedBox(height: 14),
          _DutyCard(pharmacy: _selectedPharmacy!, isFeatured: true),
        ],
        const SizedBox(height: 16),

        // Duty Pharmacies List Cards
        ...dutyPharmacies.map((pharmacy) => _DutyCard(pharmacy: pharmacy)),

        const SizedBox(height: 14),

        // Share button from Screenshot 3
        ElevatedButton.icon(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Lien copié dans le presse-papiers !')),
            );
          },
          icon: const Icon(Icons.share, color: Colors.white, size: 18),
          label: const Text(
            'Partager la liste des officines de garde',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF10B981),
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
        const SizedBox(height: 14),

        const Center(
          child: Text(
            "Données officielles mises à jour par l'Ordre des Pharmaciens.",
            style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
        ),
      ],
    );
  }
}

class _DutyCard extends StatelessWidget {
  final PharmacyModel pharmacy;
  final bool isFeatured;

  const _DutyCard({
    required this.pharmacy,
    this.isFeatured = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isFeatured ? const Color(0xFFF0FDF9) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isFeatured ? AppTheme.primary : AppTheme.borderColor,
          width: isFeatured ? 2.0 : 1.0,
        ),
        boxShadow: isFeatured
            ? [
                BoxShadow(
                  color: AppTheme.primary.withOpacity(0.12),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
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
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF064E3B),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'DE GARDE',
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFECFDF5)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${pharmacy.address} · ${pharmacy.formattedDistance}',
            style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.mintSoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  '● Ouverte maintenant',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  pharmacy.landmark,
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => CallModal(pharmacy: pharmacy),
                    );
                  },
                  icon: const Icon(Icons.phone, size: 16),
                  label: const Text('Appeler', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: const StadiumBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => ItineraryModal(pharmacy: pharmacy),
                    );
                  },
                  icon: const Icon(Icons.navigation, size: 16, color: AppTheme.primaryDark),
                  label: const Text('Itinéraire', style: TextStyle(color: AppTheme.primaryDark, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE9ECEF),
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: const StadiumBorder(),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
