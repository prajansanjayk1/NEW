import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Droplets, 
  Utensils, 
  FileText, 
  Flame, 
  Receipt, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceRequest, ServiceRequestType } from '../types';
import { SERVICE_TYPE_CONFIGS } from '../services/serviceRequestService';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestService: (type: ServiceRequestType, customNote?: string) => void;
  activeRequests: ServiceRequest[];
  tableNumber: string;
}

const SERVICE_BUTTONS: { type: ServiceRequestType; label: string; icon: any; color: string }[] = [
  { type: 'WAITER', label: 'Call Server', icon: Bell, color: 'text-[#ff5708]' },
  { type: 'WATER', label: 'Cold Water', icon: Droplets, color: 'text-sky-400' },
  { type: 'CUTLERY', label: 'Cutlery & Plates', icon: Utensils, color: 'text-[#ffb86d]' },
  { type: 'NAPKINS', label: 'Napkins & Wipes', icon: FileText, color: 'text-[#e5beb2]' },
  { type: 'EXTRA_SAUCE', label: 'Extra Sauce / Dip', icon: Flame, color: 'text-[#ff5449]' },
  { type: 'BILL', label: 'Request Bill', icon: Receipt, color: 'text-emerald-400' },
  { type: 'ASSISTANCE', label: 'Table Assistance', icon: HelpCircle, color: 'text-purple-400' },
];

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestService,
  activeRequests,
  tableNumber,
}) => {
  const [customNote, setCustomNote] = useState('');
  const [submittedType, setSubmittedType] = useState<ServiceRequestType | null>(null);

  if (!isOpen) return null;

  const handleSend = (type: ServiceRequestType) => {
    onRequestService(type, customNote.trim() || undefined);
    setSubmittedType(type);
    setCustomNote('');
    setTimeout(() => {
      setSubmittedType(null);
    }, 2000);
  };

  const getStatusBadge = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'REQUESTED':
        return { label: 'Notified Floor', color: 'bg-[#ff5708]/20 text-[#ff5708] border-[#ff5708]/30' };
      case 'ACKNOWLEDGED':
        return { label: 'Server Dispatched', color: 'bg-[#ffb86d]/20 text-[#ffb86d] border-[#ffb86d]/30' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      case 'COMPLETED':
        return { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#1c1b1c] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#201f20]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ff5708] flex items-center justify-center text-[#511500]">
              <Bell className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="font-syne text-base font-black uppercase text-[#e5e2e3]">
                Table {tableNumber} Service
              </h2>
              <span className="font-sans text-[11px] text-[#ac897e]">
                Instant 1-tap floor assistance
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close service modal"
            className="w-8 h-8 rounded-full bg-[#353436] hover:bg-[#ff5708] hover:text-[#511500] flex items-center justify-center text-[#e5e2e3] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Quick 1-Tap Buttons Grid */}
          <div className="space-y-1.5">
            <label className="font-syne text-[10px] uppercase font-bold text-[#ac897e] tracking-wider block">
              Tap to Call Floor Staff
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_BUTTONS.map((item) => {
                const Icon = item.icon;
                const isRecent = submittedType === item.type;

                return (
                  <motion.button
                    key={item.type}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSend(item.type)}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isRecent
                        ? 'bg-[#ff5708] text-[#511500] border-[#ff5708] shadow-lg shadow-[#ff5708]/30 font-black'
                        : 'bg-[#201f20] hover:bg-[#2a2a2b] border-white/[0.08] text-[#e5e2e3]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl bg-[#0e0e0f] flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-syne text-xs font-bold block truncate">
                        {item.label}
                      </span>
                      <span className="font-sans text-[10px] text-[#ac897e] block truncate">
                        {isRecent ? 'Sent to staff!' : '1-Tap Notify'}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5 pt-1">
            <label className="font-syne text-[10px] uppercase font-bold text-[#ac897e] tracking-wider block">
              Specific Request Note (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Extra hot ranch and 4 ice waters..."
                className="flex-1 h-10 px-3.5 rounded-xl bg-[#201f20] border border-white/[0.08] text-xs text-[#e5e2e3] placeholder:text-[#ac897e] focus:outline-none focus:border-[#ff5708]"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend('ASSISTANCE')}
                className="px-4 rounded-xl bg-[#2a2a2b] hover:bg-[#ff5708] hover:text-[#511500] text-[#e5e2e3] font-syne text-xs font-bold uppercase transition-colors cursor-pointer border border-white/[0.08]"
              >
                Send
              </motion.button>
            </div>
          </div>

          {/* Active Calls List */}
          {activeRequests.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/[0.08]">
              <label className="font-syne text-[10px] uppercase font-bold text-[#ffb86d] tracking-wider block">
                Live Table Call Status ({activeRequests.length})
              </label>
              <div className="space-y-2">
                {activeRequests.map((req) => {
                  const badge = getStatusBadge(req.status);
                  return (
                    <div
                      key={req.id}
                      className="p-3 bg-[#201f20] border border-white/[0.08] rounded-2xl flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-syne text-xs font-bold text-white truncate">
                          {req.title}
                        </div>
                        <div className="font-sans text-[11px] text-[#ac897e] truncate">
                          {req.description} ({req.requestedAt})
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-syne text-[10px] font-black uppercase border flex-shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
