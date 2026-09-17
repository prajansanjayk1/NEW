// ==============================================================================
// KINGS OF WINGS — MENU PERFORMANCE & 2x2 MATRIX COMPONENT
// Demand vs Profitability Quadrants, Threshold Sliders, and Recipe Margins
// ==============================================================================

import React, { useState } from 'react';
import {
  MenuAnalyticsData,
  MenuMatrixQuadrant,
  MenuSortView,
  MenuItemPerformance,
  MenuMatrixConfig,
} from '../../services/analytics/analyticsTypes';
import { 
  Flame, 
  Percent, 
  Sliders, 
  Star, 
  HelpCircle, 
  TrendingDown, 
  Layers, 
  Check, 
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';

interface MenuAnalyticsProps {
  data: MenuAnalyticsData;
  matrixConfig: MenuMatrixConfig;
  onUpdateMatrixConfig: (newConfig: MenuMatrixConfig) => void;
}

export const MenuAnalytics: React.FC<MenuAnalyticsProps> = ({
  data,
  matrixConfig,
  onUpdateMatrixConfig,
}) => {
  const { items, quadrantCounts, totalMenuRevenue, overallFoodCostPercentage } = data;

  const [activeQuadrantFilter, setActiveQuadrantFilter] = useState<MenuMatrixQuadrant | 'ALL'>('ALL');
  const [sortView, setSortView] = useState<MenuSortView>('TOP_SELLERS');
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);

  // Local sliders state
  const [tempDemandThreshold, setTempDemandThreshold] = useState<number>(matrixConfig.demandMedianThreshold);
  const [tempMarginThreshold, setTempMarginThreshold] = useState<number>(matrixConfig.marginPercentageThreshold);

  const applyThresholds = () => {
    onUpdateMatrixConfig({
      demandMedianThreshold: tempDemandThreshold,
      marginPercentageThreshold: tempMarginThreshold,
    });
    setShowConfigPanel(false);
  };

  // Filter items
  let filteredItems = activeQuadrantFilter === 'ALL'
    ? items
    : items.filter((item) => item.quadrant === activeQuadrantFilter);

  // Sort items
  filteredItems = [...filteredItems].sort((a, b) => {
    switch (sortView) {
      case 'TOP_SELLERS':
        return b.unitsSold - a.unitsSold;
      case 'HIGH_REVENUE':
        return b.revenue - a.revenue;
      case 'HIGH_MARGIN':
        return (100 - a.foodCostPercentage) - (100 - b.foodCostPercentage);
      case 'LOW_MARGIN':
        return (100 - b.foodCostPercentage) - (100 - a.foodCostPercentage);
      case 'LOW_DEMAND':
        return a.unitsSold - b.unitsSold;
      case 'HIGH_WASTAGE_IMPACT':
        return b.totalFoodCost - a.totalFoodCost;
    }
  });

  const getQuadrantBadge = (quadrant: MenuMatrixQuadrant) => {
    switch (quadrant) {
      case 'STARS':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            ⭐ Star
          </span>
        );
      case 'PLOWHORSES':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
            🐴 Plowhorse
          </span>
        );
      case 'PUZZLES':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            ❓ Puzzle
          </span>
        );
      case 'DOGS':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            🐶 Dog
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 2x2 Matrix Overview Card with Threshold Controls */}
      <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#ff5708]" />
              <span>2x2 Menu Performance Matrix (Demand vs Profitability)</span>
            </h3>
            <p className="text-xs text-[#8b807a] mt-0.5">
              High Demand: ≥ {matrixConfig.demandMedianThreshold} units • High Margin: ≥ {matrixConfig.marginPercentageThreshold}% gross margin
            </p>
          </div>

          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/[0.08]"
          >
            <Sliders className="w-3.5 h-3.5 text-[#ff7a29]" />
            <span>{showConfigPanel ? 'Close Thresholds' : 'Adjust Thresholds'}</span>
          </button>
        </div>

        {/* Threshold Adjustment Panel */}
        {showConfigPanel && (
          <div className="p-4 rounded-xl bg-[#1c191a] border border-[#ff5708]/30 space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#a0948e]">Demand Median Threshold (Units Sold):</span>
                  <span className="text-[#ff5708] font-mono">{tempDemandThreshold} units</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={tempDemandThreshold}
                  onChange={(e) => setTempDemandThreshold(parseInt(e.target.value))}
                  className="w-full accent-[#ff5708] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#a0948e]">Gross Margin Threshold (%):</span>
                  <span className="text-emerald-400 font-mono">{tempMarginThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="85"
                  step="1"
                  value={tempMarginThreshold}
                  onChange={(e) => setTempMarginThreshold(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setShowConfigPanel(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#8b807a] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={applyThresholds}
                className="px-4 py-1.5 rounded-lg bg-[#ff5708] text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider"
              >
                Apply Thresholds
              </button>
            </div>
          </div>
        )}

        {/* Quadrant Visual Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Stars */}
          <div 
            onClick={() => setActiveQuadrantFilter(activeQuadrantFilter === 'STARS' ? 'ALL' : 'STARS')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeQuadrantFilter === 'STARS'
                ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-[#181516] border-white/[0.08] hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Stars</span>
              </span>
              <span className="text-base font-black font-mono text-white">{quadrantCounts.STARS}</span>
            </div>
            <div className="text-[11px] text-[#8b807a] mt-1.5">
              High Demand • High Profit
            </div>
            <p className="text-[10px] text-[#a0948e] mt-2 border-t border-white/[0.06] pt-1.5">
              Action: Maintain precise recipe consistency & keep prominent placement.
            </p>
          </div>

          {/* Plowhorses */}
          <div 
            onClick={() => setActiveQuadrantFilter(activeQuadrantFilter === 'PLOWHORSES' ? 'ALL' : 'PLOWHORSES')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeQuadrantFilter === 'PLOWHORSES'
                ? 'bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/20'
                : 'bg-[#181516] border-white/[0.08] hover:border-sky-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400">🐴 Plowhorses</span>
              <span className="text-base font-black font-mono text-white">{quadrantCounts.PLOWHORSES}</span>
            </div>
            <div className="text-[11px] text-[#8b807a] mt-1.5">
              High Demand • Low Profit
            </div>
            <p className="text-[10px] text-[#a0948e] mt-2 border-t border-white/[0.06] pt-1.5">
              Action: Re-evaluate portion sizes or make modest price adjustments.
            </p>
          </div>

          {/* Puzzles */}
          <div 
            onClick={() => setActiveQuadrantFilter(activeQuadrantFilter === 'PUZZLES' ? 'ALL' : 'PUZZLES')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeQuadrantFilter === 'PUZZLES'
                ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-[#181516] border-white/[0.08] hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">❓ Puzzles</span>
              <span className="text-base font-black font-mono text-white">{quadrantCounts.PUZZLES}</span>
            </div>
            <div className="text-[11px] text-[#8b807a] mt-1.5">
              Low Demand • High Profit
            </div>
            <p className="text-[10px] text-[#a0948e] mt-2 border-t border-white/[0.06] pt-1.5">
              Action: Boost visibility via AI Concierge prompts and combo pairings.
            </p>
          </div>

          {/* Dogs */}
          <div 
            onClick={() => setActiveQuadrantFilter(activeQuadrantFilter === 'DOGS' ? 'ALL' : 'DOGS')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              activeQuadrantFilter === 'DOGS'
                ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/20'
                : 'bg-[#181516] border-white/[0.08] hover:border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400">🐶 Dogs</span>
              <span className="text-base font-black font-mono text-white">{quadrantCounts.DOGS}</span>
            </div>
            <div className="text-[11px] text-[#8b807a] mt-1.5">
              Low Demand • Low Profit
            </div>
            <p className="text-[10px] text-[#a0948e] mt-2 border-t border-white/[0.06] pt-1.5">
              Action: Reformulate recipe, lower holding waste, or retire item.
            </p>
          </div>
        </div>
      </div>

      {/* Sort Views Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8b807a]">Filter:</span>
          {['ALL', 'STARS', 'PLOWHORSES', 'PUZZLES', 'DOGS'].map((q) => (
            <button
              key={q}
              onClick={() => setActiveQuadrantFilter(q as any)}
              className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                activeQuadrantFilter === q
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-[#8b807a] hover:text-white'
              }`}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8b807a]">Sort By:</span>
          <select
            value={sortView}
            onChange={(e) => setSortView(e.target.value as any)}
            className="bg-[#181516] border border-white/[0.1] rounded-lg px-2.5 py-1 text-white text-xs"
          >
            <option value="TOP_SELLERS">Top Sellers (Units Sold)</option>
            <option value="HIGH_REVENUE">Highest Revenue</option>
            <option value="HIGH_MARGIN">Highest Margin %</option>
            <option value="LOW_MARGIN">Lowest Margin %</option>
            <option value="LOW_DEMAND">Low Demand</option>
            <option value="HIGH_WASTAGE_IMPACT">High Ingredient Cost</option>
          </select>
        </div>
      </div>

      {/* Detailed Menu Items Table */}
      <div className="bg-[#161415] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a1718] text-[#8b807a] font-['Syne',sans-serif] uppercase text-[10px]">
              <tr>
                <th className="p-3">Menu Item</th>
                <th className="p-3">Category</th>
                <th className="p-3">Matrix Quadrant</th>
                <th className="p-3 text-right">Units Sold</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-right">Food Cost</th>
                <th className="p-3 text-right">Gross Margin</th>
                <th className="p-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-white">
              {filteredItems.map((item) => (
                <tr key={item.menuItemId} className="hover:bg-white/[0.02]">
                  <td className="p-3 font-bold">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-[#a0948e]">{item.category}</td>
                  <td className="p-3">{getQuadrantBadge(item.quadrant)}</td>
                  <td className="p-3 font-mono font-bold text-right">{item.unitsSold}</td>
                  <td className="p-3 font-mono text-right">₹{item.averageSellingPrice}</td>
                  <td className="p-3 font-mono text-right text-rose-400">
                    ₹{item.ingredientCost} <span className="text-[10px] text-[#7d716c]">({item.foodCostPercentage}%)</span>
                  </td>
                  <td className="p-3 font-mono text-right text-emerald-400">
                    ₹{item.estimatedGrossMargin} <span className="text-[10px] text-[#7d716c]">({100 - item.foodCostPercentage}%)</span>
                  </td>
                  <td className="p-3 font-mono font-bold text-right text-[#ff7a29]">
                    ₹{item.revenue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
