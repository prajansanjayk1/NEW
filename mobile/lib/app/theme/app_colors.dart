import 'package:flutter/material.dart';

class AppColors {
  // Brand Primaries (matching King of Wings flame / deep charcoal palette)
  static const Color primary = Color(0xFFFF5708); // Fire blaze orange
  static const Color primaryLight = Color(0xFFFF7A39);
  static const Color primaryDark = Color(0xFFCC4200);

  // Secondary Accents
  static const Color secondary = Color(0xFFFFB800); // Amber honey
  static const Color accent = Color(0xFFFF3366); // Spicy reaper red
  static const Color success = Color(0xFF10B981); // Emerald confirmation
  static const Color warning = Color(0xFFF59E0B); // Amber warning
  static const Color error = Color(0xFFEF4444); // Crimson error
  static const Color info = Color(0xFF3B82F6); // Cobalt info

  // Dark Canvas Theme (Deep, warm luxury charcoal)
  static const Color background = Color(0xFF0E0E0F);
  static const Color surface = Color(0xFF171719);
  static const Color surfaceElevated = Color(0xFF212124);
  static const Color surfaceCard = Color(0xFF1E1E22);
  static const Color surfaceHighlight = Color(0xFF2A2A2E);

  // Borders & Dividers
  static const Color border = Color(0xFF2A2A2E);
  static const Color borderLight = Color(0xFF38383D);
  static const Color borderFocused = Color(0xFFFF5708);

  // Typography Neutrals
  static const Color textPrimary = Color(0xFFE5E2E3);
  static const Color textSecondary = Color(0xFFA1A1AA);
  static const Color textTertiary = Color(0xFF71717A);
  static const Color textInverse = Color(0xFF0E0E0F);
  static const Color textBrand = Color(0xFFFF5708);

  // Channel Badges
  static const Color dineInBadgeBg = Color(0x20FF5708);
  static const Color dineInBadgeText = Color(0xFFFF7A39);
  static const Color takeawayBadgeBg = Color(0x20F59E0B);
  static const Color takeawayBadgeText = Color(0xFFFBBF24);
}

class AppSpacing {
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
}

class AppRadius {
  static const double sm = 6.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 24.0;
  static const double full = 9999.0;
}

class AppShadows {
  static const List<BoxShadow> card = [
    BoxShadow(
      color: Color(0x40000000),
      offset: Offset(0, 4),
      blurRadius: 16,
      spreadRadius: 0,
    ),
  ];

  static const List<BoxShadow> elevated = [
    BoxShadow(
      color: Color(0x60000000),
      offset: Offset(0, 8),
      blurRadius: 24,
      spreadRadius: 0,
    ),
  ];

  static const List<BoxShadow> glowPrimary = [
    BoxShadow(
      color: Color(0x33FF5708),
      offset: Offset(0, 4),
      blurRadius: 16,
      spreadRadius: 0,
    ),
  ];
}
