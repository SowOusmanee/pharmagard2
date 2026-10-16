import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class PharmaGardeLogo extends StatelessWidget {
  final double size;
  final bool showText;
  final String subtitle;

  const PharmaGardeLogo({
    super.key,
    this.size = 36,
    this.showText = true,
    this.subtitle = 'Médicament',
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Custom Drawn Brand Mark
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: AppTheme.mintLight,
            borderRadius: BorderRadius.circular(size * 0.28),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Vertical bar of cross
              Container(
                width: size * 0.22,
                height: size * 0.62,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Horizontal bar of cross
              Container(
                width: size * 0.62,
                height: size * 0.22,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Top-right green accent dot
              Positioned(
                top: size * 0.12,
                right: size * 0.12,
                child: Container(
                  width: size * 0.18,
                  height: size * 0.18,
                  decoration: const BoxDecoration(
                    color: AppTheme.accentGreen,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (showText) ...[
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'PharmaGarde',
                style: TextStyle(
                  fontFamily: 'serif',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                  letterSpacing: -0.2,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textMuted,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
