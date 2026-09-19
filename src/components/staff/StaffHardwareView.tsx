import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  QrCode, 
  Radio, 
  Smartphone, 
  Check, 
  Copy, 
  RefreshCw, 
  ExternalLink, 
  Shield, 
  Users, 
  Layers, 
  Printer, 
  AlertCircle,
  Wifi,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { hardwareService, TableHardwareConfig, StaffBadgeConfig } from '../../services/hardwareService';
import { RestaurantTable, UserRole } from '../../types';

interface StaffHardwareViewProps {
  tables: RestaurantTable[];
  userRole: UserRole;
}

export const StaffHardwareView: React.FC<StaffHardwareViewProps> = ({ tables, userRole }) => {
  const [activeTab, setActiveTab] = useState<'TABLES' | 'STAFF' | 'TESTER'>('TABLES');
  const [tableConfigs, setTableConfigs] = useState<TableHardwareConfig[]>([]);
  const [staffConfigs, setStaffConfigs] = useState<StaffBadgeConfig[]>([]);
  
  // Selected table for programming/modal
  const [editingTable, setEditingTable] = useState<TableHardwareConfig | null>(null);
  const [inputNfcUid, setInputNfcUid] = useState('');
  const [inputQrToken, setInputQrToken] = useState('');
  
  // Selected staff for badge modal
  const [editingStaff, setEditingStaff] = useState<StaffBadgeConfig | null>(null);
  const [staffNfcUid, setStaffNfcUid] = useState('');
  const [staffQrToken, setStaffQrToken] = useState('');
  
  // Status and feedback
  const [isNfcWriting, setIsNfcWriting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Live Hardware Tester state
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const isWebNfc = hardwareService.isWebNfcSupported();

  const refreshData = () => {
    setTableConfigs(hardwareService.getAllTableConfigs());
    setStaffConfigs(hardwareService.getAllStaffConfigs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCopy = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSaveTableHardware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    setIsNfcWriting(true);
    setFeedback(null);

    try {
      const res = await hardwareService.assignTableHardware(
        editingTable.tableNumber,
        inputNfcUid || `NFC-TAB-${editingTable.tableNumber}`,
        inputQrToken || `KW-${editingTable.tableNumber}-${Math.floor(100 + Math.random() * 900)}`
      );

      // If Web NFC is available, offer to write to tag
      if (isWebNfc) {
        try {
          await hardwareService.writePhysicalTag(res.config.targetUrl);
        } catch (nfcErr) {
          console.warn('Physical NFC write skipped:', nfcErr);
        }
      }

      setFeedback({
        type: 'success',
        message: `Table ${editingTable.tableNumber} NFC puck & QR standee updated successfully!`,
      });
      refreshData();
      setEditingTable(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update table hardware configuration.',
      });
    } finally {
      setIsNfcWriting(false);
    }
  };

  const handleSaveStaffHardware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setIsNfcWriting(true);
    setFeedback(null);

    try {
      await hardwareService.assignStaffHardware(
        editingStaff.staffId,
        staffNfcUid || `NFC-STAFF-${editingStaff.staffName.split(' ')[0].toUpperCase()}`,
        staffQrToken || `STAFF-QR-${editingStaff.staffName.split(' ')[0].toUpperCase()}`
      );

      setFeedback({
        type: 'success',
        message: `Staff ID badge for ${editingStaff.staffName} updated successfully!`,
      });
      refreshData();
      setEditingStaff(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update staff badge configuration.',
      });
    } finally {
      setIsNfcWriting(false);
    }
  };

  const handleRunTest = (token: string) => {
    setTestInput(token);
    const resolved = hardwareService.resolveHardwareTag(token);
    setTestResult(resolved);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-['Syne',sans-serif] text-base font-black uppercase text-white tracking-wider">
              NFC & QR Hardware Provisioning
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isWebNfc 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {isWebNfc ? 'Web NFC Active' : 'PC Simulation Mode'}
            </span>
          </div>
          <p className="text-xs text-[#8f827d] mt-0.5">
            Configure NFC discs, table QR standees, and staff contactless ID badges backed by Supabase.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-[#181516] rounded-xl border border-white/10 text-xs font-bold font-['Syne',sans-serif]">
          <button
            onClick={() => setActiveTab('TABLES')}
            className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'TABLES' ? 'bg-[#ff5708] text-white' : 'text-[#a0948e] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Table Standees ({tableConfigs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('STAFF')}
            className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'STAFF' ? 'bg-[#ff5708] text-white' : 'text-[#a0948e] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Badges ({staffConfigs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('TESTER')}
            className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'TESTER' ? 'bg-[#ff5708] text-white' : 'text-[#a0948e] hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Tap Tester</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: TABLES NFC & QR */}
      {activeTab === 'TABLES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tableConfigs.map((tbl) => {
            const tableMeta = tables.find((t) => t.tableNumber === tbl.tableNumber);
            const fullTargetUrl = window.location.origin + tbl.targetUrl;

            return (
              <div
                key={tbl.tableNumber}
                className="bg-[#181516] border border-white/[0.08] hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white font-['Syne',sans-serif]">
                          Table {tbl.tableNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                          {tbl.status}
                        </span>
                      </div>
                      <span className="text-xs text-[#8f827d]">
                        {tableMeta?.zone || 'Dining Floor'} • Capacity: {tableMeta?.capacity || 4}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.04] text-[#ff7a29]">
                      <Radio className="w-5 h-5" />
                    </div>
                  </div>

                  {/* QR Graphic & NFC Tag Details */}
                  <div className="flex gap-4 items-center p-3 rounded-xl bg-[#201d1e] border border-white/[0.04] mb-3">
                    <div className="w-20 h-20 bg-white p-1 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                          fullTargetUrl
                        )}`}
                        alt={`Table ${tbl.tableNumber} QR`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#80746e]">NFC Puck UID</span>
                        <div className="text-xs font-mono font-bold text-[#ffb86d] truncate">
                          {tbl.nfcTagUid}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#80746e]">QR Standee Token</span>
                        <div className="text-xs font-mono font-bold text-white truncate">
                          {tbl.qrToken}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deep link info */}
                  <div className="text-[11px] text-[#706661] truncate font-mono mb-2">
                    {tbl.targetUrl}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTable(tbl);
                      setInputNfcUid(tbl.nfcTagUid);
                      setInputQrToken(tbl.qrToken);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#ff5708]/10 hover:bg-[#ff5708]/20 border border-[#ff5708]/30 text-[#ff7a29] text-xs font-bold uppercase tracking-wider font-['Syne',sans-serif] transition-colors"
                  >
                    Program / Assign
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(tbl.targetUrl)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#a0948e] hover:text-white transition-colors"
                    title="Copy QR / NFC Target URL"
                  >
                    {copiedUrl === tbl.targetUrl ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <a
                    href={tbl.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#a0948e] hover:text-white transition-colors"
                    title="Test Customer Table Dining Screen"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 2: STAFF CONTACTLESS BADGES */}
      {activeTab === 'STAFF' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {staffConfigs.map((staff) => (
            <div
              key={staff.staffId}
              className="bg-[#181516] border border-white/[0.08] hover:border-white/20 rounded-2xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                    staff.role === 'KITCHEN' ? 'bg-[#ff5708]/20 text-[#ff7a29]' :
                    staff.role === 'STAFF' ? 'bg-sky-500/20 text-sky-400' :
                    staff.role === 'MANAGER' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {staff.role}
                  </span>
                  <Shield className="w-4 h-4 text-[#80746e]" />
                </div>

                <h3 className="font-['Syne',sans-serif] text-sm font-bold text-white mb-0.5">
                  {staff.staffName}
                </h3>
                <span className="text-xs text-[#8f827d] block mb-4">
                  {staff.email}
                </span>

                {/* Digital Staff Badge Card */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#201d1e] to-[#161415] border border-white/[0.06] mb-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#80746e]">NFC Keycard UID</span>
                    <span className="text-xs font-mono font-bold text-[#ff7a29]">{staff.nfcCardUid}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#80746e]">QR Badge Token</span>
                    <span className="text-xs font-mono font-bold text-white">{staff.qrBadgeToken}</span>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-[#6d625d]">
                    <span>Card Status</span>
                    <span className="text-emerald-400 font-semibold">{staff.status}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStaff(staff);
                    setStaffNfcUid(staff.nfcCardUid);
                    setStaffQrToken(staff.qrBadgeToken);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider font-['Syne',sans-serif] transition-colors"
                >
                  Edit Badge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION 3: LIVE HARDWARE TAP TESTER */}
      {activeTab === 'TESTER' && (
        <div className="bg-[#181516] border border-white/[0.08] rounded-2xl p-6 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#ff5708]/10 text-[#ff5708] flex items-center justify-center mx-auto mb-3 border border-[#ff5708]/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-['Syne',sans-serif] text-base font-black uppercase text-white tracking-wider">
              NFC & QR Hardware Reader Simulation
            </h3>
            <p className="text-xs text-[#8f827d] mt-1 max-w-md mx-auto">
              Simulate tapping any table NFC tag or staff badge to verify instant resolution and routing.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="mb-6 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8a7f79]">
              Quick Test Presets (Click to Simulate Instant Tap)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRunTest('NFC-TAB-18')}
                className="px-3 py-1.5 rounded-lg bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-xs font-mono text-[#ffb86d]"
              >
                Table 18 (NFC-TAB-18)
              </button>
              <button
                type="button"
                onClick={() => handleRunTest('NFC-TAB-04')}
                className="px-3 py-1.5 rounded-lg bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-xs font-mono text-[#ffb86d]"
              >
                Table 04 (NFC-TAB-04)
              </button>
              <button
                type="button"
                onClick={() => handleRunTest('NFC-STAFF-MARCO')}
                className="px-3 py-1.5 rounded-lg bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-xs font-mono text-[#ff7a29]"
              >
                Chef Marco NFC (Kitchen)
              </button>
              <button
                type="button"
                onClick={() => handleRunTest('STAFF-QR-PRIYA')}
                className="px-3 py-1.5 rounded-lg bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-xs font-mono text-amber-400"
              >
                Manager Priya QR
              </button>
              <button
                type="button"
                onClick={() => handleRunTest('NFC-STAFF-ADMIN')}
                className="px-3 py-1.5 rounded-lg bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-xs font-mono text-purple-400"
              >
                Admin NFC
              </button>
            </div>
          </div>

          {/* Manual Input */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter NFC Tag UID or QR Token..."
              className="flex-1 bg-[#201d1e] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#6d625d] font-mono focus:outline-none focus:border-[#ff5708]"
            />
            <button
              type="button"
              onClick={() => handleRunTest(testInput)}
              className="py-2.5 px-5 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white font-['Syne',sans-serif] font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Resolve Tag
            </button>
          </div>

          {/* Test Result Card */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-[#201d1e] border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#a0948e] font-['Syne',sans-serif]">
                  Resolution Result
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  testResult.type === 'TABLE' ? 'bg-emerald-500/20 text-emerald-400' :
                  testResult.type === 'STAFF' ? 'bg-sky-500/20 text-sky-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {testResult.type} MATCH
                </span>
              </div>

              {testResult.type === 'TABLE' && testResult.tableConfig && (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-white">
                    Routing to Table {testResult.tableConfig.tableNumber}
                  </div>
                  <div className="text-xs text-[#8f827d]">
                    Customer scanning this NFC/QR tag is directly connected to the table session.
                  </div>
                  <a
                    href={testResult.tableConfig.targetUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ff7a29] hover:underline pt-2"
                  >
                    <span>Launch Customer Table {testResult.tableConfig.tableNumber} Experience</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {testResult.type === 'STAFF' && testResult.staffConfig && (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-white">
                    Staff Identity: {testResult.staffConfig.staffName} ({testResult.staffConfig.role})
                  </div>
                  <div className="text-xs text-[#8f827d]">
                    Contactless credential verified. Ready for automatic terminal login.
                  </div>
                  <div className="text-xs font-mono text-[#ffb86d]">
                    Assigned Badge Token: {testResult.staffConfig.qrBadgeToken}
                  </div>
                </div>
              )}

              {testResult.type === 'UNKNOWN' && (
                <div className="text-xs text-red-400">
                  Tag "{testInput}" is not assigned to any restaurant table or staff profile.
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* MODAL: PROGRAM TABLE HARDWARE */}
      <AnimatePresence>
        {editingTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#161415] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-4">
                <div>
                  <h3 className="font-['Syne',sans-serif] text-base font-black uppercase text-white">
                    Program Table {editingTable.tableNumber} Hardware
                  </h3>
                  <span className="text-xs text-[#8f827d]">
                    Configure NFC Disc UID and QR Standee Token
                  </span>
                </div>
                <button
                  onClick={() => setEditingTable(null)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0948e]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTableHardware} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1.5 font-['Syne',sans-serif]">
                    NFC Disc Chip UID / Token
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={inputNfcUid}
                      onChange={(e) => setInputNfcUid(e.target.value)}
                      placeholder="e.g. NFC-TAB-18"
                      className="flex-1 bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ff5708]"
                    />
                    <button
                      type="button"
                      onClick={() => setInputNfcUid(`NFC-TAB-${editingTable.tableNumber}-${Math.floor(100 + Math.random() * 900)}`)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                      title="Generate new UID"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1.5 font-['Syne',sans-serif]">
                    QR Standee Token
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={inputQrToken}
                      onChange={(e) => setInputQrToken(e.target.value)}
                      placeholder="e.g. KW-18-SECURE"
                      className="flex-1 bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ff5708]"
                    />
                    <button
                      type="button"
                      onClick={() => setInputQrToken(`KW-${editingTable.tableNumber}-${Math.floor(100 + Math.random() * 900)}`)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold"
                      title="Generate new token"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isWebNfc && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                    Ready to write directly to blank NTAG NFC disc upon saving.
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTable(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#a0948e] text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isNfcWriting}
                    className="flex-1 py-2.5 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white text-xs font-bold uppercase tracking-wider font-['Syne',sans-serif]"
                  >
                    {isNfcWriting ? 'Programming...' : 'Save & Program'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT STAFF BADGE */}
      <AnimatePresence>
        {editingStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#161415] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-4">
                <div>
                  <h3 className="font-['Syne',sans-serif] text-base font-black uppercase text-white">
                    Assign Staff Badge
                  </h3>
                  <span className="text-xs text-[#8f827d]">
                    {editingStaff.staffName} ({editingStaff.role})
                  </span>
                </div>
                <button
                  onClick={() => setEditingStaff(null)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0948e]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStaffHardware} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1.5 font-['Syne',sans-serif]">
                    Contactless NFC Card UID
                  </label>
                  <input
                    type="text"
                    required
                    value={staffNfcUid}
                    onChange={(e) => setStaffNfcUid(e.target.value)}
                    placeholder="e.g. NFC-STAFF-MARCO"
                    className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ff5708]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#a0948e] mb-1.5 font-['Syne',sans-serif]">
                    Staff QR Badge Token
                  </label>
                  <input
                    type="text"
                    required
                    value={staffQrToken}
                    onChange={(e) => setStaffQrToken(e.target.value)}
                    placeholder="e.g. STAFF-QR-MARCO"
                    className="w-full bg-[#201d1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#ff5708]"
                  />
                </div>

                <div className="pt-4 border-t border-white/10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#a0948e] text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isNfcWriting}
                    className="flex-1 py-2.5 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white text-xs font-bold uppercase tracking-wider font-['Syne',sans-serif]"
                  >
                    {isNfcWriting ? 'Saving...' : 'Update Badge'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};