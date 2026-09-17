// ==============================================================================
// KINGS OF WINGS — CUSTOMER BEHAVIOR & ITEM COMBINATIONS COMPONENT
// Party Sizes, Spend Tiers, and Frequent Itemsets with Sample Guards
// ==============================================================================

import React from 'react';
import { CustomerBehaviorAnalyticsData } from '../../services/analytics/analyticsTypes';
import { Users, ShoppingBag, Sparkles, Clock, Layers, ArrowRight } from 'lucide-react';

interface CustomerBehaviorAnalyticsProps {
  data: CustomerBehaviorAnalyticsData;
}

export const CustomerBehaviorAnalytics: React.FC<CustomerBehaviorAnalyticsProps> = ({ data }) => {
  const {
    averagePartySize,
    spendByPartySize,
    averageItemsPerSession,
    peakOrderingTime,
    topCombinations,
    repeatSessionPercentage,
  } = data;

  const formatCurrency = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Average Party Size
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {averagePartySize} Diners
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">Collaborative QR group tables</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Items / Session
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {averageItemsPerSession} Items
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">Wings + sides + drinks mix</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Peak Ordering Window
          </span>
          <div className="text-sm font-black text-[#ff7a29] font-['Syne',sans-serif] mt-2 truncate">
            {peakOrderingTime}
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">Prime table turn window</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Repeat Diners
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-['Syne',sans-serif] mt-1">
            {repeatSessionPercentage}%
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Returning within 30 days</span>
        </div>
      </div>

      {/* Spend by Party Size */}
      <div className="p-5 rounded-2xl bg-[#161415] border border-white/[0.08]">
        <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#ff5708]" />
          <span>Average Spend Distributed by Dining Party Size</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {spendByPartySize.map((p) => (
            <div key={p.partySize} className="p-3.5 rounded-xl bg-[#1a1718] border border-white/[0.05]">
              <div className="flex justify-between items-center text-xs text-[#8b807a] mb-1">
                <span>{p.partySize} {p.partySize === 1 ? 'Solo Diner' : 'Diners'}</span>
                <span className="font-mono text-white">{p.sessionCount} sessions</span>
              </div>
              <div className="text-xl font-black text-white font-['Syne',sans-serif]">
                {formatCurrency(p.avgSpend)}
              </div>
              <span className="text-[10px] text-[#7d716c] block mt-0.5">
                Per person: {formatCurrency(Math.round(p.avgSpend / p.partySize))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Popular 2 & 3 Item Combinations with Statistical Sample Guards (PART 14) */}
      <div className="p-5 rounded-2xl bg-[#161415] border border-white/[0.08] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Frequent Order Combinations (Basket Affinity)</span>
            </h3>
            <p className="text-xs text-[#8b807a] mt-0.5">
              Statistically significant item combinations (Minimum sample threshold: &gt; 5 co-occurrences)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {topCombinations.map((comb) => (
            <div 
              key={comb.combinationId}
              className="p-4 rounded-xl bg-[#1a1718] border border-white/[0.06] hover:border-amber-500/30 transition-all flex flex-wrap items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {comb.itemNames.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 text-white font-bold border border-white/[0.08]">
                        {item}
                      </span>
                      {idx < comb.itemNames.length - 1 && (
                        <span className="text-amber-400 font-bold">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-[10px] text-[#7d716c]">
                  Sample depth: observed {comb.ordersCount} times across {comb.sampleSizeOrders} qualifying order tickets
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-white text-sm">
                  {comb.percentageOfQualifyingOrders}% of orders
                </div>
                <div className="font-mono text-[10px] text-[#ff7a29] font-bold">
                  {formatCurrency(comb.totalCombinationRevenue)} total revenue
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
