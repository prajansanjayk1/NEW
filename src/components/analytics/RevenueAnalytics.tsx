// ==============================================================================
// KINGS OF WINGS — REVENUE ANALYTICS COMPONENT
// Granular Financial Reporting: Gross, Net, Taxes, Service Pool, Settlements
// ==============================================================================

import React, { useState } from 'react';
import { RevenueAnalyticsData } from '../../services/analytics/analyticsTypes';
import { IndianRupee, CreditCard, Smartphone, Banknote, HelpCircle, Layers, DollarSign } from 'lucide-react';

interface RevenueAnalyticsProps {
  data: RevenueAnalyticsData;
}

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ data }) => {
  const { breakdown, byCategory, byHour, byTable, byPaymentMethod } = data;
  const [activeSubTab, setActiveSubTab] = useState<'HOURLY' | 'CATEGORIES' | 'TABLES' | 'PAYMENTS'>('CATEGORIES');

  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Financial Accounting Breakdown Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Gross Sales (Menu)
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {formatCurrency(breakdown.grossSales)}
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">Sum of item retail prices</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            GST (5.00%)
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {formatCurrency(breakdown.tax)}
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">Statutory tax provision</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Service Charge (5%)
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {formatCurrency(breakdown.serviceCharge)}
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">Floor & runner pool</span>
        </div>

        <div className="bg-[#1f1715] border border-[#ff5708]/30 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff7a29] block font-['Syne',sans-serif]">
            Net Billed Sales
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {formatCurrency(breakdown.netSales)}
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Total customer invoice sum</span>
        </div>
      </div>

      {/* Settlement vs Outstanding Reconciliation */}
      <div className="p-4 rounded-xl bg-[#141213] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] text-[#8b807a] font-bold uppercase block">Paid & Settled</span>
            <span className="text-lg font-black text-emerald-400 font-['Syne',sans-serif]">
              {formatCurrency(breakdown.paidAmount)}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <span className="text-[10px] text-[#8b807a] font-bold uppercase block">Outstanding / Open Tabs</span>
            <span className="text-lg font-black text-amber-400 font-['Syne',sans-serif]">
              {formatCurrency(breakdown.outstandingAmount)}
            </span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <span className="text-[10px] text-[#8b807a] font-bold uppercase block">Refunds</span>
            <span className="text-lg font-black text-[#8b807a] font-['Syne',sans-serif]">
              {formatCurrency(breakdown.refunds)}
            </span>
          </div>
        </div>

        <div className="text-xs text-[#a0948e] max-w-xs">
          Order value represents total tickets ordered; Settled amount is actual cash/UPI funds captured.
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        {[
          { id: 'CATEGORIES', label: 'By Category' },
          { id: 'HOURLY', label: 'By Operating Hour' },
          { id: 'PAYMENTS', label: 'Payment Gateway Mix' },
          { id: 'TABLES', label: 'Table Revenue' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-colors ${
              activeSubTab === tab.id
                ? 'bg-[#ff5708] text-white shadow-lg shadow-[#ff5708]/20'
                : 'text-[#8b807a] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: By Category */}
      {activeSubTab === 'CATEGORIES' && (
        <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5">
          <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider mb-4">
            Category Sales Contribution
          </h3>

          <div className="space-y-4">
            {byCategory.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{cat.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#8b807a]">{cat.quantitySold} units sold</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(cat.revenue)}</span>
                    <span className="font-mono text-[10px] text-[#ff7a29] w-12 text-right">
                      {cat.percentageOfTotal}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ff5708] to-[#ff7a29]"
                    style={{ width: `${cat.percentageOfTotal}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Hourly Velocity */}
      {activeSubTab === 'HOURLY' && (
        <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5">
          <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider mb-4">
            Hourly Revenue Velocity
          </h3>

          <div className="space-y-3">
            {byHour.map((h) => {
              const maxRev = Math.max(...byHour.map((o) => o.netSales), 1);
              const percentage = Math.round((h.netSales / maxRev) * 100);

              return (
                <div key={h.hour} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-white font-bold">{h.hour}</span>
                    <span className="text-[#a0948e] font-mono">
                      {h.orderCount} tickets • {formatCurrency(h.netSales)} (Avg: {formatCurrency(h.avgOrderValue)})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Payments Gateway Mix */}
      {activeSubTab === 'PAYMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {byPaymentMethod.map((pm) => (
            <div key={pm.method} className="p-5 rounded-2xl bg-[#161415] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {pm.method === 'UPI' ? (
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                  ) : pm.method === 'CARD' ? (
                    <CreditCard className="w-5 h-5 text-sky-400" />
                  ) : (
                    <Banknote className="w-5 h-5 text-amber-400" />
                  )}
                  <span className="font-bold text-white text-sm">{pm.method} Pay</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#ff7a29]">{pm.percentageOfRevenue}%</span>
              </div>

              <div className="text-2xl font-black text-white font-['Syne',sans-serif] mb-1">
                {formatCurrency(pm.totalCollected)}
              </div>

              <div className="text-[11px] text-[#8b807a] space-y-0.5">
                <div>{pm.transactionCount} transactions captured</div>
                <div className="text-emerald-400">100% settlement clearance</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Table Revenue */}
      {activeSubTab === 'TABLES' && (
        <div className="bg-[#161415] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.08]">
            <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider">
              Revenue Generated by Table Station
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1a1718] text-[#8b807a] font-['Syne',sans-serif] uppercase text-[10px]">
                <tr>
                  <th className="p-3">Table</th>
                  <th className="p-3">Dining Zone</th>
                  <th className="p-3">Sessions</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3 text-right">Total Revenue</th>
                  <th className="p-3 text-right">Avg / Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-white">
                {byTable.map((tbl) => (
                  <tr key={tbl.tableNumber} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-bold font-mono">Table {tbl.tableNumber}</td>
                    <td className="p-3 text-[#a0948e]">{tbl.zone}</td>
                    <td className="p-3 font-mono">{tbl.sessionCount}</td>
                    <td className="p-3 font-mono">{tbl.orderCount}</td>
                    <td className="p-3 font-mono font-bold text-right">{formatCurrency(tbl.revenue)}</td>
                    <td className="p-3 font-mono text-[#ff7a29] text-right">{formatCurrency(tbl.avgSpendPerSession)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
