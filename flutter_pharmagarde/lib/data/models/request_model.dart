class AvailabilityRequestModel {
  final String requestId;
  final String pharmacyId;
  final String medicineName;
  final String dosage;
  final String patientZone;
  final String patientDistance;
  final String status; // 'PENDING', 'AVAILABLE', 'UNAVAILABLE'
  final DateTime createdAt;
  final DateTime? respondedAt;

  const AvailabilityRequestModel({
    required this.requestId,
    required this.pharmacyId,
    required this.medicineName,
    required this.dosage,
    required this.patientZone,
    required this.patientDistance,
    required this.status,
    required this.createdAt,
    this.respondedAt,
  });

  AvailabilityRequestModel copyWith({
    String? status,
    DateTime? respondedAt,
  }) {
    return AvailabilityRequestModel(
      requestId: requestId,
      pharmacyId: pharmacyId,
      medicineName: medicineName,
      dosage: dosage,
      patientZone: patientZone,
      patientDistance: patientDistance,
      status: status ?? this.status,
      createdAt: createdAt,
      respondedAt: respondedAt ?? this.respondedAt,
    );
  }
}
