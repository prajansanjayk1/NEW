import React, { useState } from 'react';
import { 
  Settings, 
  Store, 
  Shield, 
  QrCode, 
  History, 
  Save, 
  Database, 
  Check, 
  AlertCircle,
  Clock,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { Restaurant, UserRole, AuditLog } from '../../types';
import { isSupabaseConfigured, getSupabaseClient } from '../../services/supabaseClient';
import { auditService } from '../../services/auditService';
import { backendService } from '../../services/backendService';

interface StaffSettingsViewProps {
  restaurant: Restaurant;
  userRole: UserRole;
  onUpdateRestaurant?: (r: Restaurant) => void;
}

export const StaffSettingsView: React.FC<StaffSettingsViewProps> = ({
  restaurant,
  userRole,
  onUpdateRestaurant,
}) => {
  const [name, setName] = useState(restaurant?.name || 'Kings of Wings');
  const [address, setAddress] = useState(restaurant?.address || 'Shop 4, Indiranagar, 100ft Road, Bengaluru, Karnataka 560038');
  const [phone, setPhone] = useState(restaurant?.phone || '+91 80 4920 3300');
  const [email, setEmail] = useState(restaurant?.email || 'manager@kingsofwings.menu');
  const [autoAccept, setAutoAccept] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isSupabaseLive = isSupabaseConfigured();
  const auditLogs: AuditLog[] = auditService.getAuditLogs();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const updated = await backendService.updateRestaurantSettings({
        name,
        address,
        phone,
        email,
      });
      if (onUpdateRestaurant) onUpdateRestaurant(updated);
      setFeedback('Restaurant profile and settings successfully updated.');
    } catch {
      setFeedback('Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Bar */}
      <div>
        <h2 className="font-['Syne',sans-serif] text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#ff5708]" />
          <span>Restaurant Settings & Root Control</span>
        </h2>
        <p className="text-xs text-[#8f827d]">
          Configure venue profile, operational parameters, and inspect database security
        </p>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
          {feedback}
        </div>
      )}

      {/* Database Connection & Architecture Status Card */}
      <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-['Syne',sans-serif] text-xs font-black uppercase text-white tracking-wider">
                Database & Supabase Auth Connectivity
              </h3>
              <span className="text-[10px] text-[#7d716c]">
                Row-Level Security (RLS) & Realtime Synchronization
              </span>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono ${
            isSupabaseLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {isSupabaseLive ? 'LIVE SUPABASE' : 'SANDBOX DEMO'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-white/[0.06]">
          <div className="p-3 rounded-xl bg-[#201d1e] border border-white/[0.04]">
            <span className="text-[10px] text-[#8e827c] uppercase font-bold block">Auth Engine</span>
            <span className="font-semibold text-white">Supabase Auth (GoTrue)</span>
          </div>

          <div className="p-3 rounded-xl bg-[#201d1e] border border-white/[0.04]">
            <span className="text-[10px] text-[#8e827c] uppercase font-bold block">Database Engine</span>
            <span className="font-semibold text-white">PostgreSQL with PostGIS/RLS</span>
          </div>

          <div className="p-3 rounded-xl bg-[#201d1e] border border-white/[0.04]">
            <span className="text-[10px] text-[#8e827c] uppercase font-bold block">Authorization Policy</span>
            <span className="font-semibold text-emerald-400">Scoped per Restaurant ID</span>
          </div>
        </div>
      </div>

      {/* Restaurant Profile Form */}
      <form onSubmit={handleSave} className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-4">
        <h3 className="font-['Syne',sans-serif] text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
          <Store className="w-4 h-4 text-[#ff5708]" />
          <span>Restaurant Venue Information</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
              Venue Brand Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff5708]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff5708]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
              Official Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff5708]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
              Service Charge Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={serviceChargeRate}
              onChange={(e) => setServiceChargeRate(Number(e.target.value))}
              className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff5708]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1 font-['Syne',sans-serif]">
            Full Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#ff5708]"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Audit Log Stream */}
      <div className="bg-[#161415] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-['Syne',sans-serif] text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            <span>Recent Staff Operational Audit Log</span>
          </h3>
          <span className="text-[10px] text-[#7d716c]">
            {auditLogs.length} events logged
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#7d716c]">
            No audit events recorded yet in this session.
          </div>
        ) : (
          <div className="space-y-2">
            {auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl bg-[#201d1e] border border-white/[0.04] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white mr-2">{log.action}</span>
                  <span className="text-[10px] text-[#8e827c]">{log.entityType} ({log.entityId})</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#ff7a29] block">{log.actorRole}</span>
                  <span className="text-[9px] text-[#6d625d]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
