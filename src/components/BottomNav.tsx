import React from 'react';
import { Flame, Crown, Users, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { AppScreen } from '../types';

interface BottomNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onOpenCrew: () => void;
  activeOrderCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  onOpenCrew,
  activeOrderCount,
}) => {
  const navItems = [
    {
      screen: 'WELCOME' as AppScreen,
      label: 'Home',
      icon: Flame,
      onClick: () => onNavigate('WELCOME'),
    },
    {
      screen: 'MENU' as AppScreen,
      label: 'Menu',
      icon: Crown,
      onClick: () => onNavigate('MENU'),
    },
    {
      screen: 'CREW' as any,
      label: 'Crew',
      icon: Users,
      onClick: onOpenCrew,
    },
    {
      screen: 'TRACKER' as AppScreen,
      label: 'Fire Status',
      icon: Clock,
      badge: activeOrderCount > 0,
      onClick: () => onNavigate('TRACKER'),
    },
  ];

  return (
    <nav 
      role="navigation"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 w-full z-40 pb-safe bg-[#0e0e0f]/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-8px_32px_rgba(0,0,0,0.6)]"
    >
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.screen;

          return (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.9 }}
              onClick={item.onClick}
              aria-label={item.label}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#ff5708] font-bold'
                  : 'text-[#ac897e] hover:text-[#e5e2e3]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#ff5708] shadow-[0_0_8px_#ff5708] animate-ping" />
                )}
              </div>
              <span className="font-syne text-[10px] font-extrabold tracking-wider uppercase">
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-[#ff5708] shadow-[0_0_6px_#ff5708]"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
