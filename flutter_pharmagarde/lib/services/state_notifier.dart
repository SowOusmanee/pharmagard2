import 'package:flutter/material.dart';
import '../data/models/pharmacy_model.dart';
import '../data/models/medicine_model.dart';
import '../data/models/request_model.dart';
import '../core/constants/mock_data.dart';

class PharmaSearchResult {
  final PharmacyModel pharmacy;
  final List<MedicineStatusItem> medicinesBreakdown;
  final int totalRequested;
  final int availableCount;
  final bool isComplete;
  final String confirmationText;

  const PharmaSearchResult({
    required this.pharmacy,
    required this.medicinesBreakdown,
    required this.totalRequested,
    required this.availableCount,
    required this.isComplete,
    required this.confirmationText,
  });
}

class MedicineStatusItem {
  final String name;
  final String dosage;
  final AvailabilityStatus status;

  const MedicineStatusItem({
    required this.name,
    required this.dosage,
    required this.status,
  });
}

class PharmaGardeState extends ChangeNotifier {
  String _role = 'patient'; // 'patient' | 'pharmacist'
  String get role => _role;

  int _patientTabIndex = 0; // 0: Accueil, 1: Medicament, 2: Garde
  int get patientTabIndex => _patientTabIndex;

  String _selectedZone = 'pikine';
  String get selectedZone => _selectedZone;

  List<MedicineModel> _activePrescriptionMedicines = [
    const MedicineModel(id: '1', name: 'Amoxicilline', dosage: '500 mg', confidence: 0.96),
    const MedicineModel(id: '2', name: 'Paracétamol', dosage: '1 g', confidence: 0.94),
    const MedicineModel(id: '3', name: 'Ibuprofène', dosage: '400 mg', confidence: 0.88),
  ];
  List<MedicineModel> get activePrescriptionMedicines => _activePrescriptionMedicines;

  final List<PharmacyModel> _pharmacies = List.from(MockData.initialPharmacies);
  List<PharmacyModel> get pharmacies => _pharmacies;

  final List<AvailabilityRequestModel> _requests = List.from(MockData.initialRequests);
  List<AvailabilityRequestModel> get requests => _requests;

  // Stock Map: pharmacyId_medNormalized -> AvailabilityStatus
  final Map<String, AvailabilityStatus> _stockMap = {
    // Pharmacie Niayes Pikine
    'pharmacy_001_amoxicilline': AvailabilityStatus.available,
    'pharmacy_001_paracetamol': AvailabilityStatus.available,
    'pharmacy_001_ibuprofene': AvailabilityStatus.unavailable,
    // Grande Pharmacie de Guédiawaye (Complete)
    'pharmacy_003_amoxicilline': AvailabilityStatus.available,
    'pharmacy_003_paracetamol': AvailabilityStatus.available,
    'pharmacy_003_ibuprofene': AvailabilityStatus.available,
    // Pharmacie Kasnack Pikine
    'pharmacy_002_amoxicilline': AvailabilityStatus.available,
    'pharmacy_002_paracetamol': AvailabilityStatus.available,
    'pharmacy_002_ibuprofene': AvailabilityStatus.unavailable,
  };

  void setRole(String newRole) {
    _role = newRole;
    notifyListeners();
  }

  void setPatientTabIndex(int index) {
    _patientTabIndex = index;
    notifyListeners();
  }

  void setZone(String zone) {
    _selectedZone = zone;
    notifyListeners();
  }

  void setPrescriptionMedicines(List<MedicineModel> meds) {
    _activePrescriptionMedicines = meds;
    notifyListeners();
  }

  // Pharmacist responds to a request in real time
  void respondToRequest(String requestId, String status) {
    final index = _requests.indexWhere((r) => r.requestId == requestId);
    if (index != -1) {
      final req = _requests[index];
      _requests[index] = req.copyWith(
        status: status,
        respondedAt: DateTime.now(),
      );

      final key = '${req.pharmacyId}_${_cleanName(req.medicineName)}';
      _stockMap[key] = status == 'AVAILABLE'
          ? AvailabilityStatus.available
          : AvailabilityStatus.unavailable;

      notifyListeners();
    }
  }

  // Multi-tier availability ranking logic
  List<PharmaSearchResult> calculateRankedPharmacies(List<MedicineModel> medicines) {
    final results = _pharmacies.map((pharmacy) {
      int availableCount = 0;
      final breakdown = medicines.map((med) {
        final key = '${pharmacy.id}_${_cleanName(med.name)}';
        final status = _stockMap[key] ?? AvailabilityStatus.unknown;
        if (status == AvailabilityStatus.available) {
          availableCount++;
        }
        return MedicineStatusItem(
          name: med.name,
          dosage: med.dosage,
          status: status,
        );
      }).toList();

      final isComplete = availableCount == medicines.length;

      return PharmaSearchResult(
        pharmacy: pharmacy,
        medicinesBreakdown: breakdown,
        totalRequested: medicines.length,
        availableCount: availableCount,
        isComplete: isComplete,
        confirmationText: isComplete ? "Confirmé il y a 15 min" : "Mise à jour récente",
      );
    }).toList();

    // Priority 1: Complete prescription
    // Priority 2: Available medicines count
    // Priority 3: Distance
    results.sort((a, b) {
      if (a.isComplete && !b.isComplete) return -1;
      if (!a.isComplete && b.isComplete) return 1;

      if (a.availableCount != b.availableCount) {
        return b.availableCount.compareTo(a.availableCount);
      }

      return a.pharmacy.distanceKm.compareTo(b.pharmacy.distanceKm);
    });

    return results;
  }

  String _cleanName(String name) {
    return name
        .toLowerCase()
        .replaceAll('é', 'e')
        .replaceAll('è', 'e')
        .replaceAll('ê', 'e')
        .replaceAll('à', 'a')
        .trim();
  }
}
