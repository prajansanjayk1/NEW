import React, { useState } from 'react';
import { 
  Flame, 
  ArrowRight, 
  Users, 
  Lock, 
  Wifi, 
  Copy, 
  Check, 
  ChevronRight, 
  Utensils, 
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_TABLE_INFO } from '../data/mockData';
import { TableSession } from '../types';

interface TableWelcomeViewProps {
  onStartOrdering: () => void;
  onOpenCrew: () => void;
  onNavigateToStatus: () => void;
  onOpenService?: () => void;
  activeOrderExists: boolean;
  crewCount?: number;
  session?: TableSession;
}

export const TableWelcomeView: React.FC<TableWelcomeViewProps> = ({
  onStartOrdering,
  onOpenCrew,
  onNavigateToStatus,
  onOpenService,
  activeOrderExists,
  crewCount = 3,
  session,
}) => {
  const [copied, setCopied] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);

  const tableNum = session?.tableNumber || INITIAL_TABLE_INFO.tableNumber;
  const token = session?.sessionToken || INITIAL_TABLE_INFO.sessionToken;
  const activeCount = session?.participants.length || crewCount;

  const handleCopyWifi = () => {
    navigator.clipboard.writeText(INITIAL_TABLE_INFO.wifiPassword).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col w-full max-w-md mx-auto px-4 pb-28 pt-2 space-y-4"
    >
      {/* NFC Session Verified Bar */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="flex items-center justify-between bg-[#1c1b1c]/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/[0.08] shadow-sm"
      >
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5708] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff5708]"></span>
          </span>
          <span className="font-syne text-[11px] font-extrabold text-[#ffb86d] tracking-widest uppercase">
            Table Session Verified
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-[#e5beb2] font-syne text-[11px] font-extrabold">
          <Sparkles className="w-3.5 h-3.5 text-[#ff5708]" />
          <span>TAP {token}</span>
        </div>
      </motion.div>

      {/* Hero Imagery Stage */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-[#0e0e0f] border border-white/[0.08] shadow-2xl flex flex-col justify-end min-h-[360px] group">
        <motion.img
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
          alt="Glistening flame-glazed artisan chicken wings"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFbHHST3P1Di7uBYRFeE3yUAa8peOdWfiFFfBYyPOOv-7RBKBqT2GOOEPvCscfHw87DTGT09QFCgx-m7dzJ1P78YzZyHDT5yCI2Hb_4noZEC0TBAfcm_hfdGaZKU7-hPtnUePBpook5dfqJBfaZ9zMPhJ5_VssgxFYqHlPUQsPkQlSO-mr32AUNj07DxCpTK4k0aCjx78EqLwSPfWoqdhJPu6jDyTfHGZoIQczFQaZLdKeWWtWStG7"
        />

        {/* Deep Vignette Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f]/60 to-transparent"></div>

        {/* Ambient Thermal Glow */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#ff5708]/25 blur-3xl pointer-events-none rounded-full"></div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 p-5 flex flex-col space-y-2">
          <div className="inline-flex items-center self-start bg-[#ff5708]/25 border border-[#ff5708]/40 px-3 py-1 rounded-full backdrop-blur-md shadow-sm">
            <Flame className="w-3.5 h-3.5 text-[#ff5708] mr-1.5 fill-current animate-pulse" />
            <span className="font-syne text-[11px] font-extrabold text-[#ffb59c] tracking-widest uppercase">
              Live Grill &amp; Lounge
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <h1 className="font-syne text-4xl font-extrabold text-[#e5e2e3] uppercase tracking-tighter drop-shadow-md">
              TABLE {tableNum}
            </h1>
            <span className="font-syne text-[11px] font-extrabold text-[#ffb86d] px-3 py-1 rounded-full bg-[#201f20]/90 border border-white/[0.08] uppercase tracking-wider backdrop-blur-sm">
              {INITIAL_TABLE_INFO.zone}
            </span>
          </div>

          <p className="font-sans text-sm text-[#e5beb2] pt-0.5 leading-relaxed font-medium">
            Ready when you are. Crispy. Saucy. Unapologetic.
          </p>
        </div>
      </div>

      {/* Action Stack */}
      <div className="flex flex-col space-y-2.5 pt-1">
        {/* Primary CTA: Flame Pill with Glow */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStartOrdering}
          className="relative group w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#ff5708] via-[#df8600] to-[#ff5708] bg-size-200 text-[#300c00] font-syne text-base font-black uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-[#ff5708]/30 transition-all cursor-pointer border border-[#ffb59c]/30"
        >
          <Flame className="w-5 h-5 fill-current text-[#300c00]" />
          <span className="drop-shadow-sm font-black">Start Ordering</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </motion.button>

        {/* Live Active Order Quick Link (if in progress) */}
        {activeOrderExists && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNavigateToStatus}
            className="w-full py-3 px-5 rounded-2xl bg-[#ff5708]/15 border border-[#ff5708]/40 text-[#ffb59c] font-syne text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer shadow-md"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5708] animate-ping" />
              <span className="tracking-wide">ROUND 1 IN THE FIRE · TICKET #K184</span>
            </div>
            <span className="text-[#ffb86d] underline font-bold">Track Live Status →</span>
          </motion.button>
        )}

        {/* Diners & Service Split Row */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCrew}
            className="py-3 px-4 rounded-2xl bg-[#201f20] hover:bg-[#2a2a2b] border border-white/[0.08] text-[#e5e2e3] font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Users className="w-4 h-4 text-[#ffb86d]" />
            <span>Diners ({activeCount})</span>
          </motion.button>

          {onOpenService && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenService}
              className="py-3 px-4 rounded-2xl bg-[#201f20] hover:bg-[#2a2a2b] border border-white/[0.08] text-[#e5e2e3] font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Bell className="w-4 h-4 text-[#ff5708]" />
              <span>Call Staff / Water</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Table Details & Fast Connect Bento Card */}
      <div className="bg-[#1c1b1c] border border-white/[0.08] rounded-3xl p-4 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center space-x-2">
            <Utensils className="w-4 h-4 text-[#ff5708]" />
            <span className="font-syne text-xs font-bold text-[#e5e2e3] uppercase tracking-wider">
              Location &amp; Link
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#ac897e]">
            Session {INITIAL_TABLE_INFO.sessionToken}
          </span>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#201f20] p-3 rounded-2xl border border-white/[0.05] flex flex-col justify-between">
            <span className="font-syne text-[10px] font-extrabold text-[#ac897e] uppercase tracking-wider">
              Branch Location
            </span>
            <span className="font-sans text-xs font-semibold text-[#e5e2e3] pt-1 leading-snug">
              {INITIAL_TABLE_INFO.branch}
            </span>
          </div>
          <div className="bg-[#201f20] p-3 rounded-2xl border border-white/[0.05] flex flex-col justify-between">
            <span className="font-syne text-[10px] font-extrabold text-[#ac897e] uppercase tracking-wider">
              Encryption
            </span>
            <div className="flex items-center space-x-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ffb86d]" />
              <span className="font-sans text-xs font-bold text-[#e5e2e3]">
                NFC Tap Verified
              </span>
            </div>
          </div>
        </div>

        {/* Instant Wi-Fi One-Tap Module */}
        <div className="bg-[#0e0e0f] p-3.5 rounded-2xl border border-white/[0.05] flex items-center justify-between shadow-inner">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#201f20] flex items-center justify-center text-[#ff5708] flex-shrink-0 border border-white/[0.05]">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-syne text-[10px] font-extrabold text-[#ac897e] uppercase tracking-wider">
                Table Wi-Fi Network
              </span>
              <span className="font-sans text-xs font-bold text-[#e5e2e3] truncate">
                {INITIAL_TABLE_INFO.wifiSsid}
              </span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyWifi}
            aria-label="Copy Table Wi-Fi Password"
            className="bg-[#201f20] hover:bg-[#2a2a2b] text-[#e5e2e3] px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 transition-all flex-shrink-0 cursor-pointer border border-white/[0.08]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#ffb86d]" />
                <span className="font-syne text-[10px] font-extrabold uppercase tracking-wider text-[#ffb86d]">
                  Copied
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#ff5708]" />
                <span className="font-syne text-[10px] font-extrabold uppercase tracking-wider text-[#e5e2e3]">
                  Copy Key
                </span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Heat Profile Teaser / Brand Cue */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowVaultModal(true)}
        className="bg-[#1c1b1c] hover:bg-[#201f20] border border-white/[0.08] rounded-3xl p-4 flex items-center justify-between transition-colors cursor-pointer shadow-md group"
      >
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1">
            <span className="w-1.5 h-5 rounded-full bg-[#ffb86d]"></span>
            <span className="w-1.5 h-5 rounded-full bg-[#ff5708]"></span>
            <span className="w-1.5 h-5 rounded-full bg-[#ff5708]"></span>
            <span className="w-1.5 h-5 rounded-full bg-[#ff5449] animate-pulse"></span>
            <span className="w-1.5 h-5 rounded-full bg-[#353436]"></span>
          </div>
          <div className="flex flex-col">
            <span className="font-syne text-xs font-bold uppercase text-[#e5e2e3] group-hover:text-[#ff5708] transition-colors">
              Tonight's Scoville Vault
            </span>
            <span className="font-sans text-xs text-[#ac897e]">
              Up to 850,000 SHU unlocked
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#ac897e] group-hover:translate-x-1 transition-transform" />
      </motion.div>

      {/* Scoville Vault Modal */}
      <AnimatePresence>
        {showVaultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-[#1c1b1c] border border-white/10 rounded-3xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#ff5708] fill-current" />
                  <h3 className="font-syne text-base font-black uppercase text-[#e5e2e3]">
                    Scoville Vault Levels
                  </h3>
                </div>
                <button 
                  onClick={() => setShowVaultModal(false)}
                  className="w-7 h-7 rounded-full bg-[#201f20] hover:bg-[#ff5708] hover:text-black flex items-center justify-center text-[#ac897e] transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#201f20] flex items-center justify-between border border-white/[0.04]">
                  <div>
                    <span className="font-syne font-bold uppercase text-[#ffb86d]">MILD · Smoked Hickory</span>
                    <p className="font-sans text-[11px] text-[#ac897e]">Sweet oak molasses &amp; citrus</p>
                  </div>
                  <span className="font-syne font-extrabold text-[#ffb86d]">12,000 SHU</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#201f20] flex items-center justify-between border border-white/[0.04]">
                  <div>
                    <span className="font-syne font-bold uppercase text-[#ff5708]">HOT · Firecracker</span>
                    <p className="font-sans text-[11px] text-[#ac897e]">Burnt chili glaze, toasted sesame</p>
                  </div>
                  <span className="font-syne font-extrabold text-[#ff5708]">85,000 SHU</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#201f20] flex items-center justify-between border border-white/[0.04]">
                  <div>
                    <span className="font-syne font-bold uppercase text-[#ff5449]">FEROCIOUS · Korean Gochujang</span>
                    <p className="font-sans text-[11px] text-[#ac897e]">Fermented pepper &amp; scorched garlic</p>
                  </div>
                  <span className="font-syne font-extrabold text-[#ff5449]">125,000 SHU</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#201f20] flex items-center justify-between border border-white/[0.04]">
                  <div>
                    <span className="font-syne font-bold uppercase text-[#ff2a2a]">INSANE · Ghost Reaper</span>
                    <p className="font-sans text-[11px] text-[#ac897e]">Trinidad scorpion &amp; Carolina reaper</p>
                  </div>
                  <span className="font-syne font-extrabold text-[#ff2a2a]">850,000 SHU</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowVaultModal(false);
                  onStartOrdering();
                }}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#ff5708] to-[#df8600] text-[#511500] font-syne font-black uppercase text-xs tracking-wider shadow-md cursor-pointer"
              >
                Taste The Vault in Menu →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feedback Toast for Wi-Fi Copy */}
      <AnimatePresence>
        {copied && (
          <motion.div 
            initial={{ opacity: 0, y: 10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-50 bg-[#df8600] text-[#4d2b00] px-5 py-2.5 rounded-full font-syne text-xs font-black uppercase tracking-wider shadow-2xl flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-[#4d2b00]" />
            <span>Wi-Fi Password Copied to Clipboard</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
