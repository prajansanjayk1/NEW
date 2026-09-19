import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Smartphone, 
  Shield, 
  Crown, 
  Radio, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  CheckSquare, 
  Store, 
  Zap, 
  X,
  ExternalLink,
  ChefHat,
  Receipt,
  Users
} from 'lucide-react';
import { RestaurantTable } from '../types';

interface OnboardingGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona: (persona: 'customer' | 'staff' | 'admin') => void;
  onSelectTable: (tableNumber: string) => void;
  onOpenRestaurantWizard: () => void;
  onOpenChecklist: () => void;
  tables: RestaurantTable[];
  currentTableNumber: string;
}

export const OnboardingGatewayModal: React.FC<OnboardingGatewayModalProps> = ({
  isOpen,
  onClose,
  onSelectPersona,
  onSelectTable,
  onOpenRestaurantWizard,
  onOpenChecklist,
  tables,
  currentTableNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'PERSONAS' | 'TABLES' | 'CHECKLIST'>('PERSONAS');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-['Plus_Jakarta_Sans',sans-serif]">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-[#161415] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff5708] to-[#df8600] flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,87,8,0.4)]">
              <Flame className="w-7 h-7 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Syne',sans-serif] text-lg font-black uppercase text-white tracking-wider">
                  Platform Onboarding & Quick Tour
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff5708]/15 border border-[#ff5708]/30 text-[#ff7a29] font-mono">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-[#8f827d] mt-0.5">
                Explore the complete multi-tenant restaurant SaaS: Customer, Staff, Admin & Hardware.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#a0948e] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#201d1e] rounded-xl border border-white/10 mb-5 text-xs font-bold font-['Syne',sans-serif] flex-shrink-0">
          <button
            onClick={() => setActiveTab('PERSONAS')}
            className={`py-2 px-2 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'PERSONAS' ? 'bg-[#ff5708] text-white' : 'text-[#8f827d] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3 Portals</span>
          </button>
          <button
            onClick={() => setActiveTab('TABLES')}
            className={`py-2 px-2 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'TABLES' ? 'bg-[#ff5708] text-white' : 'text-[#8f827d] hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>NFC Tables ({tables.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('CHECKLIST')}
            className={`py-2 px-2 rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'CHECKLIST' ? 'bg-[#ff5708] text-white' : 'text-[#8f827d] hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Onboarding Checklist</span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* TAB 1: 3 PERSONA PORTALS */}
          {activeTab === 'PERSONAS' && (
            <div className="space-y-3">
              {/* Customer Dining */}
              <div className="p-4 rounded-2xl bg-[#201d1e] border border-white/10 hover:border-[#ff5708]/40 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[#ff5708]/15 text-[#ff7a29]">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-['Syne',sans-serif] text-sm font-bold text-white uppercase">
                        1. Customer Dining Experience
                      </h3>
                      <span className="text-[11px] text-[#ffb86d] font-mono">
                        Route: /?table={currentTableNumber}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPersona('customer');
                      onClose();
                    }}
                    className="py-1.5 px-3 rounded-lg bg-[#ff5708] hover:bg-[#ff7a29] text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#8f827d] mb-3">
                  Simulate diner arriving at table, scanning QR or tapping NFC puck, Supabase Auth login, ordering flame-kissed wings, and testing Razorpay checkout.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">Table QR & NFC</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">Supabase Auth</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">Shared Table Cart</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">Razorpay Test Sandbox</span>
                </div>
              </div>

              {/* Staff Operations */}
              <div className="p-4 rounded-2xl bg-[#201d1e] border border-white/10 hover:border-sky-500/40 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-['Syne',sans-serif] text-sm font-bold text-white uppercase">
                        2. Staff Operations Portal
                      </h3>
                      <span className="text-[11px] text-sky-400 font-mono">
                        Route: /staff
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPersona('staff');
                      onClose();
                    }}
                    className="py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#8f827d] mb-3">
                  Operations hub for Pitmaster cooks, floor servers, and captains. Features 3-tab login (Email, Staff QR badge, or Contactless NFC keycard).
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">Kitchen Pit (KDS)</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">Live Floor Map</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">Service Calls</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">Takeaway Counter</span>
                </div>
              </div>

              {/* Restaurant Admin */}
              <div className="p-4 rounded-2xl bg-[#201d1e] border border-white/10 hover:border-purple-500/40 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-['Syne',sans-serif] text-sm font-bold text-white uppercase">
                        3. Restaurant Admin & SaaS Platform
                      </h3>
                      <span className="text-[11px] text-purple-400 font-mono">
                        Route: /admin
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPersona('admin');
                      onClose();
                    }}
                    className="py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#8f827d] mb-3">
                  Complete owner dashboard with 10 operational modules, new branch onboarding wizard, NFC hardware programming, and live sales analytics.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">Branch Onboarding</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">NFC Hardware Station</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">Team & Roster</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[#a89d97]">BI Sales Analytics</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE TABLE & NFC SELECTOR */}
          {activeTab === 'TABLES' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#201d1e] border border-white/10 text-xs text-[#8f827d]">
                Tap any table below to simulate tapping an NFC disc or scanning its unique QR standee. The dining app will immediately switch to that table.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {tables.map((t) => {
                  const isCurrent = t.tableNumber === currentTableNumber;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onSelectTable(t.tableNumber);
                        onSelectPersona('customer');
                        onClose();
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all group ${
                        isCurrent
                          ? 'bg-[#ff5708]/20 border-[#ff5708] text-white shadow-lg'
                          : 'bg-[#201d1e] border-white/10 hover:border-white/30 text-[#a0948e]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-['Syne',sans-serif] font-black text-sm text-white">
                          Table {t.tableNumber}
                        </span>
                        <Radio className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#ff5708]' : 'text-[#685f5a]'}`} />
                      </div>
                      <div className="text-[11px] text-[#8f827d]">
                        {t.zone} • {t.capacity} Guests
                      </div>
                      <div className="text-[10px] font-mono text-[#ffb86d] mt-1">
                        NFC-TAB-{t.tableNumber}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: RESTAURANT ONBOARDING CHECKLIST */}
          {activeTab === 'CHECKLIST' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#201d1e] border border-white/10">
                <div>
                  <h4 className="font-['Syne',sans-serif] font-bold text-sm text-white">
                    4-Step Restaurant Setup Wizard
                  </h4>
                  <p className="text-xs text-[#8f827d]">
                    Launch full onboarding to create branches, tables, menu, and tax settings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenRestaurantWizard();
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Store className="w-4 h-4" />
                  <span>Start Wizard</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#201d1e] border border-white/10">
                <div>
                  <h4 className="font-['Syne',sans-serif] font-bold text-sm text-white">
                    25-Point Production Readiness Checklist
                  </h4>
                  <p className="text-xs text-[#8f827d]">
                    Verify payment keys, hardware discs, thermal printers, and Supabase RLS.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChecklist();
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Open Checklist</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#8f827d] flex-shrink-0">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">Supabase: jgeiqbtphyxijxogcjty</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-wider text-xs font-['Syne',sans-serif] transition-colors"
          >
            Close Tour
          </button>
        </div>
      </motion.div>
    </div>
  );
};