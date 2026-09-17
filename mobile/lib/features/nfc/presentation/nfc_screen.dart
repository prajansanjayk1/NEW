import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../table_session/presentation/table_session_provider.dart';
import '../../menu/presentation/menu_provider.dart';
import '../../menu/domain/menu_item_model.dart';

class NfcScreen extends StatefulWidget {
  const NfcScreen({super.key});

  @override
  State<NfcScreen> createState() => _NfcScreenState();
}

class _NfcScreenState extends State<NfcScreen> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  bool _isListening = true;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _simulateNfcRead(String tableNum) {
    context.read<TableSessionProvider>().joinTable(tableNumber: tableNum);
    context.read<MenuProvider>().setChannel(SalesChannel.dineIn);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('NFC Tag Read! Table $tableNum joined.'),
        backgroundColor: AppColors.primary,
      ),
    );
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('NFC Table Tap & Order'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  return Container(
                    width: 140 + (_pulseController.value * 20),
                    height: 140 + (_pulseController.value * 20),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.primary.withOpacity(0.15 - (_pulseController.value * 0.1)),
                      border: Border.all(
                        color: AppColors.primary.withOpacity(1.0 - _pulseController.value),
                        width: 2,
                      ),
                    ),
                    child: Center(
                      child: Container(
                        width: 90,
                        height: 90,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary,
                        ),
                        child: const Icon(LucideIcons.radio, color: Colors.white, size: 40),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 36),
              Text(
                'Hold Phone Near Table NFC Disc',
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Instant zero-click connection to Table Session and digital menu.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              ElevatedButton.icon(
                icon: const Icon(LucideIcons.checkCheck),
                label: const Text('TEST SIMULATE NFC TAP (TABLE 07)'),
                onPressed: () => _simulateNfcRead('07'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
