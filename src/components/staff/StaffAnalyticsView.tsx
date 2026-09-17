// ==============================================================================
// KINGS OF WINGS — RESTAURANT BUSINESS INTELLIGENCE & ANALYTICS HUB (PHASE 8)
// Comprehensive Managerial Dashboard: Financials, 2x2 Menu Matrix, KDS Bottlenecks,
// Floor Heatmaps, Wastage Formulas, Statistical Forecasting, and Business Reports.
// ==============================================================================

import React, { useState } from 'react';
import { UserRole } from '../../types';
import { useAnalytics } from '../../hooks/useAnalytics';
import { AnalyticsDateRangePreset } from '../../services/analytics/analyticsTypes';

// Sub-components
import { AnalyticsOverview } from '../analytics/AnalyticsOverview';
import { RevenueAnalytics } from '../analytics/RevenueAnalytics';
import { OrderAnalytics } from '../analytics/OrderAnalytics';
import { MenuAnalytics } from '../analytics/MenuAnalytics';
import { KitchenAnalytics } from '../analytics/KitchenAnalytics';
import { TableAnalytics } from '../analytics/TableAnalytics';
import { ServiceAnalytics } from '../analytics/ServiceAnalytics';
import { InventoryAnalyticsView } from '../analytics/InventoryAnalyticsView';
import { CustomerBehaviorAnalytics } from '../analytics/CustomerBehaviorAnalytics';
import { ForecastPanel } from '../analytics/ForecastPanel';
import { BusinessReportsView } from '../analytics/BusinessReportsView';

import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingBag, 
  Utensils, 
  ChefHat, 
  Grid, 
  Bell, 
  Package, 
  Users, 
  Clock, 
  FileText, 
  RefreshCw, 
  Sliders,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface StaffAnalyticsViewProps {
  userRole: UserRole;
}

type AnalyticsTabId = 
  | 'OVERVIEW'
  | 'REVENUE'
  | 'ORDERS'
  | 'MENU'
  | 'KITCHEN'
  | 'TABLES'
  | 'SERVICE'
  | 'INVENTORY'
  | 'BEHAVIOR'
  | 'FORECASTING';

export const StaffAnalyticsView: React.FC<StaffAnalyticsViewProps> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('OVERVIEW');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  const {
    data,
    loading,
    error,
    refresh,
    dateRangePreset,
    setDateRangePreset,
    customRange,
    setCustomRange,
    showComparison,
    setShowComparison,
    matrixConfig,
    setMatrixConfig,
    forecastHorizon,
    setForecastHorizon,
    forecastMethod,
    setForecastMethod,
    activeReport,
    reportLoading,
    generateReport,
    closeReport,
  } = useAnalytics();

  const handlePresetSelect = (preset: AnalyticsDateRangePreset) => {
    setDateRangePreset(preset);
    setShowDatePicker(false);
  };

  const navTabs: { id: AnalyticsTabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'OVERVIEW', label: 'Executive Summary', icon: TrendingUp },
    { id: 'REVENUE', label: 'Revenue & Cash Flow', icon: IndianRupee },
    { id: 'ORDERS', label: 'Orders & Velocity', icon: ShoppingBag },
    { id: 'MENU', label: 'Menu & 2x2 Matrix', icon: Utensils },
    { id: 'KITCHEN', label: 'Kitchen & Bottlenecks', icon: ChefHat },
    { id: 'TABLES', label: 'Floor Heatmap & Tables', icon: Grid },
    { id: 'SERVICE', label: 'Table Service SLA', icon: Bell },
    { id: 'INVENTORY', label: 'Wastage & Inventory', icon: Package },
    { id: 'BEHAVIOR', label: 'Customer Behavior', icon: Users },
    { id: 'FORECASTING', label: 'Statistical Forecasting', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-['Syne',sans-serif] text-base sm:text-lg font-black uppercase text-white tracking-wider">
              Business Intelligence & Analytics Hub
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#ff5708]/20 text-[#ff7a29] border border-[#ff5708]/30">
              PHASE 8
            </span>
          </div>
          <p className="text-xs text-[#8f827d] mt-0.5">
            Real operational data telemetry, menu matrix profitability, and predictive demand models.
          </p>
        </div>

        {/* Global Controls: Period, Comparison, Reports, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181516] border border-white/[0.1] text-xs font-bold text-white hover:border-white/20 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-[#ff7a29]" />
              <span className="font-['Syne',sans-serif] uppercase">
                {dateRangePreset.replace(/_/g, ' ')}
              </span>
            </button>

            {showDatePicker && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#1a1718] border border-white/[0.1] shadow-2xl py-1 z-30 animate-in fade-in duration-150">
                {(
                  [
                    'TODAY',
                    'YESTERDAY',
                    'LAST_7_DAYS',
                    'LAST_30_DAYS',
                    'THIS_MONTH',
                    'LAST_MONTH',
                  ] as AnalyticsDateRangePreset[]
                ).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full text-left px-3 py-2 text-xs font-bold font-['Syne',sans-serif] uppercase transition-colors ${
                      dateRangePreset === preset
                        ? 'bg-[#ff5708] text-white'
                        : 'text-[#a0948e] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {preset.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compare Toggle */}
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-colors border ${
              showComparison
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-[#181516] border-white/[0.1] text-[#8b807a] hover:text-white'
            }`}
          >
            <span>Compare Deltas</span>
          </button>

          {/* Generate Report Button */}
          <button
            onClick={() => generateReport('DAILY')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-colors shadow-lg shadow-[#ff5708]/20"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Report</span>
          </button>

          {/* Refresh Data */}
          <button
            onClick={refresh}
            disabled={loading}
            title="Recalculate Analytics"
            className="p-2 rounded-xl bg-[#181516] border border-white/[0.1] text-[#8b807a] hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#ff7a29]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Analytics Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/[0.08] scrollbar-thin">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider shrink-0 transition-all ${
                isActive
                  ? 'bg-white text-black shadow-lg'
                  : 'text-[#8b807a] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#ff5708]' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading or Error Banners */}
      {loading && !data && (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#ff5708] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8b807a]">Aggregating restaurant telemetry from database...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading business intelligence telemetry: {error}</span>
        </div>
      )}

      {/* Tab Panels */}
      {data && (
        <div>
          {activeTab === 'OVERVIEW' && (
            <AnalyticsOverview
              data={data}
              showComparison={showComparison}
              onNavigateTab={(tabId) => setActiveTab(tabId as AnalyticsTabId)}
            />
          )}

          {activeTab === 'REVENUE' && (
            <RevenueAnalytics data={data.revenue} />
          )}

          {activeTab === 'ORDERS' && (
            <OrderAnalytics data={data.orders} />
          )}

          {activeTab === 'MENU' && (
            <MenuAnalytics
              data={data.menu}
              matrixConfig={matrixConfig}
              onUpdateMatrixConfig={setMatrixConfig}
            />
          )}

          {activeTab === 'KITCHEN' && (
            <KitchenAnalytics data={data.kitchen} />
          )}

          {activeTab === 'TABLES' && (
            <TableAnalytics data={data.table} />
          )}

          {activeTab === 'SERVICE' && (
            <ServiceAnalytics data={data.service} />
          )}

          {activeTab === 'INVENTORY' && (
            <InventoryAnalyticsView
              inventory={data.inventory}
              procurement={data.procurement}
            />
          )}

          {activeTab === 'BEHAVIOR' && (
            <CustomerBehaviorAnalytics data={data.customerBehavior} />
          )}

          {activeTab === 'FORECASTING' && (
            <ForecastPanel
              data={data.forecast}
              horizon={forecastHorizon}
              method={forecastMethod}
              onUpdateHorizon={setForecastHorizon}
              onUpdateMethod={setForecastMethod}
            />
          )}
        </div>
      )}

      {/* Business Reports Modal */}
      {(activeReport || reportLoading) && (
        <BusinessReportsView
          report={activeReport}
          loading={reportLoading}
          onGenerateReport={generateReport}
          onClose={closeReport}
        />
      )}
    </div>
  );
};
