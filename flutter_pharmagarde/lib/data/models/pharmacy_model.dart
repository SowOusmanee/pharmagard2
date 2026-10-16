class PharmacyModel {
  final String id;
  final String name;
  final String address;
  final String zone;
  final double latitude;
  final double longitude;
  final double distanceKm;
  final String phone;
  final String openingHours;
  final bool isDuty24h;
  final bool isPriority;
  final String landmark;
  final String pharmacistName;

  const PharmacyModel({
    required this.id,
    required this.name,
    required this.address,
    required this.zone,
    required this.latitude,
    required this.longitude,
    required this.distanceKm,
    required this.phone,
    required this.openingHours,
    required this.isDuty24h,
    required this.isPriority,
    required this.landmark,
    required this.pharmacistName,
  });

  String get formattedDistance {
    if (distanceKm < 1.0) {
      return '${(distanceKm * 1000).round()} m';
    }
    return '${distanceKm.toStringAsFixed(1).replaceAll('.', ',')} km';
  }
}
