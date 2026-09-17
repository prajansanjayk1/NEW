// ==============================================================================
// KINGS OF WINGS — USE ANALYTICS HOOK
// High-performance state coordinator for restaurant business intelligence,
// customizable period filters, threshold adjustments, and forecasting.
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  CompleteAnalyticsPayload,
  AnalyticsDateRangePreset,
  MenuMatrixConfig,
  ForecastHorizon,
  ForecastingMethod,
  BusinessReportData,
  BusinessReportType,
} from '../services/analytics/analyticsTypes';
import { analyticsService } from '../services/analytics/analyticsService';

export function useAnalytics() {
  const [data, setData] = useState<CompleteAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Parameters
  const [dateRangePreset, setDateRangePreset] = useState<AnalyticsDateRangePreset>('TODAY');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>(undefined);
  const [showComparison, setShowComparison] = useState<boolean>(true);
  const [matrixConfig, setMatrixConfig] = useState<MenuMatrixConfig>({
    demandMedianThreshold: 20,
    marginPercentageThreshold: 70,
  });
  const [forecastHorizon, setForecastHorizon] = useState<ForecastHorizon>('NEXT_7_DAYS');
  const [forecastMethod, setForecastMethod] = useState<ForecastingMethod>('7_DAY_WEIGHTED_MOVING_AVG');

  // Business Report State
  const [activeReport, setActiveReport] = useState<BusinessReportData | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await analyticsService.getCompleteAnalytics(
        dateRangePreset,
        customRange,
        matrixConfig,
        forecastHorizon,
        forecastMethod
      );
      setData(payload);
    } catch (err: any) {
      console.error('[useAnalytics] Error computing analytics:', err);
      setError(err?.message || 'Failed to calculate analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRangePreset, customRange, matrixConfig, forecastHorizon, forecastMethod]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const generateReport = async (type: BusinessReportType = 'DAILY') => {
    try {
      setReportLoading(true);
      const report = await analyticsService.generateBusinessReport(type, dateRangePreset);
      setActiveReport(report);
    } catch (err) {
      console.error('[useAnalytics] Report generation failed:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const closeReport = () => setActiveReport(null);

  return {
    data,
    loading,
    error,
    refresh: fetchAnalytics,
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
  };
}
