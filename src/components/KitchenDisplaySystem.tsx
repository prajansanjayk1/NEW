import React, { useState } from 'react';
import { 
  Flame, 
  ChefHat, 
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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, ServiceRequest } from '../types';
import { formatCurrencyMajor } from '../utils/currency';

interface KitchenDisplaySystemProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  serviceRequests: ServiceRequest[];
  onResolveServiceRequest: (requestId: string) => void;
  onExitKitchen: () => void;
}

export const KitchenDisplaySystem: React.FC<KitchenDisplaySystemProps> = ({
  orders,
  onUpdateOrderStatus,
  serviceRequests,
  onResolveServiceRequest,
  onExitKitchen,
}) => {
  const [stationFilter, setStationFilter] = useState<string>('ALL');

  const pendingRequests = serviceRequests.filter((r) => r.status !== 'COMPLETED');

  const getNextStatusAction = (currentStatus: OrderStatus) => {
    switch (currentStatus) {
      case 'LOCKED':
        return { label: 'Claim & Assign Fryer', next: 'ASSIGNED' as OrderStatus };
      case 'ASSIGNED':
        return { label: 'Drop in Fryer (375°F)', next: 'COOKING' as OrderStatus };
      case 'COOKING':
        return { label: 'Toss in Saucing Wok', next: 'SAUCING' as OrderStatus };
      case 'SAUCING':
        return { label: 'Mark Ready for Table', next: 'READY' as OrderStatus };
      case 'READY':
        return { label: 'Dispatched to Table 18', next: 'DELIVERED' as OrderStatus };
      case 'DELIVERED':
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col w-full max-w-md mx-auto pb-32 pt-2 text-[#e5e2e3]"
    >
      {/* KDS Header Bar */}
      <div className="px-4 py-3 bg-[#1c1b1c] border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ff5708] flex items-center justify-center text-[#511500] font-black shadow-md shadow-[#ff5708]/20">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-syne text-sm font-black uppercase text-[#e5e2e3] leading-none">
              Kitchen Pit Display
            </h2>
            <span className="font-sans text-[11px] text-[#ff5708] font-bold">
              Station 03 · Marco Presiding
            </span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onExitKitchen}
          className="px-3.5 py-1.5 rounded-full bg-[#2a2a2b] hover:bg-[#ff5708] hover:text-[#511500] text-xs font-syne font-bold uppercase transition-colors cursor-pointer border border-white/[0.08]"
        >
          Customer View →
        </motion.button>
      </div>

      {/* Floor Call Service Requests Banner (if any) */}
      <AnimatePresence>
        {pendingRequests.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-3 p-3.5 rounded-2xl bg-[#df8600]/20 border border-[#df8600]/40 shadow-lg"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#df8600]/20">
              <div className="flex items-center gap-2">
                <ConciergeBell className="w-4 h-4 text-[#df8600] animate-bounce" />
                <span className="font-syne text-xs font-black uppercase text-[#ffdcbd]">
                  Floor Service Calls ({pendingRequests.length})
                </span>
              </div>
              <span className="font-sans text-[10px] text-[#ffdcbd]">Action Required</span>
            </div>

            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-[#201f20] p-2.5 rounded-xl flex items-center justify-between border border-white/[0.05]"
                >
                  <div>
                    <div className="font-syne text-xs font-bold text-white">
                      Table {req.tableNumber} · {req.title}
                    </div>
                    <div className="font-sans text-[11px] text-[#ac897e]">
                      {req.description} ({req.requestedAt})
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => onResolveServiceRequest(req.id)}
                    className="px-3 py-1 rounded-full bg-[#df8600] text-[#4d2b00] font-syne text-[10px] font-black uppercase tracking-wider hover:bg-[#ffb86d] transition-colors cursor-pointer"
                  >
                    ✓ Complete
                  </motion.button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Station Filters */}
      <div className="px-4 pt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {['ALL', 'Fry Station 03', 'Grill & Wok', 'Bar'].map((stn) => (
          <button
            key={stn}
            onClick={() => setStationFilter(stn)}
            className={`px-3 py-1.5 rounded-full font-syne text-[11px] font-bold uppercase transition-all cursor-pointer ${
              stationFilter === stn
                ? 'bg-[#ff5708] text-[#511500] font-black shadow-sm'
                : 'bg-[#201f20] text-[#ac897e] border border-white/[0.08] hover:text-white'
            }`}
          >
            {stn}
          </button>
        ))}
      </div>

      {/* Active Orders List */}
      <div className="px-4 pt-4 space-y-4">
        {orders.map((ord) => {
          const action = getNextStatusAction(ord.status);

          return (
            <motion.div
              key={ord.id}
              layout
              className="bg-[#201f20] border-2 border-white/[0.08] hover:border-[#ff5708]/50 rounded-2xl p-4 shadow-xl space-y-3"
            >
              {/* Order Card Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5708] animate-ping" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-syne text-sm font-black text-white uppercase">
                        {ord.channel === 'TAKEAWAY' ? (
                          <span className="text-amber-400">🥡 #{ord.takeawayOrderNumber || ord.ticketNumber} · TAKEAWAY PICKUP</span>
                        ) : (
                          <span>{ord.ticketNumber} · TABLE {ord.tableNumber}</span>
                        )}
                      </h3>
                      {ord.channel === 'TAKEAWAY' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          TAKEAWAY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          DINE-IN
                        </span>
                      )}
                    </div>
                    <span className="font-sans text-[11px] text-[#ac897e]">
                      {ord.channel === 'TAKEAWAY' && ord.customerName
                        ? `Customer: ${ord.customerName} · Pickup: ${ord.pickupTime || 'ASAP'}`
                        : `${ord.section} · ${ord.createdAt}`}
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-[#ff5708]/20 border border-[#ff5708]/30 text-[#ff5708] font-syne text-[11px] font-black uppercase">
                  {ord.status}
                </div>
              </div>

              {/* Order Items List */}
              <div className="space-y-2">
                {ord.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-[#1c1b1c] border border-white/[0.05] flex items-start justify-between"
                  >
                    <div>
                      <div className="font-syne text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-[#ff5708] text-[#511500] font-black text-[10px]">
                          {typeof item.customization === 'object' && item.customization?.portionSize ? item.customization.portionSize : `${item.quantity}x`}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      <div className="font-sans text-[11px] text-[#ffb86d] mt-0.5">
                        {typeof item.customization === 'string'
                          ? item.customization
                          : [item.customization?.heatLevel, item.customization?.styleCut].filter(Boolean).join(' · ') || 'Standard Prep'}
                      </div>
                      {typeof item.customization === 'object' && item.customization?.dip && (
                        <div className="font-sans text-[11px] text-[#ac897e]">
                          Dip: {item.customization.dip}
                        </div>
                      )}
                      {typeof item.customization === 'object' && item.customization?.extraNotes && (
                        <div className="font-sans text-[10px] text-[#ff5449] italic">
                          Note: {item.customization.extraNotes}
                        </div>
                      )}
                    </div>

                    <span className="font-syne text-xs font-bold text-[#e5e2e3]">
                      {formatCurrencyMajor(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button to Progress State */}
              {action && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onUpdateOrderStatus(ord.id, action.next)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ff5708] to-[#df8600] text-[#511500] font-syne text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#ff5708]/30 transition-all cursor-pointer"
                >
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{action.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}

              {ord.status === 'DELIVERED' && (
                <div className="w-full py-2.5 rounded-xl bg-[#2a2a2b] text-[#ffb86d] font-syne text-xs font-bold uppercase text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#ffb86d]" />
                  <span>Order Fully Served &amp; Enjoyed</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
