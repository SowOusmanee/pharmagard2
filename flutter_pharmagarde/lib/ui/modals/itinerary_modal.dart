import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/pharmacy_model.dart';

class ItineraryModal extends StatefulWidget {
  final PharmacyModel pharmacy;

  const ItineraryModal({super.key, required this.pharmacy});

  @override
  State<ItineraryModal> createState() => _ItineraryModalState();
}

class _ItineraryModalState extends State<ItineraryModal> {
  bool _isCar = true;

  @override
  Widget build(BuildContext context) {
    final dist = widget.pharmacy.distanceKm;
    final carMin = (dist * 3.5).round().clamp(2, 60);
    final walkMin = (dist * 12).round().clamp(5, 120);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'ITINÉRAIRE EN TEMPS RÉEL',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primary),
                  ),
                  Text(
                    widget.pharmacy.name,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textMain),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Transport Selector
          Row(
            children: [
              Expanded(
                child: ChoiceChip(
                  label: Text('Voiture / Taxi ($carMin min)'),
                  selected: _isCar,
                  selectedColor: AppTheme.mint,
                  onSelected: (val) {
                    if (val) setState(() => _isCar = true);
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ChoiceChip(
                  label: Text('À pied ($walkMin min)'),
                  selected: !_isCar,
                  selectedColor: AppTheme.mint,
                  onSelected: (val) {
                    if (val) setState(() => _isCar = false);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Simulated Route Graphic
          Container(
            height: 110,
            decoration: BoxDecoration(
              color: const Color(0xFFD9EEEC),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.my_location, color: Colors.blue, size: 24),
                  const SizedBox(width: 12),
                  const Text('-------- ➔ --------', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 12),
                  const Icon(Icons.local_pharmacy, color: AppTheme.primary, size: 28),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Directions
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFA),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                _stepRow(Icons.arrow_upward, "Partir sur la route principale de Pikine", "250 m"),
                const Divider(height: 16),
                _stepRow(Icons.turn_right, "Tourner vers ${widget.pharmacy.address}", "400 m"),
                const Divider(height: 16),
                _stepRow(Icons.location_on, "Arrivée à destination (${widget.pharmacy.landmark})", "150 m"),
              ],
            ),
          ),
          const SizedBox(height: 16),

          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Guidage GPS PharmaGarde démarré !')),
              );
            },
            icon: const Icon(Icons.navigation, size: 18),
            label: const Text(
              'Démarrer le guidage',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepRow(IconData icon, String text, String dist) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.primary),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 12))),
        Text(dist, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
      ],
    );
  }
}
