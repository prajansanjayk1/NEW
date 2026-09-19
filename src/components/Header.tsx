import React from 'react';
import { Users, ShoppingBag, Flame, ChefHat, Bell, User, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import { AppScreen, SessionParticipant, TableSession, UserRole } from '../types';

interface HeaderProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenCrew: () => void;
  onOpenService?: () => void;
  onOpenAuthModal?: () => void;
  onOpenTablePicker?: () => void;
  isKitchenMode: boolean;
  onToggleKitchenMode: () => void;
  onSwitchToTakeaway?: () => void;
  currentParticipant?: SessionParticipant | null;
  session?: TableSession;
  userRole?: UserRole;
  pendingServiceCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  cartCount,
  onOpenCart,
  onOpenCrew,
  onOpenService,
  onOpenAuthModal,
  onOpenTablePicker,
  isKitchenMode,
  onToggleKitchenMode,
  onSwitchToTakeaway,
  currentParticipant,
  session,
  userRole = 'CUSTOMER',
  pendingServiceCount = 0,
}) => {
  const getSubtitle = () => {
    if (isKitchenMode) return 'Restaurant Operations';
    switch (currentScreen) {
      case 'WELCOME':
        return `Table ${session ? session.tableNumber : '18'} Verified`;
      case 'TRACKER':
        return 'Live Kitchen Status';
      case 'MENU':
      default:
        return 'Explore Menu';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#0e0e0f]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="max-w-md mx-auto h-16 px-4 flex items-center justify-between gap-2">
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff5708] to-[#df8600] flex items-center justify-center shadow-[0_0_12px_rgba(255,87,8,0.4)] flex-shrink-0">
            <Flame className="w-5 h-5 text-[#511500] fill-current" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-syne font-black text-lg tracking-tight text-[#e5e2e3] uppercase">
                KOW
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-[#ffb59c] font-bold uppercase tracking-wider">
                FLAGSHIP
              </span>
            </div>
            <span className="font-syne text-[10px] font-bold text-[#ff5708] tracking-wider uppercase leading-none mt-1 truncate">
              {getSubtitle()}
            </span>
          </div>
        </div>

        {/* Live Table Badge (Clickable to switch table or simulate NFC) */}
        <button
          type="button"
          onClick={onOpenTablePicker}
          title="Click to Switch Table or Simulate NFC Tap"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#201f20] hover:bg-[#282627] border border-white/[0.08] hover:border-[#ff5708]/40 transition-all shadow-sm flex-shrink-0 cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-[#ff5708] animate-pulse shadow-[0_0_8px_#ff5708]"></span>
          <span className="font-syne text-[11px] font-extrabold text-[#ffdcbd] group-hover:text-white uppercase tracking-wider">
            T-{session ? session.tableNumber : '18'} · LIVE
          </span>
          <Radio className="w-3 h-3 text-[#ff7a29] opacity-70 group-hover:opacity-100 hidden sm:inline" />
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Takeaway / Pickup Switcher */}
          {onSwitchToTakeaway && !isKitchenMode && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSwitchToTakeaway}
              title="Switch to Takeaway & Pickup Counter"
              aria-label="Switch to Takeaway & Pickup Counter"
              className="px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-syne text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer mr-0.5"
            >
              <span>🥡</span>
              <span className="hidden sm:inline">Takeaway</span>
            </motion.button>
          )}

          {/* Operations / Kitchen Mode Switcher */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleKitchenMode}
            title={isKitchenMode ? 'Return to Table View' : 'Open Staff & Operations Dashboard'}
            aria-label={isKitchenMode ? 'Return to Table View' : 'Open Staff & Operations Dashboard'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isKitchenMode
                ? 'bg-[#ff5708] text-[#511500] font-black shadow-[0_0_14px_#ff5708]'
                : 'text-[#e5beb2] hover:text-[#ff5708] hover:bg-white/5'
            }`}
          >
            <ChefHat className="w-4 h-4" />
          </motion.button>

          {/* Service Request Button */}
          {onOpenService && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onOpenService}
              aria-label="Call Staff & Service"
              title="Call Staff & Service"
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#e5beb2] hover:text-[#ff5708] hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {pendingServiceCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#ff5708] animate-ping" />
              )}
            </motion.button>
          )}

          {/* Crew Modal Trigger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenCrew}
            aria-label="Table Diners & Crew"
            title="Table Diners & Crew"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#e5beb2] hover:text-[#ff5708] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
          </motion.button>

          {/* Cart Trigger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenCart}
            aria-label="Active Table Cart"
            title="Active Table Cart"
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#e5beb2] hover:text-[#ff5708] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ff5708] text-[#511500] font-syne text-[9px] flex items-center justify-center font-black">
                {cartCount}
              </span>
            )}
          </motion.button>

          {/* Customer Profile / Supabase Auth Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenAuthModal}
            title={currentParticipant ? `${currentParticipant.displayName} (Click to manage Supabase profile)` : 'Customer Sign In'}
            aria-label="Customer Sign In & Profile"
            className="flex items-center gap-1.5 p-1 pr-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer ml-1"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff5708] to-[#df8600] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              {currentParticipant ? currentParticipant.avatarEmoji || currentParticipant.initials : '👤'}
            </div>
            <span className="text-[11px] font-bold text-white font-['Syne',sans-serif] hidden sm:inline truncate max-w-[80px]">
              {currentParticipant?.displayName?.split(' ')[0] || 'Sign In'}
            </span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};
