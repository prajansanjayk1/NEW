import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';

class QrManagerScreen extends StatefulWidget {
  const QrManagerScreen({super.key});

  @override
  State<QrManagerScreen> createState() => _QrManagerScreenState();
}

class _QrManagerScreenState extends State<QrManagerScreen> {
  String _selectedType = 'TABLE';
  String _targetIdentifier = '07';

  String get _currentQrPayload {
    if (_selectedType == 'TABLE') {
      return 'restaurant://table/$_targetIdentifier';
    } else {
      return 'restaurant://takeaway/$_targetIdentifier';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Dynamic QR Code Generator'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'TABLE', label: Text('Dine-In Table'), icon: Icon(LucideIcons.utensils)),
                ButtonSegment(value: 'TAKEAWAY', label: Text('Takeaway Counter'), icon: Icon(LucideIcons.shoppingBag)),
              ],
              selected: {_selectedType},
              onSelectionChanged: (set) {
                setState(() {
                  _selectedType = set.first;
                  _targetIdentifier = _selectedType == 'TABLE' ? '07' : 'pickup-counter-01';
                });
              },
            ),
            const SizedBox(height: 24),

            // High-Resolution Card with QR Code
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                boxShadow: AppShadows.elevated,
              ),
              child: Column(
                children: [
                  Text(
                    'KINGS OF WINGS',
                    style: TextStyle(
                      fontFamily: 'Syne',
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Colors.black,
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _selectedType == 'TABLE'
                        ? 'TABLE $_targetIdentifier'
                        : 'EXPRESS PICKUP COUNTER',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  QrImageView(
                    data: _currentQrPayload,
                    version: QrVersions.auto,
                    size: 220.0,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Colors.black,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Scan with Mobile App or Camera to Order',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _currentQrPayload,
                    style: TextStyle(fontSize: 9, color: Colors.grey.shade500, fontFamily: 'monospace'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Controls
            TextField(
              decoration: InputDecoration(
                labelText: _selectedType == 'TABLE' ? 'Table Number' : 'Counter Identifier',
                prefixIcon: const Icon(LucideIcons.tag),
              ),
              controller: TextEditingController(text: _targetIdentifier),
              onChanged: (val) {
                setState(() => _targetIdentifier = val);
              },
            ),
          ],
        ),
      ),
    );
  }
}
