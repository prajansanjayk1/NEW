import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, ChevronDown, Check, Plus, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { RestaurantMembership } from '../../types';

interface RestaurantSwitcherProps {
  onOpenOnboarding?: () => void;
  onOpenPlatformAdmin?: () => void;
}

export const RestaurantSwitcher: React.FC<RestaurantSwitcherProps> = ({
  onOpenOnboarding,
  onOpenPlatformAdmin,
}) => {
  const {
    restaurant,
    activeRestaurantId,
    memberships,
    isPlatformAdmin,
    userRole,
    switchRestaurant,
  } = useStaffAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRestaurant = async (targetId: string) => {
    if (targetId === activeRestaurantId) {
      setIsOpen(false);
      return;
    }
    setIsSwitching(true);
    try {
      await switchRestaurant(targetId);
      setIsOpen(false);
    } finally {
      setIsSwitching(false);
    }
  };

  const statusColors = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    SETUP: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
    ARCHIVED: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#1d1a1b] hover:bg-[#252223] border border-white/[0.1] text-left transition-all group max-w-[260px] sm:max-w-xs focus:outline-none focus:ring-1 focus:ring-[#ff5708]"
        title="Switch active operational restaurant"
      >
        <div className="w-7 h-7 rounded-lg bg-[#ff5708]/15 border border-[#ff5708]/30 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-3.5 h-3.5 text-[#ff5708]" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white truncate font-['Syne',sans-serif]">
              {restaurant?.name || 'Select Restaurant'}
            </span>
            {restaurant?.status && (
              <span
                className={`text-[8px] font-black uppercase px-1 py-0.2 rounded border ${
                  statusColors[restaurant.status] || statusColors.ACTIVE
                }`}
              >
                {restaurant.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#8e817b] truncate">
            <MapPin className="w-2.5 h-2.5 text-[#ff5708]" />
            <span>{restaurant?.city || 'Chennai'} · Multi-Tenant Node</span>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#8e817b] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 rounded-2xl bg-[#181516] border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-50 overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-white/[0.08] bg-[#141213]/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#938680] font-bold">
                  Authorized Locations
                </span>
                <p className="text-xs font-bold text-white">Select Operational Tenant</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-[#b5a7a1]">
                {memberships.length} Branches
              </span>
            </div>

            {/* List of Memberships */}
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              {memberships.map((m: RestaurantMembership) => {
                const isCurrent = m.restaurantId === activeRestaurantId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectRestaurant(m.restaurantId)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${
                      isCurrent
                        ? 'bg-[#ff5708]/15 border border-[#ff5708]/40 text-white'
                        : 'hover:bg-white/[0.04] text-[#cfc5bf] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                          isCurrent
                            ? 'bg-[#ff5708] text-white'
                            : 'bg-white/[0.08] text-[#938680]'
                        }`}
                      >
                        {m.restaurantName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate flex items-center gap-1.5">
                          <span>{m.restaurantName}</span>
                          <span
                            className={`text-[8px] font-black uppercase px-1 py-0.2 rounded border ${
                              statusColors[m.restaurantStatus] || statusColors.ACTIVE
                            }`}
                          >
                            {m.restaurantStatus}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8e817b] truncate flex items-center gap-1">
                          <span>{m.restaurantCity}</span>
                          <span>•</span>
                          <span className="uppercase text-[9px] font-bold text-[#ffb86d]">
                            {m.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isCurrent && <Check className="w-4 h-4 text-[#ff5708] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Actions Bar */}
            <div className="p-2 border-t border-white/[0.08] bg-[#141213]/40 space-y-1">
              {(userRole === 'MANAGER' || userRole === 'ADMIN' || isPlatformAdmin) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenOnboarding?.();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#ff5708]" />
                  <span>Onboard New Branch / Location</span>
                </button>
              )}

              {(userRole === 'ADMIN' || isPlatformAdmin) && onOpenPlatformAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenPlatformAdmin();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-purple-300 hover:bg-purple-500/10 border border-purple-500/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Platform Admin Console</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                    /platform
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
