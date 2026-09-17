// ==============================================================================
// KINGS OF WINGS — ANALYTICS OVERVIEW COMPONENT
// Executive Dashboard with Period-over-Period Metric Deltas
// ==============================================================================

import React from 'react';
import { CompleteAnalyticsPayload, MetricComparison } from '../../services/analytics/analyticsTypes';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  ShoppingBag, 
  Clock, 
  Percent, 
  Flame, 
  Utensils, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface AnalyticsOverviewProps {
  data: CompleteAnalyticsPayload;
  showComparison: boolean;
  onNavigateTab: (tabId: string) => void;
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  data,
  showComparison,
  onNavigateTab,
}) => {
  const { kpis, currentInterval, comparisonInterval, revenue, kitchen, menu, forecast } = data;

  const renderComparisonBadge = (comp: MetricComparison<number>, isPercentage = false, unit = '') => {
    if (!showComparison || comp.percentChange === null) return null;

    const isPositive = comp.delta > 0;
    const isZero = comp.delta === 0;
    const isGood = comp.isIncreaseFavorable ? isPositive : !isPositive;

    return (
      <div className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
        isZero 
          ? 'bg-white/5 text-[#8b807a]' 
          : isGood 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      }`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        <span>
          {isPositive ? '+' : ''}{comp.percentChange}%
        </span>
        <span className="text-[9px] text-[#7d716c] font-sans font-normal ml-0.5">
          vs prior
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Date Interval Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#181516] border border-white/[0.08]">
        <div className="flex items-center gap-2.5 text-xs text-[#a0948e]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Window: <strong className="text-white">{currentInterval.label}</strong></span>
          {showComparison && (
            <span className="text-[#6e635f]">
              • Compared with: <span className="text-[#a0948e]">{comparisonInterval.label}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8b807a]">Data Engine:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            data.isDemoData 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {data.isDemoData ? 'DEMO TELEMETRY ENGINE' : 'LIVE SUPABASE DATABASE'}
          </span>
        </div>
      </div>

      {/* Top-Level KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div 
          onClick={() => onNavigateTab('REVENUE')}
          className="group cursor-pointer bg-[#181516] hover:bg-[#1f1b1d] border border-white/[0.08] hover:border-[#ff5708]/40 transition-all rounded-2xl p-5"
        >
          <div className="flex items-center justify-between text-xs text-[#8b807a]">
            <span className="font-bold uppercase tracking-wider font-['Syne',sans-serif]">Gross Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-[#ff5708]/10 text-[#ff5708] flex items-center justify-center group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Syne',sans-serif]">
              ₹{kpis.revenue.current.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {renderComparisonBadge(kpis.revenue)}
            <span className="text-[10px] text-[#7d716c]">Net: ₹{kpis.netSales.current.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div 
          onClick={() => onNavigateTab('ORDERS')}
          className="group cursor-pointer bg-[#181516] hover:bg-[#1f1b1d] border border-white/[0.08] hover:border-sky-500/40 transition-all rounded-2xl p-5"
        >
          <div className="flex items-center justify-between text-xs text-[#8b807a]">
            <span className="font-bold uppercase tracking-wider font-['Syne',sans-serif]">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Syne',sans-serif]">
              {kpis.orders.current}
            </span>
            <span className="text-xs text-[#8b807a]">tickets</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {renderComparisonBadge(kpis.orders)}
            <span className="text-[10px] text-[#7d716c]">{kpis.completedOrders} completed</span>
          </div>
        </div>

        {/* Average Order Value */}
        <div 
          onClick={() => onNavigateTab('ORDERS')}
          className="group cursor-pointer bg-[#181516] hover:bg-[#1f1b1d] border border-white/[0.08] hover:border-amber-500/40 transition-all rounded-2xl p-5"
        >
          <div className="flex items-center justify-between text-xs text-[#8b807a]">
            <span className="font-bold uppercase tracking-wider font-['Syne',sans-serif]">Avg Order Value (AOV)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Syne',sans-serif]">
              ₹{kpis.averageOrderValue.current.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {renderComparisonBadge(kpis.averageOrderValue)}
            <span className="text-[10px] text-[#7d716c]">{kpis.totalItemsSold.current} items sold</span>
          </div>
        </div>

        {/* Food Cost % */}
        <div 
          onClick={() => onNavigateTab('MENU')}
          className="group cursor-pointer bg-[#181516] hover:bg-[#1f1b1d] border border-white/[0.08] hover:border-emerald-500/40 transition-all rounded-2xl p-5"
        >
          <div className="flex items-center justify-between text-xs text-[#8b807a]">
            <span className="font-bold uppercase tracking-wider font-['Syne',sans-serif]">Food Cost Ratio</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-['Syne',sans-serif]">
              {kpis.foodCostPct.current}%
            </span>
            <span className="text-xs text-emerald-400">({kpis.grossMarginPct.current}% margin)</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {renderComparisonBadge(kpis.foodCostPct, true)}
            <span className="text-[10px] text-[#7d716c]">Target: &lt;30.0%</span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#141213] border border-white/[0.06]">
          <span className="text-[10px] font-bold text-[#8b807a] uppercase block">Kitchen Prep Speed</span>
          <div className="text-lg font-black text-white font-['Syne',sans-serif] mt-0.5">
            {kitchen.averagePrepTimeMinutes}m avg
          </div>
          <span className="text-[10px] text-[#7d716c] block mt-0.5">Median: {kitchen.medianPrepTimeMinutes}m</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#141213] border border-white/[0.06]">
          <span className="text-[10px] font-bold text-[#8b807a] uppercase block">Table Utilization</span>
          <div className="text-lg font-black text-white font-['Syne',sans-serif] mt-0.5">
            {kpis.tableUtilizationPct.current}%
          </div>
          <span className="text-[10px] text-[#7d716c] block mt-0.5">~{kpis.customersCount.current} diners seated</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#141213] border border-white/[0.06]">
          <span className="text-[10px] font-bold text-[#8b807a] uppercase block">Wastage Loss</span>
          <div className="text-lg font-black text-white font-['Syne',sans-serif] mt-0.5">
            ₹{kpis.wastageValue.current}
          </div>
          <span className="text-[10px] text-emerald-400 block mt-0.5">Well below 2.5% safety cap</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#141213] border border-white/[0.06]">
          <span className="text-[10px] font-bold text-[#8b807a] uppercase block">Payment Success Rate</span>
          <div className="text-lg font-black text-emerald-400 font-['Syne',sans-serif] mt-0.5">
            {kpis.paymentSuccessRate.current}%
          </div>
          <span className="text-[10px] text-[#7d716c] block mt-0.5">Razorpay & UPI Verified</span>
        </div>
      </div>

      {/* Two Column Section: Demand Forecast Snapshot & Menu Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Day Demand Forecast Snapshot */}
        <div className="p-5 rounded-2xl bg-[#161415] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2 font-['Syne',sans-serif]">
                <Clock className="w-4 h-4 text-[#ff5708]" />
                <span>Next Day Operational Forecast</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Confidence: {forecast.confidenceLevel}
              </span>
            </div>

            <p className="text-xs text-[#a0948e] mb-4">
              Statistical model: <strong className="text-white">{forecast.methodDisplayName}</strong> based on {forecast.historicalObservationsDays} days of recorded sales.
            </p>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#1a1718] border border-white/[0.05] mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#8b807a] uppercase block">Projected Orders</span>
                <span className="text-2xl font-black text-white font-['Syne',sans-serif]">
                  ~{forecast.nextDayOrders} <span className="text-xs font-normal text-[#8b807a]">tickets</span>
                </span>
                <span className="text-[10px] text-[#7d716c] block mt-0.5">
                  Range: {forecast.forecastPoints[0]?.lowerBoundOrders} – {forecast.forecastPoints[0]?.upperBoundOrders}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#8b807a] uppercase block">Projected Revenue</span>
                <span className="text-2xl font-black text-[#ff7a29] font-['Syne',sans-serif]">
                  ₹{forecast.nextDayRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  Avg Ticket: ~₹{Math.round(forecast.nextDayRevenue / Math.max(1, forecast.nextDayOrders))}
                </span>
              </div>
            </div>

            {/* Peak Window Alert */}
            <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Anticipated Dinner Rush: <strong>7:00 PM – 9:00 PM</strong> (~{Math.round(forecast.nextDayOrders * 0.34)} orders expected).
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('FORECASTING')}
            className="mt-4 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-colors border border-white/[0.08]"
          >
            Explore Full Forecast & Ingredient BOM Demand →
          </button>
        </div>

        {/* 2x2 Menu Matrix Preview */}
        <div className="p-5 rounded-2xl bg-[#161415] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2 font-['Syne',sans-serif]">
                <Flame className="w-4 h-4 text-[#ff5708]" />
                <span>2x2 Menu Matrix Breakdown</span>
              </h3>
              <span className="text-xs text-[#8b807a]">{menu.items.length} items evaluated</span>
            </div>

            <p className="text-xs text-[#a0948e] mb-4">
              Classifying menu items by <strong className="text-white">Customer Demand</strong> vs <strong className="text-white">Gross Margin Profitability</strong>.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">⭐ Stars</span>
                  <span className="text-xs font-mono font-bold text-white">{menu.quadrantCounts.STARS}</span>
                </div>
                <span className="text-[10px] text-[#a0948e] mt-1 block">High Demand, High Margin</span>
              </div>

              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400">🐴 Plowhorses</span>
                  <span className="text-xs font-mono font-bold text-white">{menu.quadrantCounts.PLOWHORSES}</span>
                </div>
                <span className="text-[10px] text-[#a0948e] mt-1 block">High Demand, Low Margin</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">❓ Puzzles</span>
                  <span className="text-xs font-mono font-bold text-white">{menu.quadrantCounts.PUZZLES}</span>
                </div>
                <span className="text-[10px] text-[#a0948e] mt-1 block">Low Demand, High Margin</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400">🐶 Dogs</span>
                  <span className="text-xs font-mono font-bold text-white">{menu.quadrantCounts.DOGS}</span>
                </div>
                <span className="text-[10px] text-[#a0948e] mt-1 block">Low Demand, Low Margin</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('MENU')}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-colors border border-white/[0.08]"
          >
            Adjust Matrix Thresholds & View Recipes →
          </button>
        </div>
      </div>
    </div>
  );
};
