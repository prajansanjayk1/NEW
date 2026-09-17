// ==============================================================================
// KINGS OF WINGS — TABLE & DINING ROOM ANALYTICS COMPONENT
// Floor Heatmap, Turnover Rates, Dining Durations, and RevPASH Metrics
// ==============================================================================

import React, { useState } from 'react';
import { TableAnalyticsData, TablePerformanceMetric } from '../../services/analytics/analyticsTypes';
import { Users, Clock, Flame, IndianRupee, Layers, Grid, RefreshCw } from 'lucide-react';

interface TableAnalyticsProps {
  data: TableAnalyticsData;
}

export const TableAnalytics: React.FC<TableAnalyticsProps> = ({ data }) => {
  const { 
    averageTableUtilizationPct, 
    totalSessionsCount, 
    averageSessionDurationMinutes, 
    averageOrderValuePerTable, 
    averageTurnoverRate, 
    peakOccupancyPeriod, 
    zoneBreakdown, 
    tables 
  } = data;

  const [selectedZone, setSelectedZone] = useState<string>('ALL');

  const filteredTables = selectedZone === 'ALL'
    ? tables
    : tables.filter((t) => t.zone === selectedZone);

  return (
    <div className="space-y-6">
      {/* Top Table Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Table Utilization
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {averageTableUtilizationPct}%
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Peak: {peakOccupancyPeriod}</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Avg Dining Duration
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {averageSessionDurationMinutes} min
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">From QR scan to payment</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Table Turnover Rate
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif] mt-1">
            {averageTurnoverRate} turns
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Daily completed sessions</span>
        </div>

        <div className="bg-[#181516] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b807a] block font-['Syne',sans-serif]">
            Avg Table Spend
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#ff7a29] font-['Syne',sans-serif] mt-1">
            ₹{averageOrderValuePerTable}
          </div>
          <span className="text-[10px] text-[#7d716c] mt-1 block">Across {totalSessionsCount} guest sessions</span>
        </div>
      </div>

      {/* Interactive Floor Heatmap */}
      <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Grid className="w-4 h-4 text-[#ff5708]" />
              <span>Dining Room Floor Heatmap & Utilization</span>
            </h3>
            <p className="text-xs text-[#8b807a] mt-0.5">
              Visual floor layout colored by relative revenue and occupancy intensity
            </p>
          </div>

          {/* Zone Filter Chips */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8b807a]">Zone:</span>
            {['ALL', 'Main Dining', 'Window Booths'].map((zone) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  selectedZone === zone
                    ? 'bg-[#ff5708] text-white'
                    : 'bg-white/5 text-[#8b807a] hover:text-white'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        {/* Floor Heatmap Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {filteredTables.map((t) => {
            const isHighRev = t.totalRevenue > 3000;
            const isOccupied = t.status !== 'AVAILABLE' && t.status !== 'CLOSED';

            return (
              <div
                key={t.tableNumber}
                className={`p-3.5 rounded-xl border transition-all ${
                  isOccupied
                    ? 'bg-[#1f1715] border-[#ff5708]/40 ring-1 ring-[#ff5708]/20'
                    : 'bg-[#181516] border-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm font-mono">T-{t.tableNumber}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isOccupied ? 'bg-[#ff5708]/20 text-[#ff7a29]' : 'bg-white/10 text-[#8b807a]'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="text-xs text-[#8b807a] space-y-1">
                  <div>Capacity: {t.capacity} seats</div>
                  <div>Sessions: <strong className="text-white font-mono">{t.sessionsCount}</strong></div>
                  <div className="text-emerald-400 font-mono font-bold">
                    ₹{t.totalRevenue.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-[#7d716c]">RevPASH: ₹{t.revenuePerAvailableSeatHour}/hr</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone Performance Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {zoneBreakdown.map((z) => (
          <div key={z.zone} className="p-4 rounded-xl bg-[#161415] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">{z.zone}</span>
              <span className="text-xs font-mono text-[#ff7a29] font-bold">{z.avgUtilizationPct}% utilization</span>
            </div>
            <div className="text-xs text-[#8b807a] space-y-1">
              <div>{z.tableCount} tables • {z.sessionsCount} total sessions</div>
              <div className="text-white font-bold">Total Zone Revenue: ₹{z.revenue.toLocaleString('en-IN')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
