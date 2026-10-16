import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'data/models/medicine_model.dart';
import 'data/models/pharmacy_model.dart';
import 'services/state_notifier.dart';
import 'ui/screens/patient_home_screen.dart';
import 'ui/screens/pharmacies_list_screen.dart';
import 'ui/screens/confirmed_pharmacies_screen.dart';
import 'ui/modals/patient_login_modal.dart';
import 'ui/modals/call_modal.dart';
import 'ui/modals/itinerary_modal.dart';

void main() {
  runApp(const PharmaGardeApp());
}

class PharmaGardeApp extends StatefulWidget {
  const PharmaGardeApp({super.key});

  @override
  State<PharmaGardeApp> createState() => _PharmaGardeAppState();
}

class _PharmaGardeAppState extends State<PharmaGardeApp> {
  final PharmaGardeState _state = PharmaGardeState();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PharmaGarde Dakar',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: MainShell(state: _state),
    );
  }
}

class MainShell extends StatefulWidget {
  final PharmaGardeState state;

  const MainShell({super.key, required this.state});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  String _currentScreen = 'home'; // 'home' | 'pharmacies-list' | 'results'
  bool _showLoginModal = false;
  List<MedicineModel> _activeMedicines = [];

  void _openCallModal(PharmacyModel pharmacy) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CallModal(pharmacy: pharmacy),
    );
  }

  void _openItineraryModal(PharmacyModel pharmacy) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ItineraryModal(pharmacy: pharmacy),
    );
  }

  void _handleSearchText(String query) {
    setState(() {
      _activeMedicines = [
        MedicineModel(id: 'search_${DateTime.now().millisecondsSinceEpoch}', name: query, dosage: 'Dosage courant', confidence: 1.0)
      ];
      _currentScreen = 'results';
    });
  }

  void _handleScanComplete(List<MedicineModel> detected) {
    setState(() {
      _activeMedicines = detected;
      _currentScreen = 'results';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Screen 1: Home Screen
          AnimatedPositioned(
            duration: const Duration(milliseconds: 320),
            curve: Curves.easeInOutCubic,
            left: _currentScreen == 'pharmacies-list'
                ? -MediaQuery.of(context).size.width * 0.3
                : 0,
            right: _currentScreen == 'pharmacies-list'
                ? MediaQuery.of(context).size.width * 0.3
                : 0,
            top: 0,
            bottom: 0,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 280),
              opacity: _currentScreen == 'pharmacies-list' ? 0.3 : 1.0,
              child: PatientHomeScreen(
                state: widget.state,
                onOpenProfile: () => setState(() => _showLoginModal = true),
                onNavigateToPharmacies: () => setState(() => _currentScreen = 'pharmacies-list'),
                onSearchText: _handleSearchText,
                onScanComplete: _handleScanComplete,
              ),
            ),
          ),

          // Screen 2: Sliding Pharmacies List (slides from the right)
          AnimatedPositioned(
            duration: const Duration(milliseconds: 320),
            curve: Curves.easeInOutCubic,
            left: _currentScreen == 'pharmacies-list' ? 0 : MediaQuery.of(context).size.width,
            width: MediaQuery.of(context).size.width,
            top: 0,
            bottom: 0,
            child: PharmaciesListScreen(
              state: widget.state,
              onBack: () => setState(() => _currentScreen = 'home'),
              onCall: _openCallModal,
              onItinerary: _openItineraryModal,
            ),
          ),

          // Screen 3: Results & Confirmed Availability (appears when search/scan is submitted)
          if (_currentScreen == 'results')
            Positioned.fill(
              child: ConfirmedPharmaciesScreen(
                state: widget.state,
                medicines: _activeMedicines,
                onBackToHome: () => setState(() => _currentScreen = 'home'),
                onCall: _openCallModal,
                onItinerary: _openItineraryModal,
              ),
            ),

          // Modal: Patient Login / Account Modal
          if (_showLoginModal)
            Positioned.fill(
              child: PatientLoginModal(
                onClose: () => setState(() => _showLoginModal = false),
                onSuccess: (name) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Bienvenue $name !'),
                      backgroundColor: const Color(0xFF005F56),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
