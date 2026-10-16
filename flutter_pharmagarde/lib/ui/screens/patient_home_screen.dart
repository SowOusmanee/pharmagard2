import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/medicine_model.dart';
import '../../services/state_notifier.dart';

class PatientHomeScreen extends StatefulWidget {
  final PharmaGardeState state;
  final VoidCallback onOpenProfile;
  final VoidCallback onNavigateToPharmacies;
  final Function(String query) onSearchText;
  final Function(List<MedicineModel> medicines) onScanComplete;

  const PatientHomeScreen({
    super.key,
    required this.state,
    required this.onOpenProfile,
    required this.onNavigateToPharmacies,
    required this.onSearchText,
    required this.onScanComplete,
  });

  @override
  State<PatientHomeScreen> createState() => _PatientHomeScreenState();
}

class _PatientHomeScreenState extends State<PatientHomeScreen>
    with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  late AnimationController _crossAnimController;
  late Animation<double> _crossScaleAnim;

  late AnimationController _textAnimController;

  bool _isScanning = false;
  bool _scanSuccess = false;
  bool _isCameraOpen = false;
  bool _isFlashing = false;

  final String _heroTitle = "Trouvez votre médicament au plus proche";

  @override
  void initState() {
    super.initState();

    // Cross Pop animation
    _crossAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _crossScaleAnim = CurvedAnimation(
      parent: _crossAnimController,
      curve: Curves.elasticOut,
    );
    _crossAnimController.forward();

    // Text letter animation
    _textAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _textAnimController.forward();

    _searchController.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _crossAnimController.dispose();
    _textAnimController.dispose();
    super.dispose();
  }

  void _triggerScanProcess() async {
    setState(() {
      _isCameraOpen = false;
      _isScanning = true;
      _scanSuccess = false;
    });

    // Simulate OCR analysis
    await Future.delayed(const Duration(milliseconds: 1400));
    if (!mounted) return;

    setState(() {
      _scanSuccess = true;
    });

    await Future.delayed(const Duration(milliseconds: 650));
    if (!mounted) return;

    setState(() {
      _isScanning = false;
      _scanSuccess = false;
    });

    // Default analyzed sample medicines
    final detectedMeds = [
      const MedicineModel(id: '1', name: 'Amoxicilline', dosage: '500 mg', confidence: 0.98),
      const MedicineModel(id: '2', name: 'Paracétamol', dosage: '1 g', confidence: 0.95),
      const MedicineModel(id: '3', name: 'Ibuprofène', dosage: '400 mg', confidence: 0.89),
    ];

    widget.state.setPrescriptionMedicines(detectedMeds);
    widget.onScanComplete(detectedMeds);
  }

  void _showScanModalBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
            boxShadow: [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 30,
                offset: Offset(0, -6),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Grab handle
              Container(
                width: 38,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 18),

              // Option 1: Scanner avec l'appareil photo
              InkWell(
                onTap: () {
                  Navigator.pop(ctx);
                  setState(() => _isCameraOpen = true);
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FAF7),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFC8ECE3), width: 1.5),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFF5CE1B6),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.camera_alt, color: Color(0xFF004740), size: 22),
                      ),
                      const SizedBox(width: 14),
                      const Text(
                        "Scanner avec l'appareil photo",
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF004740),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Option 2: Téléverser un fichier
              InkWell(
                onTap: () {
                  Navigator.pop(ctx);
                  _triggerScanProcess();
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.upload_file, color: Color(0xFF1E293B), size: 22),
                      ),
                      const SizedBox(width: 14),
                      const Text(
                        "Téléverser un fichier",
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Annuler
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text(
                  'Annuler',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _submitSearch() {
    final q = _searchController.text.trim();
    if (q.isNotEmpty) {
      widget.onSearchText(q);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasSearchText = _searchController.text.trim().isNotEmpty;

    return Stack(
      children: [
        // Background: Clean white with bottom radial mint glow matching web
        Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            gradient: RadialGradient(
              center: Alignment(0.0, 0.95),
              radius: 1.15,
              colors: [
                Color(0x735CE1B6), // rgba(92, 225, 182, 0.45)
                Color(0x3895ECD8), // rgba(149, 236, 216, 0.22)
                Color(0x00FFFFFF),
              ],
              stops: [0.0, 0.45, 0.85],
            ),
          ),
        ),

        // Main Screen Content
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top Bar: Left Profile Glassmorphism button + Right Pharmacies Glassmorphism button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Profile Button (Left)
                    _buildGlassmorphismButton(
                      icon: Icons.person_outline_rounded,
                      onTap: widget.onOpenProfile,
                      tooltip: "Mon profil / Créer un compte",
                    ),

                    // Pharmacies Button (Right: Arrow Left like in web design)
                    _buildGlassmorphismButton(
                      icon: Icons.arrow_back_rounded,
                      onTap: widget.onNavigateToPharmacies,
                      tooltip: "Pharmacies proches",
                    ),
                  ],
                ),

                // Center Section: Green Cross & Bouncing Letter Title
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Pharmacy Cross SVG/Widget with bouncy entrance
                    ScaleTransition(
                      scale: _crossScaleAnim,
                      child: Container(
                        width: 48,
                        height: 48,
                        margin: const EdgeInsets.only(bottom: 22),
                        child: CustomPaint(
                          painter: _PharmacyCrossPainter(color: const Color(0xFF005F56)),
                        ),
                      ),
                    ),

                    // Animated Bouncing Letters Hero Title
                    AnimatedBuilder(
                      animation: _textAnimController,
                      builder: (context, _) {
                        return Container(
                          constraints: const BoxConstraints(maxWidth: 320),
                          child: Wrap(
                            alignment: WrapAlignment.center,
                            children: _buildAnimatedTitleSpans(),
                          ),
                        );
                      },
                    ),
                  ],
                ),

                // Bottom Search / Scan Pill Bar
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _isScanning
                      ? _buildScanningPill()
                      : _buildSearchPill(hasSearchText),
                ),
              ],
            ),
          ),
        ),

        // Inline Camera Simulator Overlay
        if (_isCameraOpen) _buildCameraOverlay(),
      ],
    );
  }

  // Circular Apple-style Glassmorphism Button
  Widget _buildGlassmorphismButton({
    required IconData icon,
    required VoidCallback onTap,
    required String tooltip,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: tooltip,
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withOpacity(0.65),
            border: Border.all(
              color: Colors.white.withOpacity(0.85),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: ClipOval(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
              child: Center(
                child: Icon(
                  icon,
                  size: 21,
                  color: const Color(0xFF005F56),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Letter by letter animation
  List<Widget> _buildAnimatedTitleSpans() {
    final words = _heroTitle.split(' ');
    final List<Widget> wordWidgets = [];

    int globalCharIndex = 0;
    for (int w = 0; w < words.length; w++) {
      final word = words[w];
      final List<Widget> charWidgets = [];

      for (int c = 0; c < word.length; c++) {
        final char = word[c];
        final charProgress = (_textAnimController.value - (globalCharIndex * 0.025)).clamp(0.0, 1.0);
        final curvedProgress = Curves.elasticOut.transform(charProgress);
        globalCharIndex++;

        final offsetY = (1.0 - curvedProgress) * -24.0;
        final scale = 0.5 + (0.5 * curvedProgress);

        charWidgets.add(
          Transform.translate(
            offset: Offset(0, offsetY),
            child: Transform.scale(
              scale: scale,
              child: Text(
                char,
                style: const TextStyle(
                  fontSize: 27,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF004740),
                  letterSpacing: -0.4,
                  height: 1.3,
                ),
              ),
            ),
          ),
        );
      }

      wordWidgets.add(
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ...charWidgets,
            if (w < words.length - 1)
              const Text(
                ' ',
                style: TextStyle(fontSize: 27),
              ),
          ],
        ),
      );
    }

    return wordWidgets;
  }

  // Bottom Search Bar Pill (Normal State)
  Widget _buildSearchPill(bool hasSearchText) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 375),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF0F2421),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: const Color(0xFF95ECD8).withOpacity(0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF002823).withOpacity(0.25),
            blurRadius: 28,
            offset: const Offset(0, 10),
          ),
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Plus button (opens bottom sheet scan modal)
          GestureDetector(
            onTap: _showScanModalBottomSheet,
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.08),
              ),
              child: const Icon(Icons.add, size: 20, color: Color(0xFF5CE1B6)),
            ),
          ),
          const SizedBox(width: 8),

          // Text Field
          Expanded(
            child: TextField(
              controller: _searchController,
              focusNode: _searchFocusNode,
              onSubmitted: (_) => _submitSearch(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
              decoration: const InputDecoration(
                isDense: true,
                hintText: 'Rechercher un médicament...',
                hintStyle: TextStyle(
                  color: Color(0xFF7E9794),
                  fontSize: 14,
                ),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(vertical: 8),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Right Button: Arrow up if text entered, Camera if empty
          GestureDetector(
            onTap: hasSearchText
                ? _submitSearch
                : () => setState(() => _isCameraOpen = true),
            child: Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFF5CE1B6),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x595CE1B6),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                hasSearchText ? Icons.arrow_upward : Icons.camera_alt_outlined,
                size: 20,
                color: const Color(0xFF004740),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Bottom Pill (Scanning in Progress State)
  Widget _buildScanningPill() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      constraints: const BoxConstraints(maxWidth: 375),
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
      decoration: BoxDecoration(
        color: _scanSuccess ? const Color(0xFF004740) : const Color(0xFF0F2421),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: _scanSuccess ? const Color(0xFF5CE1B6) : const Color(0x665CE1B6),
          width: _scanSuccess ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: _scanSuccess
                ? const Color(0xFF004740).withOpacity(0.4)
                : const Color(0xFF002823).withOpacity(0.25),
            blurRadius: 28,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (_scanSuccess)
            const Icon(Icons.check_circle_rounded, color: Color(0xFF5CE1B6), size: 20)
          else
            const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF5CE1B6)),
              ),
            ),
          const SizedBox(width: 12),
          Text(
            _scanSuccess ? 'Ordonnance détectée !' : 'Scan en cours...',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  // Camera Overlay Simulator (Matching web inline camera)
  Widget _buildCameraOverlay() {
    return Container(
      color: Colors.black.withOpacity(0.55),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 360, maxHeight: 480),
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(28),
                boxShadow: const [
                  BoxShadow(color: Colors.black54, blurRadius: 40, offset: Offset(0, 20)),
                ],
              ),
              child: Stack(
                children: [
                  // Camera Viewport Simulation
                  ClipRRect(
                    borderRadius: BorderRadius.circular(28),
                    child: Container(
                      color: const Color(0xFF1E293B),
                      child: Stack(
                        children: [
                          Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white.withOpacity(0.1),
                                  ),
                                  child: const Icon(Icons.document_scanner, size: 48, color: Color(0xFF5CE1B6)),
                                ),
                                const SizedBox(height: 14),
                                const Text(
                                  "Cadrez l'ordonnance médicale",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  "Alignez bien le texte pour la détection",
                                  style: TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Target Viewfinder Corners
                          Padding(
                            padding: const EdgeInsets.all(36),
                            child: Container(
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: const Color(0xFF5CE1B6).withOpacity(0.6),
                                  width: 1.5,
                                ),
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Flash effect
                  if (_isFlashing)
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(28),
                      ),
                    ),

                  // Bottom Camera Controls
                  Positioned(
                    bottom: 24,
                    left: 28,
                    right: 28,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Close (X)
                        GestureDetector(
                          onTap: () => setState(() => _isCameraOpen = false),
                          child: Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withOpacity(0.25),
                            ),
                            child: const Icon(Icons.close, color: Colors.white, size: 24),
                          ),
                        ),

                        // Shutter Capture Button
                        GestureDetector(
                          onTap: () {
                            setState(() => _isFlashing = true);
                            Future.delayed(const Duration(milliseconds: 150), () {
                              if (mounted) setState(() => _isFlashing = false);
                              _triggerScanProcess();
                            });
                          },
                          child: Container(
                            width: 72,
                            height: 72,
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 4),
                            ),
                            child: Container(
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),

                        // Flip Camera
                        GestureDetector(
                          onTap: () {},
                          child: Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withOpacity(0.25),
                            ),
                            child: const Icon(Icons.flip_camera_android, color: Colors.white, size: 22),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Custom Painter for Pharmacy Cross matching the Web SVG exactly
class _PharmacyCrossPainter extends CustomPainter {
  final Color color;

  _PharmacyCrossPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    // Viewbox is 24x24 in SVG:
    // rect x=9, y=2, w=6, h=20, rx=2.5
    // rect x=2, y=9, w=20, h=6, rx=2.5
    final scaleX = size.width / 24.0;
    final scaleY = size.height / 24.0;

    // Vertical bar
    final vRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(9 * scaleX, 2 * scaleY, 6 * scaleX, 20 * scaleY),
      Radius.circular(2.5 * scaleX),
    );
    canvas.drawRRect(vRect, paint);

    // Horizontal bar
    final hRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(2 * scaleX, 9 * scaleY, 20 * scaleX, 6 * scaleY),
      Radius.circular(2.5 * scaleY),
    );
    canvas.drawRRect(hRect, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
