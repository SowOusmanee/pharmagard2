import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../services/state_notifier.dart';
import '../../data/models/medicine_model.dart';
import '../modals/call_modal.dart';
import '../modals/itinerary_modal.dart';

class SearchResultsScreen extends StatefulWidget {
  final PharmaGardeState state;
  final List<MedicineModel> medicines;

  const SearchResultsScreen({
    super.key,
    required this.state,
    required this.medicines,
  });

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  String _filter = 'all'; // 'all' | 'stock' | 'duty'

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.state,
      builder: (context, _) {
        final ranked = widget.state.calculateRankedPharmacies(widget.medicines);
        final filtered = ranked.where((r) {
          if (_filter == 'stock') return r.availableCount > 0;
          if (_filter == 'duty') return r.pharmacy.isDuty24h;
          return true;
        }).toList();

        final medTitle = widget.medicines.map((m) => m.name).join(', ');

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => Navigator.pop(context),
            ),
            title: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.location_on, size: 16, color: AppTheme.primary),
                const SizedBox(width: 4),
                Text(
                  '${widget.state.selectedZone == 'pikine' ? 'Pikine' : 'Guédiawaye'} & environs',
                  style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                ),
              ],
            ),
            actions: [
              Container(
                margin: const EdgeInsets.only(right: 16),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE9ECEF),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '${filtered.length} répertoriées',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            children: [
              // Title from Screenshot 4
              Text(
                widget.medicines.length > 1 ? 'ORDONNANCE COMPLÈTE' : 'MÉDICAMENT CIBLÉ',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Résultats pour $medTitle',
                style: const TextStyle(
                  fontFamily: 'serif',
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(height: 12),

              // Conseil d'urgence box matching Screenshot 4
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFE2FAF4),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFB6EFE2)),
                ),
                child: const Row(
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor: AppTheme.mint,
                      child: Icon(Icons.phone, size: 14, color: AppTheme.primaryDark),
                    ),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        "Conseil d'urgence : Appelez toujours l'officine avant tout déplacement nocturne pour sécuriser le stock.",
                        style: TextStyle(fontSize: 12, color: AppTheme.primaryDark, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Filter Buttons matching Screenshot 4
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _FilterChip(
                      label: 'Tout afficher',
                      isSelected: _filter == 'all',
                      onTap: () => setState(() => _filter = 'all'),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: '● En stock uniquement',
                      isSelected: _filter == 'stock',
                      onTap: () => setState(() => _filter = 'stock'),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: '✳ De garde',
                      isSelected: _filter == 'duty',
                      onTap: () => setState(() => _filter = 'duty'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Ranked Pharmacies Cards matching Screenshot 4
              ...filtered.map((result) {
                final pharmacy = result.pharmacy;
                final isComplete = result.isComplete;
                final inStock = result.availableCount > 0;

                return Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isComplete ? AppTheme.mint : AppTheme.borderColor,
                      width: isComplete ? 2 : 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Badges
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              if (pharmacy.isDuty24h)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  margin: const EdgeInsets.only(right: 6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF064E3B),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: const Text(
                                    '● DE GARDE',
                                    style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              if (pharmacy.isPriority)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppTheme.mintLight,
                                    borderRadius: BorderRadius.circular(999),
                                    border: Border.all(color: AppTheme.mint),
                                  ),
                                  child: const Text(
                                    '⚡ Prioritaire',
                                    style: TextStyle(color: AppTheme.primaryDark, fontSize: 9, fontWeight: FontWeight.bold),
                                  ),
                                ),
                            ],
                          ),
                          if (widget.medicines.length > 1)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: isComplete ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                '${result.availableCount} / ${result.totalRequested} ${isComplete ? "Complète" : "Incomplète"}',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: isComplete ? const Color(0xFF065F46) : const Color(0xFF92400E),
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      Text(
                        pharmacy.name,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${pharmacy.address} · ${pharmacy.formattedDistance}',
                        style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 10),

                      // Availability Status Box
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFA),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              inStock ? '● En stock' : 'ⓧ Rupture temporaire',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: inStock ? const Color(0xFF059669) : const Color(0xFFDC2626),
                              ),
                            ),
                            Row(
                              children: [
                                const Icon(Icons.access_time, size: 12, color: AppTheme.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  result.confirmationText,
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Action Buttons
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
                                backgroundColor: AppTheme.mint,
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
              }),
            ],
          ),
        );
      },
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : const Color(0xFFE9ECEF),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isSelected ? Colors.white : const Color(0xFF2D3748),
          ),
        ),
      ),
    );
  }
}
