import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';
import '../../table_session/presentation/table_session_provider.dart';
import '../../menu/presentation/menu_provider.dart';
import '../../menu/domain/menu_item_model.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final MobileScannerController _cameraController = MobileScannerController();
  bool _hasScanned = false;

  @override
  void dispose() {
    _cameraController.dispose();
    super.dispose();
  }

  void _handleQrData(String? rawData) {
    if (_hasScanned || rawData == null) return;
    _hasScanned = true;

    // Handle deep links: restaurant://table/07 or restaurant://takeaway/express-counter-01
    final uri = Uri.tryParse(rawData);
    String tableNum = '07';
    bool isTakeaway = false;

    if (uri != null) {
      if (uri.host == 'table' || rawData.contains('/table/')) {
        tableNum = uri.pathSegments.isNotEmpty ? uri.pathSegments.last : '07';
      } else if (uri.host == 'takeaway' || rawData.contains('takeaway')) {
        isTakeaway = true;
      }
    }

    if (isTakeaway) {
      context.read<MenuProvider>().setChannel(SalesChannel.takeaway);
      context.go('/takeaway');
    } else {
      context.read<TableSessionProvider>().joinTable(tableNumber: tableNum);
      context.read<MenuProvider>().setChannel(SalesChannel.dineIn);
      context.go('/home');
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isTakeaway
              ? 'Connected to Express Takeaway Pickup Counter'
              : 'Joined Table $tableNum session live!',
        ),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Scan Table or Counter QR'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.flashlight),
            onPressed: () => _cameraController.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(LucideIcons.camera),
            onPressed: () => _cameraController.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _cameraController,
            onDetect: (capture) {
              final barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                if (barcode.rawValue != null) {
                  _handleQrData(barcode.rawValue);
                  break;
                }
              }
            },
          ),
          // Target Aiming Reticle
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary, width: 2),
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(width: 24, height: 24, decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.primary, width: 4), left: BorderSide(color: AppColors.primary, width: 4)))),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(width: 24, height: 24, decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.primary, width: 4), right: BorderSide(color: AppColors.primary, width: 4)))),
                  ),
                  Positioned(
                    bottom: 10,
                    left: 10,
                    child: Container(width: 24, height: 24, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.primary, width: 4), left: BorderSide(color: AppColors.primary, width: 4)))),
                  ),
                  Positioned(
                    bottom: 10,
                    right: 10,
                    child: Container(width: 24, height: 24, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.primary, width: 4), right: BorderSide(color: AppColors.primary, width: 4)))),
                  ),
                ],
              ),
            ),
          ),
          // Fallback Simulation Buttons
          Positioned(
            bottom: 36,
            left: 20,
            right: 20,
            child: Column(
              children: [
                const Text(
                  'Point camera at table card or test simulated scan:',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        icon: const Icon(LucideIcons.utensils, size: 16),
                        label: const Text('SIMULATE TABLE 07', style: TextStyle(fontSize: 11)),
                        onPressed: () => _handleQrData('restaurant://table/07'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(LucideIcons.shoppingBag, size: 16),
                        label: const Text('SIMULATE TAKEAWAY', style: TextStyle(fontSize: 11)),
                        onPressed: () => _handleQrData('restaurant://takeaway/pickup-01'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
