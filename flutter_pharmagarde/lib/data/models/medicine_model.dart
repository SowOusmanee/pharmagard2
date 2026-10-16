class MedicineModel {
  final String id;
  final String name;
  final String dosage;
  final double confidence;
  final bool isVerified;
  final String category;

  const MedicineModel({
    required this.id,
    required this.name,
    required this.dosage,
    this.confidence = 1.0,
    this.isVerified = true,
    this.category = 'Générique',
  });

  MedicineModel copyWith({
    String? name,
    String? dosage,
    double? confidence,
    bool? isVerified,
    String? category,
  }) {
    return MedicineModel(
      id: id,
      name: name ?? this.name,
      dosage: dosage ?? this.dosage,
      confidence: confidence ?? this.confidence,
      isVerified: isVerified ?? this.isVerified,
      category: category ?? this.category,
    );
  }
}

enum AvailabilityStatus {
  available,
  unavailable,
  unknown,
  pendingRequest,
}
