import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../data/models/pharmacy_model.dart';
import '../theme/app_theme.dart';

class DakarOsmMap extends StatefulWidget {
  final List<PharmacyModel> pharmacies;
  final PharmacyModel? selectedPharmacy;
  final ValueChanged<PharmacyModel>? onPharmacySelected;
  final double initialZoom;
  final LatLng? initialCenter;

  const DakarOsmMap({
    super.key,
    required this.pharmacies,
    this.selectedPharmacy,
    this.onPharmacySelected,
    this.initialZoom = 13.0,
    this.initialCenter,
  });

  @override
  State<DakarOsmMap> createState() => _DakarOsmMapState();
}

class _DakarOsmMapState extends State<DakarOsmMap> {
  final MapController _mapController = MapController();

  static const LatLng _dakarDefaultCenter = LatLng(14.7620, -17.3970); // Pikine / Guédiawaye

  @override
  void didUpdateWidget(covariant DakarOsmMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedPharmacy != null &&
        widget.selectedPharmacy != oldWidget.selectedPharmacy) {
      _mapController.move(
        LatLng(
          widget.selectedPharmacy!.latitude,
          widget.selectedPharmacy!.longitude,
        ),
        14.5,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final center = widget.initialCenter ??
        (widget.selectedPharmacy != null
            ? LatLng(
                widget.selectedPharmacy!.latitude,
                widget.selectedPharmacy!.longitude,
              )
            : _dakarDefaultCenter);

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: center,
              initialZoom: widget.initialZoom,
              minZoom: 10.0,
              maxZoom: 18.0,
            ),
            children: [
              // Clean tile layer from OpenStreetMap
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.pharmagarde_flutter',
                maxZoom: 19,
              ),

              // Pharmacy Markers Layer
              MarkerLayer(
                markers: widget.pharmacies.map((pharmacy) {
                  final isSelected = widget.selectedPharmacy?.id == pharmacy.id;
                  final isDuty = pharmacy.isDuty24h;

                  return Marker(
                    point: LatLng(pharmacy.latitude, pharmacy.longitude),
                    width: isSelected ? 52 : 42,
                    height: isSelected ? 52 : 42,
                    child: GestureDetector(
                      onTap: () {
                        widget.onPharmacySelected?.call(pharmacy);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppTheme.primary
                              : (isDuty ? AppTheme.accentGreen : AppTheme.primaryDark),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white,
                            width: isSelected ? 3.0 : 2.0,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.25),
                              blurRadius: isSelected ? 10 : 5,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Icon(
                            isDuty ? Icons.local_pharmacy : Icons.location_on,
                            color: Colors.white,
                            size: isSelected ? 26 : 20,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),

          // Zoom controls overlay in bottom right
          Positioned(
            right: 12,
            bottom: 12,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildZoomButton(
                  icon: Icons.add,
                  onPressed: () {
                    final currentZoom = _mapController.camera.zoom;
                    _mapController.move(
                      _mapController.camera.center,
                      currentZoom + 1.0,
                    );
                  },
                ),
                const SizedBox(height: 6),
                _buildZoomButton(
                  icon: Icons.remove,
                  onPressed: () {
                    final currentZoom = _mapController.camera.zoom;
                    _mapController.move(
                      _mapController.camera.center,
                      currentZoom - 1.0,
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildZoomButton({
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return Material(
      color: Colors.white,
      shape: const CircleBorder(),
      elevation: 3,
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: SizedBox(
          width: 36,
          height: 36,
          child: Icon(icon, size: 20, color: AppTheme.primaryDark),
        ),
      ),
    );
  }
}
