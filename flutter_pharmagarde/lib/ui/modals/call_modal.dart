import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/pharmacy_model.dart';

class CallModal extends StatefulWidget {
  final PharmacyModel pharmacy;

  const CallModal({super.key, required this.pharmacy});

  @override
  State<CallModal> createState() => _CallModalState();
}

class _CallModalState extends State<CallModal> {
  int _seconds = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) setState(() => _seconds++);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatTimer(int s) {
    final m = s ~/ 60;
    final sec = s % 60;
    return '$m:${sec < 10 ? '0' : ''}$sec';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: const BoxDecoration(
        color: Color(0xFF041715),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'APPEL DIRECT SÉCURISÉ',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppTheme.mint,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            widget.pharmacy.name,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          Text(
            widget.pharmacy.phone,
            style: const TextStyle(fontSize: 14, color: AppTheme.mint),
          ),
          const SizedBox(height: 16),
          Text(
            _formatTimer(_seconds),
            style: const TextStyle(
              fontSize: 32,
              fontFamily: 'monospace',
              fontWeight: FontWeight.bold,
              color: AppTheme.mint,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: const Color(0xFF143834),
                child: const Icon(Icons.mic, color: Colors.white),
              ),
              const SizedBox(width: 24),
              // Hang up button
              InkWell(
                onTap: () => Navigator.pop(context),
                borderRadius: BorderRadius.circular(999),
                child: const CircleAvatar(
                  radius: 32,
                  backgroundColor: Color(0xFFEF4444),
                  child: Icon(Icons.call_end, color: Colors.white, size: 28),
                ),
              ),
              const SizedBox(width: 24),
              CircleAvatar(
                radius: 26,
                backgroundColor: const Color(0xFF143834),
                child: const Icon(Icons.volume_up, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}
