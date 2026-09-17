import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Flame, 
  Check, 
  RotateCw, 
  UtensilsCrossed, 
  Truck, 
  Bell, 
  Clock, 
  CheckCircle2, 
  SlidersHorizontal,
  ConciergeBell,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  ClipboardList,
  Layers,
  ArrowLeft,
  Users,
  ShieldCheck,
  QrCode,
  DollarSign,
  Activity,
  Wifi,
  Database,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, ServiceRequest, RestaurantTable, TableStatus, UserRole, MenuItem, AuditLog, BackendStatusInfo } from '../types';
import { getNextOrderStatus } from '../services/orderService';
import { ROLE_LABELS, canManageRestaurant } from '../services/authorizationService';
import { backendService } from '../services/backendService';
import { auditService } from '../services/auditService';
import { formatCurrencyMajor } from '../utils/currency';

interface OperationsDashboardProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  serviceRequests: ServiceRequest[];
  onResolveServiceRequest: (requestId: string) => void;
  onAcknowledgeServiceRequest?: (requestId: string) => void;
  tables: RestaurantTable[];
  onUpdateTableStatus?: (tableId: string, status: TableStatus) => void;
  userRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onExitToCustomer: () => void;
}

type TabType = 'KITCHEN' | 'ORDERS' | 'SERVICE' | 'TABLES' | 'MANAGER';

const TABLE_STATUS_CONFIG: Record<TableStatus, { label: string; badge: string; dot: string }> = {
  AVAILABLE: { label: 'Available', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
  OCCUPIED: { label: 'Occupied', badge: 'bg-[#ff5708]/15 text-[#ff5708] border-[#ff5708]/30', dot: 'bg-[#ff5708]' },
  ORDERING: { label: 'Ordering', badge: 'bg-[#df8600]/15 text-[#df8600] border-[#df8600]/30', dot: 'bg-[#df8600]' },
  DINING: { label: 'Feasting', badge: 'bg-[#ffb86d]/15 text-[#ffb86d] border-[#ffb86d]/30', dot: 'bg-[#ffb86d]' },
  BILL_REQUESTED: { label: 'Bill Requested', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dot: 'bg-purple-400' },
  CLEANING: { label: 'Sanitizing', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30', dot: 'bg-sky-400' },
  CLOSED: { label: 'Closed', badge: 'bg-white/10 text-[#ac897e] border-white/10', dot: 'bg-[#ac897e]' },
};

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  orders,
  onUpdateOrderStatus,
  serviceRequests,
  onResolveServiceRequest,
  onAcknowledgeServiceRequest,
  tables,
  onUpdateTableStatus,
  userRole,
  onSwitchRole,
  onExitToCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('KITCHEN');
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  
  // Phase 3 Backend & Manager State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatusInfo>(backendService.getBackendStatus());
  const [qrTokens, setQrTokens] = useState<Record<string, string>>({
    'tbl-18': 'KW-818',
    'tbl-07': 'KW-807',
    'tbl-12': 'KW-812',
    'tbl-04': 'KW-804',
    'tbl-19': 'KW-819',
    'tbl-22': 'KW-822',
  });
  const [qrSuccessMsg, setQrSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    backendService.getMenu().then(setMenuItems);
    setAuditLogs(auditService.getAuditLogs());
    setBackendStatus(backendService.getBackendStatus());
  }, []);

  const pendingRequests = serviceRequests.filter((r) => r.status !== 'COMPLETED');
  const totalShiftRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const getActionLabel = (status: OrderStatus) => {
    switch (status) {
      case 'LOCKED':
        return 'Claim & Assign Fryer';
      case 'ASSIGNED':
        return 'Drop in Fryer (375°F)';
      case 'COOKING':
        return 'Toss in Saucing Wok';
      case 'SAUCING':
        return 'Mark Ready for Expeditor';
      case 'READY':
        return 'Dispatched to Table';
      case 'DELIVERED':
        return null;
    }
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    const updated = await backendService.updateMenuItem({ id: item.id, available: !item.available });
    setMenuItems(updated);
    setAuditLogs(auditService.getAuditLogs());
  };

  const handleRegenerateQR = async (tableId: string) => {
    const res = await backendService.regenerateTableQR(tableId);
    if (res.success) {
      setQrTokens((prev) => ({ ...prev, [tableId]: res.newToken }));
      setQrSuccessMsg(`Table token updated: ${res.newToken}`);
      setAuditLogs(auditService.getAuditLogs());
      setTimeout(() => setQrSuccessMsg(null), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col w-full max-w-md mx-auto pb-32 pt-2 text-[#e5e2e3]"
    >
      {/* Top Operations Header */}
      <div className="px-4 py-3 bg-[#1c1b1c] border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ff5708] flex items-center justify-center text-[#511500] font-black shadow-md shadow-[#ff5708]/20">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-syne text-sm font-black uppercase text-[#e5e2e3] leading-none">
              Restaurant Operations
            </h2>
            <span className="font-sans text-[11px] text-[#ff5708] font-bold">
              {ROLE_LABELS[userRole]?.label || 'Staff Mode'}
            </span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onExitToCustomer}
          className="px-3.5 py-1.5 rounded-full bg-[#2a2a2b] hover:bg-[#ff5708] hover:text-[#511500] text-xs font-syne font-bold uppercase transition-colors cursor-pointer border border-white/[0.08] flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Customer View</span>
        </motion.button>
      </div>

      {/* Backend Mode & Connection Status Ribbon */}
      <div className="px-4 py-2 bg-[#171617] border-b border-white/[0.05] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#df8600]" />
          <span className="font-syne font-bold text-white uppercase text-[10px]">
            {backendStatus.mode === 'REAL_BACKEND' ? 'Supabase PostgreSQL' : 'Demo Relational Engine'}
          </span>
          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
            backendStatus.mode === 'REAL_BACKEND'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-[#ff5708]/20 text-[#ff5708] border border-[#ff5708]/30'
          }`}>
            {backendStatus.mode === 'REAL_BACKEND' ? 'LIVE BACKEND' : 'DEMO MODE'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-[#ac897e]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Realtime Live</span>
        </div>
      </div>

      {/* Shift Overview Metrics */}
      <div className="px-4 pt-3 pb-1 grid grid-cols-4 gap-2">
        <div className="p-2 bg-[#201f20] border border-white/[0.06] rounded-xl text-center">
          <span className="font-sans text-[10px] text-[#ac897e] block truncate">Orders</span>
          <span className="font-syne text-sm font-black text-white">{orders.length}</span>
        </div>
        <div className="p-2 bg-[#201f20] border border-white/[0.06] rounded-xl text-center">
          <span className="font-sans text-[10px] text-[#ac897e] block truncate">Revenue</span>
          <span className="font-syne text-sm font-black text-[#ffdcbd]">₹{totalShiftRevenue}</span>
        </div>
        <div className="p-2 bg-[#201f20] border border-white/[0.06] rounded-xl text-center">
          <span className="font-sans text-[10px] text-[#ac897e] block truncate">Service Calls</span>
          <span className={`font-syne text-sm font-black ${pendingRequests.length > 0 ? 'text-[#ff5708]' : 'text-emerald-400'}`}>
            {pendingRequests.length}
          </span>
        </div>
        <div className="p-2 bg-[#201f20] border border-white/[0.06] rounded-xl text-center">
          <span className="font-sans text-[10px] text-[#ac897e] block truncate">Tables</span>
          <span className="font-syne text-sm font-black text-[#e5e2e3]">{tables.length}</span>
        </div>
      </div>

      {/* Role Switcher Pill Bar for Quick Testing */}
      <div className="px-4 pt-2 pb-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="font-syne text-[10px] uppercase font-bold text-[#ac897e] flex-shrink-0">
          Role:
        </span>
        {(['STAFF', 'KITCHEN', 'MANAGER', 'ADMIN', 'CUSTOMER'] as UserRole[]).map((r) => (
          <button
            key={r}
            onClick={() => {
              if (r === 'CUSTOMER') {
                onSwitchRole('CUSTOMER');
                onExitToCustomer();
              } else {
                onSwitchRole(r);
              }
            }}
            className={`px-2.5 py-1 rounded-full font-syne text-[10px] font-black uppercase transition-all cursor-pointer ${
              userRole === r
                ? 'bg-[#ff5708] text-[#511500]'
                : 'bg-[#201f20] text-[#ac897e] border border-white/[0.05] hover:text-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Main Tabs Navigation */}
      <div className="px-4 pt-2 flex items-center gap-1 border-b border-white/[0.08] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'KITCHEN' as const, label: 'Kitchen', icon: Flame, badge: orders.filter(o => o.status !== 'DELIVERED').length },
          { id: 'ORDERS' as const, label: 'Orders', icon: ClipboardList, badge: orders.length },
          { id: 'SERVICE' as const, label: 'Service', icon: ConciergeBell, badge: pendingRequests.length },
          { id: 'TABLES' as const, label: 'Tables', icon: LayoutGrid },
          ...(canManageRestaurant(userRole) ? [{ id: 'MANAGER' as const, label: 'Manager', icon: ShieldCheck }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-xl font-syne text-[10px] font-extrabold uppercase flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#ff5708] text-[#511500] shadow-md shadow-[#ff5708]/20 font-black'
                  : 'bg-[#201f20] text-[#ac897e] hover:text-white border border-white/[0.05]'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className={`w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center font-black ${
                  isActive ? 'bg-[#511500] text-white' : 'bg-[#ff5708] text-[#511500]'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: KITCHEN PIT */}
      {activeTab === 'KITCHEN' && (
        <div className="space-y-4 pt-3">
          {/* Station Filters */}
          <div className="px-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['ALL', 'Fry Station 03', 'Grill & Wok', 'Bar'].map((stn) => (
              <button
                key={stn}
                onClick={() => setStationFilter(stn)}
                className={`px-3 py-1 rounded-full font-syne text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  stationFilter === stn
                    ? 'bg-[#ff5708] text-[#511500] font-black'
                    : 'bg-[#201f20] text-[#ac897e] border border-white/[0.08] hover:text-white'
                }`}
              >
                {stn}
              </button>
            ))}
          </div>

          {/* Tickets List */}
          <div className="px-4 space-y-3.5">
            {orders.map((ord) => {
              const nextStatus = getNextOrderStatus(ord.status);
              const actionLabel = getActionLabel(ord.status);

              return (
                <motion.div
                  key={ord.id}
                  layout
                  className="bg-[#201f20] border-2 border-white/[0.08] hover:border-[#ff5708]/50 rounded-2xl p-4 shadow-xl space-y-3"
                >
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5708] animate-ping" />
                      <div>
                        <h3 className="font-syne text-sm font-black text-white uppercase">
                          {ord.ticketNumber} · TABLE {ord.tableNumber}
                        </h3>
                        <span className="font-sans text-[11px] text-[#ac897e]">
                          {ord.section} · {ord.createdAt}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#ff5708]/20 border border-[#ff5708]/30 text-[#ff5708] font-syne text-[11px] font-black uppercase">
                      {ord.status}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {ord.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-[#1c1b1c] border border-white/[0.05] flex items-start justify-between"
                      >
                        <div>
                          <div className="font-syne text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-[#ff5708] text-[#511500] font-black text-[10px]">
                              {item.customization.portionSize || `${item.quantity}x`}
                            </span>
                            <span>{item.name}</span>
                          </div>
                          <div className="font-sans text-[11px] text-[#ffb86d] mt-0.5">
                            {item.customization.heatLevel} · {item.customization.styleCut}
                          </div>
                          <div className="font-sans text-[11px] text-[#ac897e]">
                            Dip: {item.customization.dip} · Ordered by: {item.addedBy}
                          </div>
                          {item.customization.extraNotes && (
                            <div className="font-sans text-[10px] text-[#ff5449] italic">
                              Note: {item.customization.extraNotes}
                            </div>
                          )}
                        </div>
                        <span className="font-syne text-xs font-bold text-[#e5e2e3]">
                          ₹{item.totalPrice}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Status Advancement Button */}
                  {nextStatus && actionLabel && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onUpdateOrderStatus(ord.id, nextStatus)}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff5708] to-[#df8600] text-[#511500] font-syne text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ff5708]/30 cursor-pointer"
                    >
                      <Flame className="w-4 h-4 fill-current" />
                      <span>{actionLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}

                  {ord.status === 'DELIVERED' && (
                    <div className="w-full py-2 rounded-xl bg-[#2a2a2b] text-[#ffb86d] font-syne text-xs font-bold uppercase text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#ffb86d]" />
                      <span>Delivered to Table · Enjoyed</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ALL ORDERS & TICKETS */}
      {activeTab === 'ORDERS' && (
        <div className="px-4 pt-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#ac897e]">
            <span>Active Shift Orders ({orders.length})</span>
            <span className="text-[#ffdcbd] font-syne font-bold">
              Total Revenue: {formatCurrencyMajor(totalShiftRevenue)}
            </span>
          </div>

          {orders.map((ord) => (
            <div
              key={ord.id}
              className="p-3.5 bg-[#201f20] border border-white/[0.08] rounded-2xl space-y-2 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-syne text-xs font-bold text-white uppercase">
                    {ord.ticketNumber} · Table {ord.tableNumber}
                  </h4>
                  <span className="font-sans text-[11px] text-[#ac897e]">
                    Placed at {ord.createdAt} · {ord.items.length} items
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-syne text-sm font-extrabold text-[#ffdcbd]">
                    {formatCurrencyMajor(ord.total)}
                  </span>
                  <div className="font-syne text-[10px] font-bold text-[#ff5708] uppercase">
                    {ord.status}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.05] text-[11px] text-[#ac897e] flex items-center justify-between">
                <span>Pitmaster: {ord.pitmaster} · {ord.station}</span>
                <span>Oil: {ord.oilTempF}°F</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: FLOOR SERVICE REQUESTS */}
      {activeTab === 'SERVICE' && (
        <div className="px-4 pt-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#ac897e]">
            <span>Pending Calls ({pendingRequests.length})</span>
            <span className="font-sans text-[11px] text-[#ffb86d]">Real-time floor dispatch</span>
          </div>

          {serviceRequests.length === 0 ? (
            <div className="py-12 text-center text-[#ac897e] space-y-2">
              <ConciergeBell className="w-8 h-8 mx-auto opacity-50" />
              <p className="font-syne text-sm font-bold text-white">No Active Service Calls</p>
              <p className="font-sans text-xs">All table requests are currently satisfied.</p>
            </div>
          ) : (
            serviceRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 bg-[#201f20] border border-white/[0.08] rounded-2xl flex items-center justify-between gap-3 shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-syne text-xs font-bold text-white uppercase">
                      Table {req.tableNumber}
                    </span>
                    <span className="px-2 py-0.2 rounded bg-white/10 text-[#ffdcbd] font-syne text-[9px] font-bold uppercase">
                      {req.type}
                    </span>
                  </div>
                  <h4 className="font-sans text-xs font-semibold text-[#e5beb2] mt-0.5 truncate">
                    {req.title}
                  </h4>
                  <p className="font-sans text-[11px] text-[#ac897e] truncate">
                    {req.description} ({req.requestedAt})
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {req.status !== 'COMPLETED' ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onResolveServiceRequest(req.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#df8600] hover:bg-[#ff5708] text-[#4d2b00] hover:text-[#511500] font-syne text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      ✓ Mark Done
                    </motion.button>
                  ) : (
                    <span className="text-emerald-400 font-syne text-[10px] font-bold">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: TABLE FLOOR PLAN */}
      {activeTab === 'TABLES' && (
        <div className="px-4 pt-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#ac897e]">
            <span>Dining Room Layout ({tables.length} Tables)</span>
            <span className="font-sans text-[11px] text-[#ffdcbd]">Flagship Zone A, B, C</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {tables.map((t) => {
              const cfg = TABLE_STATUS_CONFIG[t.status] || TABLE_STATUS_CONFIG.AVAILABLE;
              return (
                <div
                  key={t.id}
                  className="p-3 bg-[#201f20] border border-white/[0.08] rounded-2xl space-y-2 hover:border-white/20 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-syne text-sm font-black text-white uppercase">
                      Table {t.tableNumber}
                    </h4>
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shadow-sm`} />
                  </div>

                  <div className="font-sans text-[11px] text-[#ac897e]">
                    {t.zone} · {t.capacity} Seats
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full font-syne text-[9px] font-black uppercase border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    {onUpdateTableStatus && (
                      <select
                        value={t.status}
                        onChange={(e) => onUpdateTableStatus(t.id, e.target.value as TableStatus)}
                        className="bg-[#0e0e0f] text-[10px] text-[#ac897e] rounded px-1 py-0.5 border border-white/10 focus:outline-none"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="OCCUPIED">Occupied</option>
                        <option value="ORDERING">Ordering</option>
                        <option value="DINING">Feasting</option>
                        <option value="BILL_REQUESTED">Bill Req</option>
                        <option value="CLEANING">Cleaning</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: MANAGER & SECURITY DASHBOARD (Phase 3 Exclusive) */}
      {activeTab === 'MANAGER' && (
        <div className="px-4 pt-3 space-y-4">
          {qrSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-syne font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{qrSuccessMsg}</span>
            </div>
          )}

          {/* Table QR Security Token Management */}
          <div className="p-3.5 bg-[#201f20] border border-white/[0.08] rounded-2xl space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#ff5708]" />
                <h4 className="font-syne text-xs font-black uppercase text-white">
                  Table QR & NFC Security Tokens
                </h4>
              </div>
              <span className="font-sans text-[10px] text-[#ac897e]">Signed Sessions</span>
            </div>

            <p className="font-sans text-[11px] text-[#ac897e]">
              Tokens prevent URL parameter tampering. Regenerating invalidates old QR scans instantly.
            </p>

            <div className="space-y-1.5 pt-1">
              {tables.map((t) => (
                <div key={t.id} className="p-2 rounded-xl bg-[#171617] border border-white/[0.05] flex items-center justify-between">
                  <div>
                    <span className="font-syne text-xs font-bold text-white">Table {t.tableNumber}</span>
                    <span className="font-mono text-[10px] text-[#ffb86d] ml-2">
                      {qrTokens[t.id] || `KW-${t.tableNumber}`}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRegenerateQR(t.id)}
                    className="px-2.5 py-1 rounded-lg bg-[#2a2a2b] hover:bg-[#ff5708] hover:text-[#511500] text-[10px] font-syne font-bold uppercase transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regen QR</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Catalog & 86 Item Control */}
          <div className="p-3.5 bg-[#201f20] border border-white/[0.08] rounded-2xl space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#df8600]" />
                <h4 className="font-syne text-xs font-black uppercase text-white">
                  Live Menu Catalog & 86 Controls
                </h4>
              </div>
              <span className="font-sans text-[10px] text-[#ffdcbd]">{menuItems.length} Items</span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
              {menuItems.map((item) => (
                <div key={item.id} className="p-2 rounded-xl bg-[#171617] border border-white/[0.05] flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-syne text-xs font-bold text-white truncate">
                      {item.name}
                    </div>
                    <div className="font-sans text-[10px] text-[#ac897e]">
                      {formatCurrencyMajor(item.price)} · {item.category}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleItemAvailability(item)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-syne font-black uppercase transition-colors cursor-pointer ${
                      item.available
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#ff5449]/20 text-[#ff5449] border border-[#ff5449]/30'
                    }`}
                  >
                    {item.available ? 'In Stock' : "86'd (Sold Out)"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Live System Audit Trail */}
          <div className="p-3.5 bg-[#201f20] border border-white/[0.08] rounded-2xl space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <h4 className="font-syne text-xs font-black uppercase text-white">
                  Live System Audit Trail
                </h4>
              </div>
              <span className="font-sans text-[10px] text-[#ac897e]">Real-time Log</span>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar font-mono text-[10px]">
              {auditLogs.length === 0 ? (
                <div className="text-[#ac897e] py-4 text-center">No audit events recorded yet.</div>
              ) : (
                auditLogs.slice(0, 15).map((log) => (
                  <div key={log.id} className="p-1.5 rounded bg-[#171617] border border-white/[0.03] flex items-center justify-between">
                    <div>
                      <span className="text-[#ffb86d] font-bold">{log.action}</span>
                      <span className="text-[#ac897e] ml-1.5">by {log.actorRole} ({log.actorId})</span>
                    </div>
                    <span className="text-[#ac897e] text-[9px]">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
