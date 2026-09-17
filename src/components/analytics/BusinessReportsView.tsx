// ==============================================================================
// KINGS OF WINGS — COMPREHENSIVE BUSINESS REPORT COMPONENT
// Printable, Exportable Operations & Financial Audit Dossier
// ==============================================================================

import React, { useState } from 'react';
import { BusinessReportData, BusinessReportType } from '../../services/analytics/analyticsTypes';
import { FileText, Printer, Download, X, CheckCircle2, IndianRupee, Flame, Clock } from 'lucide-react';

interface BusinessReportsViewProps {
  report: BusinessReportData | null;
  loading: boolean;
  onGenerateReport: (type: BusinessReportType) => void;
  onClose: () => void;
}

export const BusinessReportsView: React.FC<BusinessReportsViewProps> = ({
  report,
  loading,
  onGenerateReport,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<BusinessReportType>('DAILY');

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!report) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `KOW_${report.reportType}_Report_${report.dateRange.start}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141213] border border-white/[0.1] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#181516]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff5708]/10 text-[#ff5708] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider">
                Restaurant Executive Business Report
              </h3>
              <p className="text-[11px] text-[#8b807a]">Official management audit dossier</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors border border-white/[0.08]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors border border-white/[0.08]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8b807a] hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Controls Bar */}
        <div className="p-3 bg-[#1a1718] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#8b807a] font-bold font-['Syne',sans-serif] uppercase">Report Period:</span>
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as BusinessReportType[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedType(t);
                  onGenerateReport(t);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider transition-colors ${
                  selectedType === t
                    ? 'bg-[#ff5708] text-white'
                    : 'bg-white/5 text-[#8b807a] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {report && (
            <div className="text-[11px] text-[#8b807a]">
              Generated: <strong className="text-white">{report.generatedAt}</strong>
            </div>
          )}
        </div>

        {/* Report Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-white text-xs print:p-0 print:bg-white print:text-black">
          {loading ? (
            <div className="py-16 text-center text-[#8b807a]">
              Generating complete operational report...
            </div>
          ) : !report ? (
            <div className="py-16 text-center text-[#8b807a]">
              Select report type above to generate audit dossier.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Header */}
              <div className="border-b border-white/[0.08] pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black font-['Syne',sans-serif] text-white">
                      {report.restaurantName}
                    </h2>
                    <div className="text-xs text-[#a0948e] mt-0.5">
                      Period: {report.periodLabel} ({report.dateRange.start} – {report.dateRange.end})
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-[#8b807a]">
                    <div>Sign-off: {report.generatedBy}</div>
                    <div className="text-emerald-400 font-mono">STATUS: AUDITED & FINALIZED</div>
                  </div>
                </div>
              </div>

              {/* Executive Summary Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8b807a] mb-2 font-['Syne',sans-serif]">
                  Executive Financial & Volume Snapshot
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#181516] border border-white/[0.06]">
                    <span className="text-[10px] text-[#8b807a] uppercase block">Gross Sales</span>
                    <span className="text-lg font-black font-mono text-white">
                      {formatCurrency(report.executiveSummary.revenue)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#181516] border border-white/[0.06]">
                    <span className="text-[10px] text-[#8b807a] uppercase block">Net Billed</span>
                    <span className="text-lg font-black font-mono text-[#ff7a29]">
                      {formatCurrency(report.executiveSummary.netSales)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#181516] border border-white/[0.06]">
                    <span className="text-[10px] text-[#8b807a] uppercase block">Total Tickets</span>
                    <span className="text-lg font-black font-mono text-white">
                      {report.executiveSummary.ordersCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#181516] border border-white/[0.06]">
                    <span className="text-[10px] text-[#8b807a] uppercase block">Food Cost Ratio</span>
                    <span className="text-lg font-black font-mono text-emerald-400">
                      {report.executiveSummary.foodCostPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Performing Items in Period */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8b807a] mb-2 font-['Syne',sans-serif]">
                  Top Revenue Contributing Menu Items
                </h4>
                <div className="divide-y divide-white/[0.06] bg-[#181516] rounded-xl border border-white/[0.06] p-3">
                  {report.topMenuItems.map((item) => (
                    <div key={item.menuItemId} className="py-2 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-white">{item.name}</span>
                        <span className="text-[#7d716c] text-[10px] block">{item.category} • {item.unitsSold} units</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white">{formatCurrency(item.revenue)}</span>
                        <span className="text-[10px] text-emerald-400 block">{100 - item.foodCostPercentage}% margin</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kitchen & Table Service Efficiency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#181516] border border-white/[0.06] space-y-2">
                  <span className="font-bold text-white text-xs block font-['Syne',sans-serif] uppercase">
                    Kitchen Operations Performance
                  </span>
                  <div className="space-y-1 text-[#a0948e] text-xs">
                    <div>Average Preparation Duration: <strong className="text-white font-mono">{report.kitchenSection.averagePrepTimeMinutes} min</strong></div>
                    <div>Completed Ticket Volume: <strong className="text-white font-mono">{report.kitchenSection.totalTicketsCompleted} tickets</strong></div>
                    <div>Delayed Tickets Exceeding SLA: <strong className="text-amber-400 font-mono">{report.kitchenSection.delayedTicketsCount}</strong></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#181516] border border-white/[0.06] space-y-2">
                  <span className="font-bold text-white text-xs block font-['Syne',sans-serif] uppercase">
                    Dining Room Utilization
                  </span>
                  <div className="space-y-1 text-[#a0948e] text-xs">
                    <div>Average Table Utilization: <strong className="text-white font-mono">{report.tableSection.averageTableUtilizationPct}%</strong></div>
                    <div>Average Dining Duration: <strong className="text-white font-mono">{report.tableSection.averageSessionDurationMinutes} min</strong></div>
                    <div>Table Turnover Rate: <strong className="text-white font-mono">{report.tableSection.averageTurnoverRate} turns/day</strong></div>
                  </div>
                </div>
              </div>

              {/* Management Observations & Forecast Notes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8b807a] mb-2 font-['Syne',sans-serif]">
                  Operations Management Audit Takeaways
                </h4>
                <div className="space-y-2">
                  {report.aiObservations.map((obs, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-[#a0948e]">{obs}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
