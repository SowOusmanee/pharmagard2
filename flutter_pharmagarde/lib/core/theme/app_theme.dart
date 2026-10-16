import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF005F56);
  static const Color primaryDark = Color(0xFF004740);
  static const Color primaryLight = Color(0xFF0D796E);

  static const Color mint = Color(0xFF95ECD8);
  static const Color mintLight = Color(0xFFE0F7F2);
  static const Color mintSoft = Color(0xFFD0F4EB);
  static const Color mintChip = Color(0xFFD6F6EE);

  static const Color accentGreen = Color(0xFF15803D);
  static const Color alertRed = Color(0xFFDC2626);
  static const Color alertRedBg = Color(0xFFFEE2E2);
  static const Color alertAmber = Color(0xFFD97706);
  static const Color alertAmberBg = Color(0xFFFEF3C7);

  static const Color bgPage = Color(0xFFF6F8F8);
  static const Color bgCard = Color(0xFFFFFFFF);
  static const Color bgSubtle = Color(0xFFF0F4F4);
  static const Color bgInput = Color(0xFFEBF8F5);

  static const Color textMain = Color(0xFF0C2825);
  static const Color textMuted = Color(0xFF53716E);
  static const Color textLight = Color(0xFF7E9794);
  static const Color borderColor = Color(0xFFE0E7E6);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: bgPage,
      primaryColor: primary,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: mint,
        surface: bgCard,
        error: alertRed,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bgCard,
        elevation: 0,
        scrolledUnderElevation: 1,
        iconTheme: IconThemeData(color: primary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          shape: const StadiumBorder(),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
          elevation: 2,
        ),
      ),
    );
  }
}
