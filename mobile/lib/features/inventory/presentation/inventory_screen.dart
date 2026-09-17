import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../app/theme/app_colors.dart';

class InventoryItem {
  final String name;
  final String category;
  final double currentStock;
  final double minThreshold;
  final String unit;
  final bool isLow;

  const InventoryItem({
    required this.name,
    required this.category,
    required this.currentStock,
    required this.minThreshold,
    required this.unit,
    required this.isLow,
  });
}

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final List<InventoryItem> _items = [
    const InventoryItem(name: 'Fresh Chicken Wings (Grade A)', category: 'Meat & Poultry', currentStock: 48.0, minThreshold: 20.0, unit: 'kg', isLow: false),
    const InventoryItem(name: 'Carolina Reaper Puree', category: 'Sauces & Spices', currentStock: 2.2, minThreshold: 5.0, unit: 'liters', isLow: true),
    const InventoryItem(name: 'Aged Cayenne Pepper Sauce', category: 'Sauces & Spices', currentStock: 18.5, minThreshold: 10.0, unit: 'liters', isLow: false),
    const InventoryItem(name: 'Thermal Foil Takeaway Boxes', category: 'Packaging', currentStock: 65.0, minThreshold: 100.0, unit: 'units', isLow: true),
    const InventoryItem(name: 'Kraft Takeaway Carry Bags', category: 'Packaging', currentStock: 240.0, minThreshold: 80.0, unit: 'units', isLow: false),
    const InventoryItem(name: 'Canola Frying Oil', category: 'Pantry', currentStock: 75.0, minThreshold: 30.0, unit: 'liters', isLow: false),
    const InventoryItem(name: '24-Month Aged Parmesan', category: 'Dairy', currentStock: 4.0, minThreshold: 2.5, unit: 'kg', isLow: false),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Live Stock & Procurement'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _items.length,
        itemBuilder: (context, index) {
          final item = _items[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: item.isLow
                          ? AppColors.error.withOpacity(0.15)
                          : AppColors.surfaceElevated,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      item.isLow ? LucideIcons.alertTriangle : LucideIcons.check,
                      color: item.isLow ? AppColors.error : AppColors.success,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        Text(
                          '${item.category} • Min threshold: ${item.minThreshold.toStringAsFixed(0)} ${item.unit}',
                          style: const TextStyle(fontSize: 11, color: AppColors.textTertiary),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${item.currentStock.toStringAsFixed(1)} ${item.unit}',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                          color: item.isLow ? AppColors.error : AppColors.textPrimary,
                        ),
                      ),
                      if (item.isLow)
                        const Text(
                          'LOW STOCK',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.error,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
