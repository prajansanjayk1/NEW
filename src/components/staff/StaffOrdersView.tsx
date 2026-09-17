import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  Check, 
  ChefHat, 
  Flame, 
  X, 
  User, 
  Utensils, 
  ArrowRight,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, UserRole } from '../../types';
import { formatCurrencyMajor } from '../../utils/currency';
import { isValidOrderTransition } from '../../services/backendService';

interface StaffOrdersViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
  userRole: UserRole;
  selectedOrder?: Order | null;
  onSelectOrder?: (order: Order | null) => void;
}

const ORDER_STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'New', value: 'LOCKED' },
  { label: 'Assigned', value: 'ASSIGNED' },
  { label: 'Cooking', value: 'COOKING' },
  { label: 'Saucing', value: 'SAUCING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Delivered', value: 'DELIVERED' },
];

const STATUS_BADGES: Record<OrderStatus, { label: string; color: string; border: string }> = {
  LOCKED: { label: 'New / Locked', color: 'bg-red-500/15 text-red-400', border: 'border-red-500/30' },
  ASSIGNED: { label: 'Assigned', color: 'bg-amber-500/15 text-amber-400', border: 'border-amber-500/30' },
  COOKING: { label: 'Cooking', color: 'bg-[#ff5708]/15 text-[#ff5708]', border: 'border-[#ff5708]/30' },
  SAUCING: { label: 'Saucing', color: 'bg-orange-500/15 text-orange-400', border: 'border-orange-500/30' },
  READY: { label: 'Ready for Expo', color: 'bg-emerald-500/15 text-emerald-400', border: 'border-emerald-500/30' },
  DELIVERED: { label: 'Delivered', color: 'bg-white/10 text-[#a0958f]', border: 'border-white/10' },
};

export const StaffOrdersView: React.FC<StaffOrdersViewProps> = ({
  orders,
  onUpdateOrderStatus,
  userRole,
  selectedOrder: externalSelectedOrder,
  onSelectOrder: externalOnSelectOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [internalSelectedOrder, setInternalSelectedOrder] = useState<Order | null>(null);

  const activeSelectedOrder = externalSelectedOrder !== undefined ? externalSelectedOrder : internalSelectedOrder;
  const handleSelectOrder = (ord: Order | null) => {
    if (externalOnSelectOrder) {
      externalOnSelectOrder(ord);
    } else {
      setInternalSelectedOrder(ord);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesTicket = o.ticketNumber.toLowerCase().includes(query);
    const matchesTable = o.tableNumber.toLowerCase().includes(query);
    const matchesCustomer = o.placedByParticipantName?.toLowerCase().includes(query) || false;
    const matchesItem = o.items.some((item) => (item.name || (item as any).menuItem?.name || '').toLowerCase().includes(query));

    return matchesStatus && (matchesTicket || matchesTable || matchesCustomer || matchesItem);
  });

  const getNextStatusAction = (currentStatus: OrderStatus): { nextStatus: OrderStatus; label: string } | null => {
    switch (currentStatus) {
      case 'LOCKED':
        return { nextStatus: 'ASSIGNED', label: 'Accept & Assign' };
      case 'ASSIGNED':
        return { nextStatus: 'COOKING', label: 'Start Cooking' };
      case 'COOKING':
        return { nextStatus: 'SAUCING', label: 'Toss & Sauce' };
      case 'SAUCING':
        return { nextStatus: 'READY', label: 'Mark Ready for Expeditor' };
      case 'READY':
        return { nextStatus: 'DELIVERED', label: 'Confirm Delivered to Table' };
      case 'DELIVERED':
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#736862] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, Table #, Guest, or Item..."
            className="w-full bg-[#181516] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#6d625d] focus:outline-none focus:border-[#ff5708]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#736862] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {ORDER_STATUS_TABS.map((tab) => {
            const isActive = selectedStatus === tab.value;
            const count = tab.value === 'ALL' 
              ? orders.length 
              : orders.filter((o) => o.status === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#ff5708] text-white'
                    : 'bg-[#181516] hover:bg-[#221f20] text-[#a0948e] border border-white/[0.06]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-[#857974]'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Grid / Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-12 text-center">
          <AlertCircle className="w-10 h-10 text-[#6d625d] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Syne',sans-serif]">
            No Orders Found
          </h3>
          <p className="text-xs text-[#8f827d] mt-1">
            No active or historical orders match the specified search query or filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const statusCfg = STATUS_BADGES[order.status] || STATUS_BADGES.LOCKED;
            const nextAction = getNextStatusAction(order.status);
            const isSelected = activeSelectedOrder?.id === order.id;

            return (
              <div
                key={order.id}
                onClick={() => handleSelectOrder(order)}
                className={`bg-[#181516] border rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between group ${
                  isSelected
                    ? 'border-[#ff5708] shadow-[0_0_24px_rgba(255,87,8,0.2)]'
                    : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-['Syne',sans-serif] font-black text-sm text-white">
                          {order.ticketNumber}
                        </span>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-white/10 text-white">
                          T-{order.tableNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#7d726c]">
                        Placed by {order.placedByParticipantName || 'Table Guest'} • {order.createdAt}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusCfg.color} ${statusCfg.border}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Items list preview */}
                  <div className="space-y-1.5 py-2 border-y border-white/[0.06] my-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-bold text-[#ff7a29] font-mono">{item.quantity}×</span>
                          <span className="text-white/90 truncate">{item.name || (item as any).menuItem?.name || 'Item'}</span>
                        </div>
                        <span className="text-[11px] font-mono text-[#8c807b]">
                          {formatCurrencyMajor(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Amount & Quick Advance */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-[10px] text-[#786c66] uppercase block font-bold">Total Bill</span>
                    <span className="text-sm font-black text-white font-['Syne',sans-serif]">
                      {formatCurrencyMajor(order.total)}
                    </span>
                  </div>

                  {nextAction && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateOrderStatus(order.id, nextAction.nextStatus);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#ff5708] hover:bg-[#ff7a29] text-white text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 font-['Syne',sans-serif]"
                    >
                      <span>{nextAction.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Slide-Over / Modal */}
      <AnimatePresence>
        {activeSelectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg h-full bg-[#161415] border-l border-white/10 p-6 overflow-y-auto flex flex-col justify-between shadow-2xl"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-['Syne',sans-serif] text-xl font-black text-white">
                        {activeSelectedOrder.ticketNumber}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ff5708]/20 text-[#ff7a29] font-bold font-mono text-xs">
                        TABLE {activeSelectedOrder.tableNumber}
                      </span>
                    </div>
                    <p className="text-xs text-[#8c807a] mt-1">
                      Ordered at {activeSelectedOrder.createdAt} • Placed by {activeSelectedOrder.placedByParticipantName || 'Table Diner'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectOrder(null)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0948e] hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Culinary Pipeline Status Stepper */}
                <div className="py-5 border-b border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7d716b] block mb-3 font-['Syne',sans-serif]">
                    Kitchen Progress Timeline
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['LOCKED', 'ASSIGNED', 'COOKING', 'SAUCING', 'READY'] as OrderStatus[]).map((st, idx) => {
                      const stages: OrderStatus[] = ['LOCKED', 'ASSIGNED', 'COOKING', 'SAUCING', 'READY', 'DELIVERED'];
                      const currentIdx = stages.indexOf(activeSelectedOrder.status);
                      const stepIdx = stages.indexOf(st);
                      const isComplete = stepIdx <= currentIdx;

                      return (
                        <div key={st} className="text-center">
                          <div className={`h-1.5 rounded-full mb-1.5 transition-colors ${
                            isComplete ? 'bg-[#ff5708]' : 'bg-white/10'
                          }`} />
                          <span className={`text-[9px] font-black uppercase tracking-wider block ${
                            isComplete ? 'text-white' : 'text-[#615752]'
                          }`}>
                            {st}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items Detail */}
                <div className="py-4 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#a0948e] font-['Syne',sans-serif]">
                    Ordered Items & Customizations
                  </span>

                  <div className="space-y-2.5">
                    {activeSelectedOrder.items.map((item, idx) => {
                      const itemName = item.name || (item as any).menuItem?.name || 'Item';
                      const cust = item.customization as any;

                      return (
                        <div key={idx} className="p-3 rounded-xl bg-[#1d1a1b] border border-white/[0.06]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#ff7a29]">{item.quantity}×</span>
                              <span className="font-bold text-white text-xs">{itemName}</span>
                            </div>
                            <span className="font-mono text-xs font-bold text-white">
                              {formatCurrencyMajor(item.totalPrice)}
                            </span>
                          </div>

                          {/* Modifiers */}
                          {cust && (
                            <div className="mt-2 pl-4 border-l-2 border-[#ff5708]/40 text-[11px] text-[#938781] space-y-0.5">
                              {(cust.portionSize || cust.portion) && (
                                <div>Portion: {cust.portionSize || cust.portion?.name || cust.portion}</div>
                              )}
                              {(cust.styleCut || cust.style) && (
                                <div>Cut Style: {cust.styleCut || cust.style?.name || cust.style}</div>
                              )}
                              {(cust.heatLevel || cust.sauce) && (
                                <div>Heat / Sauce: {cust.heatLevel || cust.sauce?.name || cust.sauce}</div>
                              )}
                              {cust.dip && (
                                <div>Dip: {typeof cust.dip === 'string' ? cust.dip : cust.dip?.name}</div>
                              )}
                              {cust.extraNotes && (
                                <div className="text-[#ff5449] italic">Note: {cust.extraNotes}</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="p-4 rounded-xl bg-[#1a1718] border border-white/10 space-y-1.5 text-xs text-[#a0948e]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-white">{formatCurrencyMajor(activeSelectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span className="font-mono text-white">{formatCurrencyMajor(activeSelectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 font-black text-sm text-white">
                    <span>Total Bill</span>
                    <span className="font-mono text-[#ff7a29]">{formatCurrencyMajor(activeSelectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-white/10 mt-6 flex gap-2">
                {getNextStatusAction(activeSelectedOrder.status) && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = getNextStatusAction(activeSelectedOrder.status);
                      if (next) {
                        onUpdateOrderStatus(activeSelectedOrder.id, next.nextStatus);
                        activeSelectedOrder.status = next.nextStatus;
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ff5708] to-[#ff7a29] text-white font-bold text-xs uppercase tracking-wider transition-opacity hover:opacity-95"
                  >
                    Advance to {getNextStatusAction(activeSelectedOrder.status)?.nextStatus}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSelectOrder(null)}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider"
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
