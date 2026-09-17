import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Check, 
  RotateCw, 
  UtensilsCrossed, 
  Truck, 
  PlusCircle, 
  ChevronRight, 
  ConciergeBell, 
  Droplets, 
  Utensils, 
  Sparkles, 
  Wine, 
  UserCheck, 
  CreditCard, 
  Receipt, 
  X,
  Bell,
  ChefHat,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, ServiceRequest } from '../types';
import { formatCurrencyMajor } from '../utils/currency';

interface LiveFireTrackerViewProps {
  order: Order;
  onAddAnotherRound: () => void;
  onRequestService: (type: string, description: string) => void;
  onOpenSplitBill: () => void;
  activeRequests: ServiceRequest[];
}

export const LiveFireTrackerView: React.FC<LiveFireTrackerViewProps> = ({
  order,
  onAddAnotherRound,
  onRequestService,
  onOpenSplitBill,
  activeRequests,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState((order?.estServeMinutes || 15) * 60 - 23);
  const [serviceToast, setServiceToast] = useState<string | null>(null);

  // Countdown timer simulation
  useEffect(() => {
    if (!order || order.status === 'DELIVERED') return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [order?.status]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleServiceClick = (title: string, description: string) => {
    if (title === 'Bill & Split') {
      onOpenSplitBill();
      return;
    }
    onRequestService(title, description);
    setServiceToast(`${title} dispatched to Table ${order.tableNumber}`);
    setTimeout(() => {
      setServiceToast(null);
    }, 4000);
  };

  // Trajectory progress step calculation based on order.status
  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'LOCKED': return 1;
      case 'ASSIGNED': return 2;
      case 'COOKING': return 3;
      case 'SAUCING': return 4;
      case 'READY': return 5;
      case 'DELIVERED': return 5;
      default: return 3;
    }
  };

  const currentStep = getStepIndex(order.status);

  // SVG stroke-dash calculations for 160x160 circle (radius 68, circumference ~427)
  const circumference = 427;
  const dashOffset = 
    currentStep === 1 ? 340 :
    currentStep === 2 ? 260 :
    currentStep === 3 ? 170 :
    currentStep === 4 ? 85 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-full max-w-md mx-auto pb-32 pt-2 text-[#e5e2e3]"
    >
      {/* Top Order Metadata Bar */}
      <div className="px-4 pt-1 pb-2">
        <div className="flex items-center justify-between bg-[#1c1b1c] px-4 py-2.5 rounded-full border border-white/[0.08] shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5708] shadow-[0_0_10px_#ff5708] animate-ping"></span>
            <span className="font-syne text-[11px] font-black uppercase tracking-wider text-[#ffdcbd]">
              {order.ticketNumber}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-syne text-[11px] font-extrabold text-[#ac897e] uppercase tracking-wider">
            <Utensils className="w-3.5 h-3.5 text-[#ff5708]" />
            <span>TABLE {order.tableNumber} · {order.section}</span>
          </div>
        </div>
      </div>

      {/* Hero Status & Ember Progress Section */}
      <div className="px-4 pt-2">
        <div className="relative overflow-hidden bg-[#1c1b1c] border border-white/[0.08] rounded-3xl p-6 shadow-xl">
          {/* Ambient Thermal Glows */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#ff5708]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#df8600]/15 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Live Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#201f20] border border-white/[0.08] mb-3 shadow-sm">
              <Flame className="w-4 h-4 text-[#ff5708] fill-current animate-bounce" />
              <span className="font-syne text-[10px] font-black uppercase text-[#ff5708] tracking-widest">
                KITCHEN PIT LIVE
              </span>
            </div>

            <h1 className="font-syne text-2xl sm:text-3xl font-black text-[#e5e2e3] uppercase tracking-tight mb-2">
              YOUR WINGS ARE <span className="text-[#ff5708]">IN THE FIRE</span>
            </h1>

            <p className="font-sans text-xs text-[#ac897e] max-w-[280px] leading-relaxed">
              Batch dropping at station 03. High-heat flash sear locked for ultimate crunch.
            </p>

            {/* Circular Scoville Progress Ring */}
            <div className="relative my-6 flex items-center justify-center">
              <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="#201f20"
                  strokeWidth="8"
                />
                {/* Active Ember Gradient Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  fill="none"
                  stroke="url(#flameGradientLive)"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="flameGradientLive" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#df8600" />
                    <stop offset="50%" stopColor="#ff5708" />
                    <stop offset="100%" stopColor="#ff5449" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Ring Inner Status Core */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span className="font-syne text-[10px] font-extrabold uppercase text-[#ac897e] tracking-wider">
                  EST. SERVE TIME
                </span>
                <span className="font-syne text-3xl font-black text-[#e5e2e3] tracking-tight my-0.5">
                  {formatTimer(secondsRemaining)}
                </span>
                <div className="flex items-center gap-1.5 text-[#ff5708]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff5708] animate-pulse"></span>
                  <span className="font-syne text-[10px] font-black tracking-widest uppercase text-[#ffb86d]">
                    {order.oilTempF}°F OIL
                  </span>
                </div>
              </div>
            </div>

            {/* Realtime Fryer Spec Pill */}
            <div className="w-full bg-[#201f20] border border-white/[0.05] rounded-2xl p-3.5 flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#2a2a2b] flex items-center justify-center text-[#ff5708] border border-white/[0.05]">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-sans text-xs font-bold text-[#e5e2e3] leading-tight">
                    {order.station}
                  </div>
                  <div className="font-sans text-[11px] text-[#ac897e]">
                    Pitmaster {order.pitmaster} presiding
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#ff5708]/20 text-[#ff5708] font-syne text-[10px] font-black tracking-wider uppercase border border-[#ff5708]/30">
                {order.status === 'COOKING' ? 'CRISPING' : order.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Visual Photo Bleed Card */}
      <div className="px-4 pt-4">
        <div className="relative w-full h-44 rounded-3xl overflow-hidden shadow-lg bg-[#0e0e0f] border border-white/[0.08]">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQKdGoC1CpBbF5LnJG9wJqVFDu1LAwALC7O5sCemhzYF-9jYe_QjIq24LQMLWA24gqNw_ADFicZof8affJA27_pcY4seDqtJFIHOVvcH9ABb4qsbzYbpX0GxQ9vmIPcF4Ej7KfGeg9p8opg3-CVkGY_V5WrzQYbJS2oX_Lj1AMmbvU87x5gk24m69bmoFognmpC51Rl5rnlGcvc_OfdH1MuyoKaEfGNw9JIf38kfes1rzAYJzB6Klv"
            alt="Batch in progress"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1c] via-[#1c1b1c]/40 to-transparent"></div>
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div>
              <span className="font-syne text-[10px] font-extrabold uppercase tracking-widest text-[#ffdcbd]">
                BATCH IN PROGRESS
              </span>
              <p className="font-syne text-base font-bold text-[#e5e2e3] leading-tight drop-shadow-sm">
                Firecracker Glazed Wings
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[#ff5708] font-syne text-[10px] font-bold flex items-center gap-1 shadow-sm border border-white/[0.08]">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>SCOVILLE 85K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kitchen Trajectory Timeline */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-syne text-sm font-black uppercase tracking-tight text-[#e5e2e3]">
            Kitchen Trajectory
          </h2>
          <span className="font-syne text-[10px] font-extrabold text-[#ac897e] uppercase tracking-wider">
            STEP {currentStep} OF 5
          </span>
        </div>

        <div className="bg-[#1c1b1c] border border-white/[0.08] rounded-3xl p-4 shadow-md space-y-4">
          {/* Step 1: Locked */}
          <div className="flex items-start gap-3.5 relative">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-[#201f20] border border-white/[0.08] flex items-center justify-center text-[#ffb86d]">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="w-0.5 h-7 bg-[#201f20] mt-1"></div>
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-bold text-[#e5e2e3]">
                  Order Locked &amp; Sent
                </span>
                <span className="font-sans text-[11px] text-[#ac897e]">{order.createdAt}</span>
              </div>
              <p className="font-sans text-xs text-[#ac897e] mt-0.5">
                Digital ticket claimed by dispatch station.
              </p>
            </div>
          </div>

          {/* Step 2: Fryer Assigned */}
          <div className="flex items-start gap-3.5 relative">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-[#201f20] border border-white/[0.08] flex items-center justify-center text-[#ffb86d]">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="w-0.5 h-7 bg-[#201f20] mt-1"></div>
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-bold text-[#e5e2e3]">
                  Fryer Assigned
                </span>
                <span className="font-sans text-[11px] text-[#ac897e]">Claimed</span>
              </div>
              <p className="font-sans text-xs text-[#ac897e] mt-0.5">
                Chef {order.pitmaster} claimed ticket on {order.station}.
              </p>
            </div>
          </div>

          {/* Step 3: ACTIVE Cooking */}
          <div className={`flex items-start gap-3.5 relative ${currentStep >= 3 ? '' : 'opacity-40'}`}>
            <div className="flex flex-col items-center">
              <div className="relative w-7 h-7 rounded-full bg-[#ff5708] flex items-center justify-center text-[#511500] shadow-[0_0_12px_#ff5708]">
                {currentStep === 3 ? (
                  <RotateCw className="w-4 h-4 animate-spin stroke-[2.5]" style={{ animationDuration: '3s' }} />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
              </div>
              <div className="w-0.5 h-8 bg-[#201f20] mt-1"></div>
            </div>
            <div className="flex-1 bg-[#201f20] p-3 rounded-2xl border border-[#ff5708]/30">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-bold text-[#ff5708] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ff5708] animate-ping"></span>
                  Wings Cooking in Fryer
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#ff5708] text-[#511500] font-syne text-[9px] uppercase font-black">
                  {currentStep === 3 ? 'ACTIVE' : 'DONE'}
                </span>
              </div>
              <p className="font-sans text-xs text-[#e5e2e3] mt-1">
                Crisping to golden blistered perfection at constant {order.oilTempF}°F.
              </p>
            </div>
          </div>

          {/* Step 4: Finishing */}
          <div className={`flex items-start gap-3.5 relative ${currentStep >= 4 ? '' : 'opacity-60'}`}>
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                currentStep >= 4 ? 'bg-[#ff5708] text-[#511500]' : 'bg-[#201f20] text-[#ac897e] border border-white/[0.08]'
              }`}>
                {currentStep > 4 ? <Check className="w-4 h-4 stroke-[3]" /> : <UtensilsCrossed className="w-3.5 h-3.5" />}
              </div>
              <div className="w-0.5 h-7 bg-[#201f20] mt-1"></div>
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-bold text-[#e5e2e3]">
                  Saucing &amp; Garnish Finish
                </span>
                <span className="font-sans text-[11px] text-[#ac897e]">~3 min</span>
              </div>
              <p className="font-sans text-xs text-[#ac897e] mt-0.5">
                Wok-tossed in smoked chili glaze &amp; charred sesame.
              </p>
            </div>
          </div>

          {/* Step 5: Table Delivery */}
          <div className={`flex items-start gap-3.5 relative ${currentStep >= 5 ? '' : 'opacity-40'}`}>
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                currentStep >= 5 ? 'bg-[#ffb86d] text-[#492900]' : 'bg-[#201f20] text-[#ac897e] border border-white/[0.08]'
              }`}>
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="font-sans text-xs font-bold text-[#e5e2e3]">
                  Delivery to Table {order.tableNumber}
                </span>
                <span className="font-sans text-[11px] text-[#ac897e]">Direct</span>
              </div>
              <p className="font-sans text-xs text-[#ac897e] mt-0.5">
                Hot runner heading to your booth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mid Action CTA: Keep Round Going */}
      <div className="px-4 pt-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddAnotherRound}
          className="w-full bg-[#1c1b1c] hover:bg-[#201f20] border border-white/[0.08] transition-colors p-4 rounded-3xl flex items-center justify-between shadow-md group cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-[#ff5708]/20 text-[#ff5708] flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="font-syne text-xs font-bold text-[#e5e2e3] uppercase">
                + Add Another Round to Table {order.tableNumber}
              </div>
              <div className="font-sans text-xs text-[#ac897e]">
                Wings, craft draughts, or cold sides
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#ac897e] group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      {/* Instant Table Assistance Trigger Grid */}
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <ConciergeBell className="w-4 h-4 text-[#df8600]" />
            <h2 className="font-syne text-sm font-black uppercase tracking-tight text-[#e5e2e3]">
              Instant Table Call
            </h2>
          </div>
          <span className="font-syne text-[10px] font-black text-[#ff5708] uppercase tracking-wider">
            1-TAP REQUEST
          </span>
        </div>

        {/* Toast Alert Feedback */}
        <AnimatePresence>
          {serviceToast && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 rounded-2xl bg-[#ff5708] text-[#511500] font-sans text-xs font-bold flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 fill-current" />
                <span>{serviceToast}</span>
              </div>
              <button onClick={() => setServiceToast(null)} className="text-[#511500] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-2">
          {/* Water */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleServiceClick('Water Carafe', 'Ice Cold Water Carafe dispatched')}
            className="flex items-center gap-3 p-3 bg-[#1c1b1c] hover:bg-[#201f20] border border-white/[0.08] rounded-2xl transition text-left shadow-sm cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#201f20] flex items-center justify-center text-[#ffb86d]">
              <Droplets className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-syne text-xs font-bold text-[#e5e2e3] truncate">Water Carafe</div>
              <div className="font-sans text-[11px] text-[#ac897e]">Chilled ice jug</div>
            </div>
          </motion.button>

          {/* Fresh Cutlery */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleServiceClick('Fresh Cutlery', 'Extra Bone Plates & Cutlery on the way')}
            className="flex items-center gap-3 p-3 bg-[#1c1b1c] hover:bg-[#201f20] border border-white/[0.08] rounded-2xl transition text-left shadow-sm cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#201f20] flex items-center justify-center text-[#ffb86d]">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-syne text-xs font-bold text-[#e5e2e3] truncate">Fresh Cutlery</div>
              <div className="font-sans text-[11px] text-[#ac897e]">Forks &amp; bone dish</div>
            </div>
          </motion.button>

          {/* Wet Napkins */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleServiceClick('Wet Napkins', 'Ember Wet Napkin Towels dispatched')}
            className="flex items-center gap-3 p-3 bg-[#1c1b1c] hover:bg-[#201f20] border border-white/[0.08] rounded-2xl transition text-left shadow-sm cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#201f20] flex items-center justify-center text-[#ffb86d]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-syne text-xs font-bold text-[#e5e2e3] truncate">Wet Napkins</div>
              <div className="font-sans text-[11px] text-[#ac897e]">Lemon scented</div>
            </div>
          </motion.button>

          {/* Extra Dip */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleServiceClick('Extra Sauce / Dip', 'House Smoked Ranch & Blue Dip coming up')}
            className="flex items-center gap-3 p-3 bg-[#1c1b1c] hover:bg-[#201f20] border border-white/[0.08] rounded-2xl transition text-left shadow-sm cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#201f20] flex items-center justify-center text-[#ff5708]">
              <Wine className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-syne text-xs font-bold text-[#e5e2e3] truncate">Extra Sauce / Dip</div>
              <div className="font-sans text-[11px] text-[#ac897e]">Ranch, Blue, Fire</div>
            </div>
          </motion.button>

          {/* Call Server */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleServiceClick('Call Server', 'Head floor runner notified for Table 18')}
            className="flex items-center gap-3 p-3 bg-[#1c1b1c] hover:bg-[#201f20] border border-white/[0.08] rounded-2xl transition text-left shadow-sm cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#201f20] flex items-center justify-center text-[#ffdbcf]">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-syne text-xs font-bold text-[#e5e2e3] truncate">Call Server</div>
              <div className="font-sans text-[11px] text-[#ac897e]">Marco or Elena</div>
            </div>
          </motion.button>

          {/* Bill & Split */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleServiceClick('Bill & Split', 'Bill & Split Terminal requested')}
            className="flex items-center gap-3 p-3 bg-[#1c1b1c] hover:bg-[#201f20] border border-white/[0.08] rounded-2xl transition text-left shadow-sm cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#201f20] flex items-center justify-center text-[#ffb86d]">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-syne text-xs font-bold text-[#e5e2e3] truncate">Bill &amp; Split</div>
              <div className="font-sans text-[11px] text-[#ac897e]">Pay via crew tap</div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Current Batch Summary Ticket */}
      <div className="px-4 pt-6">
        <div className="bg-[#1c1b1c] border border-white/[0.08] rounded-3xl p-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#ff5708]" />
              <h3 className="font-syne text-xs font-black uppercase text-[#e5e2e3]">
                Current Round Items
              </h3>
            </div>
            <span className="font-syne text-[11px] font-extrabold text-[#ac897e] uppercase">
              {order.items.length} Items · {formatCurrencyMajor(order.total)}
            </span>
          </div>

          <div className="space-y-3 pt-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#ff5708]/20 text-[#ff5708] font-syne text-[10px] flex items-center justify-center font-black mt-0.5">
                    {item.customization.portionSize ? item.customization.portionSize.split(' ')[0] : `${item.quantity}x`}
                  </span>
                  <div>
                    <div className="font-syne text-xs font-bold text-[#e5e2e3] uppercase">
                      {item.name || (item as any)?.menuItem?.name || 'Item'}
                    </div>
                    <div className="font-sans text-[11px] text-[#ac897e]">
                      {item.customization.heatLevel} · {item.customization.extraNotes || item.customization.dip}
                    </div>
                  </div>
                </div>
                <span className="font-syne text-xs font-bold text-[#ffdcbd]">
                  {formatCurrencyMajor(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          {/* Crew Shared Pill */}
          <div className="mt-4 pt-3 bg-[#201f20] border border-white/[0.05] rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#ffb59c] flex items-center justify-center text-[10px] font-bold text-[#5c1900] font-syne">
                  JD
                </div>
                <div className="w-6 h-6 rounded-full bg-[#ffb86d] flex items-center justify-center text-[10px] font-bold text-[#492900] font-syne">
                  AM
                </div>
                <div className="w-6 h-6 rounded-full bg-[#ff5449] flex items-center justify-center text-[10px] font-bold text-white font-syne">
                  RK
                </div>
              </div>
              <span className="font-sans text-xs text-[#ac897e]">
                Shared with {order.sharedCrewCount} Crew at Table
              </span>
            </div>
            <span className="font-syne text-[11px] font-black text-[#ffb86d] uppercase">
              {formatCurrencyMajor(Math.round(order.total / order.sharedCrewCount))} / person
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
