import React, { useState } from 'react';
import { 
  Layers, 
  Users, 
  Clock, 
  Check, 
  QrCode, 
  RefreshCw, 
  DollarSign, 
  Sparkles, 
  AlertCircle, 
  X,
  ArrowRight,
  Receipt,
  RotateCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RestaurantTable, TableStatus, Order, ServiceRequest, UserRole } from '../../types';
import { formatCurrencyMajor } from '../../utils/currency';
import { backendService } from '../../services/backendService';

interface StaffTablesViewProps {
  tables: RestaurantTable[];
  orders: Order[];
  serviceRequests: ServiceRequest[];
  onUpdateTableStatus: (tableId: string, status: TableStatus) => void;
  userRole: UserRole;
}

const TABLE_STATUS_CONFIG: Record<TableStatus, { label: string; badge: string; dot: string }> = {
  AVAILABLE: { label: 'Available', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  OCCUPIED: { label: 'Occupied', badge: 'bg-[#ff5708]/15 text-[#ff5708] border-[#ff5708]/30', dot: 'bg-[#ff5708]' },
  ORDERING: { label: 'Ordering', badge: 'bg-[#df8600]/15 text-[#df8600] border-[#df8600]/30', dot: 'bg-[#df8600]' },
  DINING: { label: 'Feasting', badge: 'bg-[#ffb86d]/15 text-[#ffb86d] border-[#ffb86d]/30', dot: 'bg-[#ffb86d]' },
  BILL_REQUESTED: { label: 'Bill Requested', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dot: 'bg-purple-400' },
  CLEANING: { label: 'Sanitizing', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30', dot: 'bg-sky-400' },
  CLOSED: { label: 'Closed', badge: 'bg-white/10 text-[#ac897e] border-white/10', dot: 'bg-[#ac897e]' },
};

const ALL_STATUSES: TableStatus[] = [
  'AVAILABLE',
  'OCCUPIED',
  'ORDERING',
  'DINING',
  'BILL_REQUESTED',
  'CLEANING',
  'CLOSED',
];

export const StaffTablesView: React.FC<StaffTablesViewProps> = ({
  tables,
  orders,
  serviceRequests,
  onUpdateTableStatus,
  userRole,
}) => {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [qrModalTable, setQrModalTable] = useState<RestaurantTable | null>(null);
  const [qrToken, setQrToken] = useState<string>('KW-818');
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);
  const [qrFeedback, setQrFeedback] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');

  const zones = ['ALL', ...Array.from(new Set(tables.map((t) => t.zone)))];

  const filteredTables = tables.filter((t) => {
    if (zoneFilter === 'ALL') return true;
    return t.zone === zoneFilter;
  });

  const handleRegenerateQR = async (tableId: string) => {
    setIsRegeneratingQR(true);
    setQrFeedback(null);
    try {
      const res = await backendService.regenerateTableQR(tableId);
      if (res.success) {
        setQrToken(res.newToken);
        setQrFeedback(`New secure QR Token generated: ${res.newToken}`);
      }
    } catch {
      setQrFeedback('Failed to regenerate QR.');
    } finally {
      setIsRegeneratingQR(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Floor Zone Filters & Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <h2 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider">
            Floor & Table Management
          </h2>
          <p className="text-xs text-[#8f827d]">
            {tables.length} Total Tables • {tables.filter((t) => t.status !== 'AVAILABLE' && t.status !== 'CLOSED').length} Occupied
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-[#706560] uppercase mr-1">Zone:</span>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setZoneFilter(zone)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                zoneFilter === zone
                  ? 'bg-[#ff5708] text-white'
                  : 'bg-[#181516] hover:bg-[#221f20] text-[#a0948e] border border-white/[0.06]'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const cfg = TABLE_STATUS_CONFIG[table.status] || TABLE_STATUS_CONFIG.AVAILABLE;
          const matchingOrder = orders.find((o) => o.tableNumber === table.tableNumber);
          const tableRequests = serviceRequests.filter((r) => r.tableNumber === table.tableNumber && r.status !== 'COMPLETED');

          return (
            <div
              key={table.id}
              className="bg-[#181516] border border-white/[0.08] hover:border-white/20 rounded-2xl p-4 flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white font-['Syne',sans-serif]">
                        Table {table.tableNumber}
                      </span>
                      <span className="text-[10px] text-[#857a74] px-1.5 py-0.5 rounded bg-white/5 font-mono">
                        {table.zone}
                      </span>
                    </div>
                    <span className="text-xs text-[#8f827d]">
                      Capacity: {table.capacity} Guests
                    </span>
                  </div>

                  <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                </div>

                {/* Status Badge & Alerts */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
                    {cfg.label}
                  </span>

                  {tableRequests.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ff5708] text-white animate-pulse">
                      {tableRequests.length} Service Call
                    </span>
                  )}
                </div>

                {/* Financials / Guest Snapshot */}
                {matchingOrder ? (
                  <div className="p-2.5 rounded-xl bg-[#201d1e] border border-white/[0.04] mb-3 text-xs">
                    <div className="flex items-center justify-between text-[#a0948e] mb-1">
                      <span>Active Ticket</span>
                      <span className="font-mono text-white font-bold">{matchingOrder.ticketNumber}</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>Order Value</span>
                      <span className="font-mono text-[#ff7a29]">{formatCurrencyMajor(matchingOrder.total)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 text-center text-xs text-[#6e625c] mb-2">
                    No active ticket placed
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTable(table)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors font-['Syne',sans-serif]"
                >
                  Manage
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQrModalTable(table);
                    setQrToken(`KW-${table.tableNumber}-${Math.floor(100 + Math.random() * 900)}`);
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0948e] hover:text-white transition-colors"
                  title="View / Regenerate Table QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Detail & Status Transition Modal */}
      <AnimatePresence>
        {selectedTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#161415] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="font-['Syne',sans-serif] text-lg font-black text-white">
                    Table {selectedTable.tableNumber} Management
                  </h3>
                  <span className="text-xs text-[#8f827d]">
                    Zone: {selectedTable.zone} • Max Capacity: {selectedTable.capacity} guests
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0948e] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Selector */}
              <div className="py-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-2 font-['Syne',sans-serif]">
                  Update Floor Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_STATUSES.map((st) => {
                    const cfg = TABLE_STATUS_CONFIG[st];
                    const isCurrent = selectedTable.status === st;

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          onUpdateTableStatus(selectedTable.id, st);
                          selectedTable.status = st;
                        }}
                        className={`p-2.5 rounded-xl text-left border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between ${
                          isCurrent
                            ? 'bg-[#ff5708]/20 border-[#ff5708] text-[#ff7a29]'
                            : 'bg-[#1f1c1d] border-white/[0.06] text-[#a0948e] hover:bg-[#252122]'
                        }`}
                      >
                        <span>{cfg.label}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[#ff5708]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Close */}
              <div className="pt-4 border-t border-white/10 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTable(null)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Hub Modal */}
      <AnimatePresence>
        {qrModalTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#161415] border border-white/10 rounded-2xl p-6 text-center shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <h3 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white">
                  Table {qrModalTable.tableNumber} QR Code
                </h3>
                <button
                  onClick={() => {
                    setQrModalTable(null);
                    setQrFeedback(null);
                  }}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0948e]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* QR Code Graphic Frame */}
              <div className="bg-white p-4 rounded-xl inline-block shadow-lg mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    window.location.origin + `/?table=${qrModalTable.tableNumber}&token=${qrToken}`
                  )}`}
                  alt={`Table ${qrModalTable.tableNumber} QR`}
                  className="w-40 h-40 mx-auto"
                />
              </div>

              <div className="text-xs font-mono font-bold text-[#ff7a29] mb-1">
                Token: {qrToken}
              </div>
              <p className="text-[11px] text-[#7d726c] mb-4">
                Customers scan this code to unlock the shared lobby for Table {qrModalTable.tableNumber}.
              </p>

              {qrFeedback && (
                <div className="mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  {qrFeedback}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isRegeneratingQR}
                  onClick={() => handleRegenerateQR(qrModalTable.id)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingQR ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrModalTable(null);
                    setQrFeedback(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
