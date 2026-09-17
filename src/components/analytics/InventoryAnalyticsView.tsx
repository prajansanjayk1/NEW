// ==============================================================================
// KINGS OF WINGS — INVENTORY, WASTAGE & PROCUREMENT ANALYTICS COMPONENT
// Valuation Trends, Documented Wastage Formula, and Supplier Delivery SLAs
// ==============================================================================

import React, { useState } from 'react';
import { InventoryAnalyticsData, ProcurementAnalyticsData } from '../../services/analytics/analyticsTypes';
import { Package, Trash2, Truck, AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface InventoryAnalyticsViewProps {
  inventory: InventoryAnalyticsData;
  procurement: ProcurementAnalyticsData;
}

export const InventoryAnalyticsView: React.FC<InventoryAnalyticsViewProps> = ({
  inventory,
  procurement,
}) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'WASTAGE' | 'PROCUREMENT'>('WASTAGE');

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        {[
          { id: 'WASTAGE', label: 'Wastage & Spoilage Analysis', icon: Trash2 },
          { id: 'INVENTORY', label: 'Inventory Valuation & COGS', icon: Package },
          { id: 'PROCUREMENT', label: 'Supplier SLAs & Purchasing', icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#ff5708] text-white shadow-lg shadow-[#ff5708]/20'
                  : 'text-[#8b807a] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Wastage Analysis */}
      {activeTab === 'WASTAGE' && (
        <div className="space-y-6">
          {/* Wastage Formula Transparency Banner (PART 11 Requirement) */}
          <div className="p-4 rounded-xl bg-[#1a1718] border border-white/[0.08] flex items-start gap-3 text-xs">
            <Info className="w-5 h-5 text-[#ff7a29] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white uppercase tracking-wider block font-['Syne',sans-serif]">
                Documented Wastage Ratio Formula
              </span>
              <p className="text-[#a0948e] mt-1 font-mono">
                Wastage % = (Wastage Value / (Cost of Goods Consumed + Wastage Value)) × 100
              </p>
              <p className="text-[11px] text-[#7d716c] mt-1">
                Currently: (₹{inventory.totalWastageValue} / (₹{inventory.consumptionValue} + ₹{inventory.totalWastageValue})) × 100 = <strong className="text-emerald-400">{inventory.wastagePercentage}%</strong> (Target benchmark: &lt; 2.50%)
              </p>
            </div>
          </div>

          {/* Top Wastage Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Total Waste Value
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-['Syne',sans-serif] mt-1">
                {formatCurrency(inventory.totalWastageValue)}
              </div>
              <span className="text-[10px] text-[#7d716c] mt-1 block">Total ingredient scrap loss</span>
            </div>

            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Total Scrap Mass
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
                {inventory.totalWastageQuantity} kg
              </div>
              <span className="text-[10px] text-[#7d716c] mt-1 block">Recorded by station cooks</span>
            </div>

            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Wastage Ratio
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-['Syne',sans-serif] mt-1">
                {inventory.wastagePercentage}%
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">Healthy (&lt; 2.5% safe cap)</span>
            </div>

            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Expiry Discards
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
                {formatCurrency(inventory.expiryLossesValue)}
              </div>
              <span className="text-[10px] text-[#7d716c] mt-1 block">FEFO managed batches</span>
            </div>
          </div>

          {/* Wastage by Standard Reason & Top Wasted Ingredients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wastage by Reason */}
            <div className="p-5 rounded-2xl bg-[#161415] border border-white/[0.08]">
              <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider mb-4">
                Wastage by Operational Reason
              </h3>

              <div className="space-y-3">
                {inventory.wastageByReason.map((wr) => (
                  <div key={wr.reason} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">{wr.label}</span>
                      <span className="font-mono text-[#a0948e]">{formatCurrency(wr.value)} ({wr.percentageOfWastageValue}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${wr.percentageOfWastageValue}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Wasted Ingredients */}
            <div className="p-5 rounded-2xl bg-[#161415] border border-white/[0.08]">
              <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider mb-4">
                Top Scrapped Ingredients
              </h3>

              <div className="divide-y divide-white/[0.06]">
                {inventory.topWastedIngredients.map((ing) => (
                  <div key={ing.ingredientId} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{ing.name}</div>
                      <span className="text-[10px] text-[#7d716c] uppercase">{ing.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white">{ing.quantity} {ing.unit}</div>
                      <div className="font-mono text-rose-400 text-[10px]">{formatCurrency(ing.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inventory Valuation & COGS */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                On-Hand Valuation
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
                {formatCurrency(inventory.totalInventoryValuation)}
              </div>
              <span className="text-[10px] text-[#7d716c] mt-1 block">Walk-in cooler & dry store</span>
            </div>

            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Period COGS Consumption
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
                {formatCurrency(inventory.consumptionValue)}
              </div>
              <span className="text-[10px] text-[#7d716c] mt-1 block">Actual recipe deductions</span>
            </div>

            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Food Cost %
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-['Syne',sans-serif] mt-1">
                {inventory.foodCostPercentageOfSales}%
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">Healthy margin buffer</span>
            </div>

            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Stockout Events
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
                {inventory.stockoutEventsCount}
              </div>
              <span className="text-[10px] text-[#7d716c] mt-1 block">{inventory.lowStockEventsCount} items at reorder par</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Procurement & Suppliers */}
      {activeTab === 'PROCUREMENT' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Total PO Spend
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
                {formatCurrency(procurement.totalPurchaseSpend)}
              </div>
              <span className="text-[10px] text-[#7d716c] mt-1 block">{procurement.totalPurchaseOrdersCount} purchase orders</span>
            </div>

            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Avg Delivery Lead Time
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
                {procurement.averageDeliveryLeadDays} Days
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">PO to receiving dock</span>
            </div>

            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Late / Partial Deliveries
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-['Syne',sans-serif] mt-1">
                0
              </div>
              <span className="text-[10px] text-emerald-400 mt-1 block">100% vendor fulfillment</span>
            </div>

            <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
                Active Suppliers
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
                {procurement.activeSuppliersCount}
              </div>
              <span className="text-[10px] text-[#7d716c] mt-1 block">Primary vendor network</span>
            </div>
          </div>

          {/* Supplier Performance Table */}
          <div className="bg-[#161415] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/[0.08]">
              <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider">
                Supplier Delivery SLAs & Spend Distribution
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1718] text-[#8b807a] font-['Syne',sans-serif] uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Vendor / Supplier</th>
                    <th className="p-3">POs</th>
                    <th className="p-3 text-right">Total Spend</th>
                    <th className="p-3 text-right">Lead Time</th>
                    <th className="p-3 text-right">On-Time Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-white">
                  {procurement.supplierPerformance.map((s) => (
                    <tr key={s.supplierId} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold">{s.name}</td>
                      <td className="p-3 font-mono">{s.ordersCount}</td>
                      <td className="p-3 font-mono font-bold text-right">{formatCurrency(s.totalSpend)}</td>
                      <td className="p-3 font-mono text-right">{s.averageDeliveryLeadDays} days</td>
                      <td className="p-3 font-mono text-emerald-400 text-right font-bold">{s.onTimeDeliveryRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
