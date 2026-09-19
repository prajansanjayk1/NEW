import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Utensils, 
  QrCode, 
  Radio, 
  Sparkles,
  Camera,
  RefreshCw,
  Crown,
  Laptop
} from 'lucide-react';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { UserRole } from '../../types';
import { staffAuthService, DEFAULT_STAFF_MEMBERS } from '../../services/staffAuthService';
import { hardwareService } from '../../services/hardwareService';

interface StaffLoginPageProps {
  portalMode?: 'staff' | 'admin';
  onExitToCustomer?: () => void;
  onSuccess?: () => void;
  onSwitchPortal?: (mode: 'staff' | 'admin') => void;
}

type AuthMethod = 'EMAIL' | 'QR_BADGE' | 'NFC_TAP';

export const StaffLoginPage: React.FC<StaffLoginPageProps> = ({ 
  portalMode = 'staff',
  onExitToCustomer, 
  onSuccess,
  onSwitchPortal,
}) => {
  const { loginWithEmail, loginWithPin, loginWithQrBadge, loginWithNfcTag, isLoading } = useStaffAuth();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('EMAIL');
  const [currentMode, setCurrentMode] = useState<'staff' | 'admin'>(portalMode);

  // Email form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // QR Badge scan form
  const [qrBadgeInput, setQrBadgeInput] = useState('');
  const [isQrScanning, setIsQrScanning] = useState(false);

  // NFC Tap state
  const [isNfcListening, setIsNfcListening] = useState(false);
  const [nfcFeedback, setNfcFeedback] = useState<string | null>(null);
  const isWebNfcSupported = hardwareService.isWebNfcSupported();

  useEffect(() => {
    setCurrentMode(portalMode);
    if (portalMode === 'admin') {
      setEmail('admin@kingsofwings.menu');
      setPassword('admin');
    }
  }, [portalMode]);

  // Handle native Web NFC scanning if user chooses NFC tab
  useEffect(() => {
    if (authMethod !== 'NFC_TAP' || !isWebNfcSupported) return;

    const controller = new AbortController();
    setIsNfcListening(true);
    setNfcFeedback('Bring your staff NFC card or smart band near your device...');

    hardwareService.scanPhysicalTag(controller.signal)
      .then(async (res) => {
        if (res.success && res.serialNumber) {
          setNfcFeedback(`Card Detected: ${res.serialNumber}. Verifying...`);
          const loginRes = await loginWithNfcTag(res.serialNumber);
          if (loginRes.success) {
            setSuccessMessage('NFC Identity Verified! Access Granted.');
            if (onSuccess) onSuccess();
          } else {
            setErrorMessage(loginRes.error || 'NFC Badge not recognized.');
          }
        } else if (res.error) {
          setNfcFeedback(res.error);
        }
      })
      .catch((err) => {
        console.warn('NFC auto-listen interrupted:', err);
      });

    return () => {
      controller.abort();
      setIsNfcListening(false);
    };
  }, [authMethod, isWebNfcSupported, loginWithNfcTag, onSuccess]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    const res = await loginWithEmail(email, password);
    if (res.success) {
      setSuccessMessage('Successfully signed in with Supabase Auth!');
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.error || 'Invalid email or password.');
    }
  };

  const handleQrBadgeLogin = async (token: string) => {
    setErrorMessage(null);
    if (!token.trim()) return;

    setIsQrScanning(true);
    try {
      const res = await loginWithQrBadge(token);
      if (res.success) {
        setSuccessMessage(`QR Badge Authenticated! Welcome.`);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Invalid or revoked QR badge token.');
      }
    } finally {
      setIsQrScanning(false);
    }
  };

  const handleNfcTagLogin = async (tagId: string) => {
    setErrorMessage(null);
    setNfcFeedback(`Simulating NFC Card Contact: ${tagId}...`);

    const res = await loginWithNfcTag(tagId);
    if (res.success) {
      setSuccessMessage(`NFC Tag Authenticated! Welcome.`);
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.error || 'Unregistered NFC badge card.');
    }
  };

  const handleQuickRoleLogin = async (role: UserRole, pin: string) => {
    setErrorMessage(null);
    const res = await loginWithPin(role, pin);
    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(res.error || 'Failed to sign in.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsSubmittingReset(true);
    setResetFeedback(null);
    try {
      const res = await staffAuthService.requestPasswordReset(forgotEmail);
      setResetFeedback(res.message);
    } catch {
      setResetFeedback('Failed to request password reset. Please contact system admin.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const toggleMode = (mode: 'staff' | 'admin') => {
    setCurrentMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (onSwitchPortal) {
      onSwitchPortal(mode);
    }
    if (mode === 'admin') {
      setEmail('admin@kingsofwings.menu');
      setPassword('admin');
    } else {
      setEmail('priya@kingsofwings.menu');
      setPassword('3333');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0c0a0b] text-[#f4efe6] flex flex-col justify-center items-center p-4 selection:bg-[#ff5708] selection:text-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background ambient fire glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#ff5708]/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#df8600]/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-[#161415] border border-white/10 rounded-2xl p-6 sm:p-8 relative z-10 shadow-[0_24px_64px_rgba(0,0,0,0.8)]"
      >
        {/* Portal Switcher Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${currentMode === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-[#ff5708]/20 text-[#ff7a29]'}`}>
              {currentMode === 'admin' ? <Crown className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="font-['Syne',sans-serif] text-base font-black uppercase tracking-wider text-white">
                {currentMode === 'admin' ? 'Restaurant Admin Console' : 'Staff Operations Portal'}
              </h1>
              <span className="text-[11px] text-[#8e827d]">
                {currentMode === 'admin' ? '/admin branch (Owner & Manager)' : '/staff branch (Kitchen & Floor)'}
              </span>
            </div>
          </div>

          <div className="flex p-1 bg-[#201d1e] rounded-xl border border-white/10 text-[11px] font-bold font-['Syne',sans-serif]">
            <button
              type="button"
              onClick={() => toggleMode('staff')}
              className={`px-3 py-1 rounded-lg uppercase tracking-wider transition-all ${
                currentMode === 'staff' ? 'bg-[#ff5708] text-white' : 'text-[#8f837e] hover:text-white'
              }`}
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => toggleMode('admin')}
              className={`px-3 py-1 rounded-lg uppercase tracking-wider transition-all ${
                currentMode === 'admin' ? 'bg-purple-600 text-white' : 'text-[#8f837e] hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* 3 Authentication Methods Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#201d1e] rounded-xl border border-white/10 mb-6 text-xs font-bold font-['Syne',sans-serif]">
          <button
            type="button"
            onClick={() => setAuthMethod('EMAIL')}
            className={`py-2 px-2 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              authMethod === 'EMAIL' ? 'bg-white/15 text-white shadow-sm' : 'text-[#8f837e] hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate">Email & Pass</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('QR_BADGE')}
            className={`py-2 px-2 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              authMethod === 'QR_BADGE' ? 'bg-[#ff5708] text-white shadow-sm' : 'text-[#8f837e] hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="truncate">QR Badge</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('NFC_TAP')}
            className={`py-2 px-2 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              authMethod === 'NFC_TAP' ? 'bg-[#df8600] text-white shadow-sm' : 'text-[#8f837e] hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="truncate">NFC Tap</span>
          </button>
        </div>

        {/* Error / Success Alerts */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-xs leading-relaxed"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB 1: EMAIL & PASSWORD (FOR PC STAFF & ADMIN) */}
        {authMethod === 'EMAIL' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a89d97] font-['Syne',sans-serif]">
                  {currentMode === 'admin' ? 'Administrator Email' : 'Staff Email Address'}
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">Supabase Auth</span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#756b66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={currentMode === 'admin' ? 'admin@kingsofwings.menu' : 'priya@kingsofwings.menu'}
                  className="w-full bg-[#201d1e] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708] focus:ring-1 focus:ring-[#ff5708] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a89d97] font-['Syne',sans-serif]">
                  Security Password / PIN
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-[#ff9359] hover:text-[#ffb86d] underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#756b66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#201d1e] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708] focus:ring-1 focus:ring-[#ff5708] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-['Syne',sans-serif] font-black uppercase text-xs tracking-wider shadow-lg hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                currentMode === 'admin' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-900/30' 
                  : 'bg-gradient-to-r from-[#ff5708] to-[#ff7a29] shadow-[0_4px_20px_rgba(255,87,8,0.3)]'
              }`}
            >
              {isLoading ? (
                <span>AUTHENTICATING SUPABASE...</span>
              ) : (
                <>
                  <span>SIGN IN TO {currentMode === 'admin' ? 'ADMIN CONSOLE' : 'OPERATIONS'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: QR BADGE SCANNER */}
        {authMethod === 'QR_BADGE' && (
          <div className="space-y-4">
            <div className="text-center p-4 rounded-2xl bg-[#201d1e] border border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-[#ff5708]/10 border border-[#ff5708]/30 flex items-center justify-center mx-auto mb-3 text-[#ff7a29]">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="font-['Syne',sans-serif] text-sm font-bold uppercase text-white mb-1">
                Scan Physical Staff QR Badge
              </h3>
              <p className="text-xs text-[#8f827d] max-w-xs mx-auto">
                Hold your staff QR ID badge in front of the terminal camera or choose your badge below.
              </p>
            </div>

            {/* Quick Demo QR Badges for 1-Click Instant Staff Login */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8b8079] font-['Syne',sans-serif]">
                Instant Staff Badge Emulators
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQrBadgeLogin('STAFF-QR-MARCO')}
                  className="p-2.5 rounded-xl bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-left transition-all"
                >
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#ff5708]/20 text-[#ff7a29] block w-max mb-1">
                    Kitchen
                  </span>
                  <span className="text-xs font-bold text-white block">Chef Marco Badge</span>
                  <span className="text-[10px] font-mono text-[#776c66]">STAFF-QR-MARCO</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQrBadgeLogin('STAFF-QR-DAVID')}
                  className="p-2.5 rounded-xl bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-left transition-all"
                >
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 block w-max mb-1">
                    Floor Staff
                  </span>
                  <span className="text-xs font-bold text-white block">Server David Badge</span>
                  <span className="text-[10px] font-mono text-[#776c66]">STAFF-QR-DAVID</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQrBadgeLogin('STAFF-QR-PRIYA')}
                  className="p-2.5 rounded-xl bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-left transition-all"
                >
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 block w-max mb-1">
                    Manager
                  </span>
                  <span className="text-xs font-bold text-white block">GM Priya Badge</span>
                  <span className="text-[10px] font-mono text-[#776c66]">STAFF-QR-PRIYA</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQrBadgeLogin('STAFF-QR-ADMIN')}
                  className="p-2.5 rounded-xl bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-left transition-all"
                >
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 block w-max mb-1">
                    Admin
                  </span>
                  <span className="text-xs font-bold text-white block">System Admin Badge</span>
                  <span className="text-[10px] font-mono text-[#776c66]">STAFF-QR-ADMIN</span>
                </button>
              </div>
            </div>

            {/* Custom token input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={qrBadgeInput}
                onChange={(e) => setQrBadgeInput(e.target.value)}
                placeholder="Or type badge token (e.g. STAFF-QR-MARCO)"
                className="flex-1 bg-[#201d1e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
              />
              <button
                type="button"
                onClick={() => handleQrBadgeLogin(qrBadgeInput)}
                className="px-4 py-2 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-white text-xs font-bold font-['Syne',sans-serif] uppercase tracking-wider"
              >
                Verify
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: NFC CONTACTLESS TAP */}
        {authMethod === 'NFC_TAP' && (
          <div className="space-y-4">
            <div className="text-center p-6 rounded-2xl bg-[#201d1e] border border-white/10">
              <div className="relative w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-[#df8600]/20 animate-ping" />
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#df8600]/20 border border-[#df8600]/40 flex items-center justify-center text-[#ffb86d]">
                  <Radio className="w-8 h-8" />
                </div>
              </div>

              <h3 className="font-['Syne',sans-serif] text-sm font-bold uppercase text-white mb-1">
                Contactless NFC Badge Reader
              </h3>
              <p className="text-xs text-[#8f827d] max-w-xs mx-auto">
                {isWebNfcSupported 
                  ? 'Hardware NFC reader ready. Tap your physical badge to sign in instantly.'
                  : 'Hardware NFC reader simulated for desktop testing. Click any keycard below.'}
              </p>
              {nfcFeedback && (
                <div className="mt-3 text-[11px] font-mono text-[#ffb86d] bg-[#df8600]/10 border border-[#df8600]/20 py-1.5 px-3 rounded-lg">
                  {nfcFeedback}
                </div>
              )}
            </div>

            {/* One-Tap NFC Keycard Emulators */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8b8079] font-['Syne',sans-serif]">
                Tap Virtual Keycard
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleNfcTagLogin('NFC-STAFF-MARCO')}
                  className="p-2.5 rounded-xl bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-left transition-all"
                >
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#ff5708]/20 text-[#ff7a29] block w-max mb-1">
                    Kitchen
                  </span>
                  <span className="text-xs font-bold text-white block">Marco NFC Tag</span>
                  <span className="text-[10px] font-mono text-[#ffb86d]">NFC-STAFF-MARCO</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNfcTagLogin('NFC-STAFF-DAVID')}
                  className="p-2.5 rounded-xl bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-left transition-all"
                >
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 block w-max mb-1">
                    Floor
                  </span>
                  <span className="text-xs font-bold text-white block">David NFC Tag</span>
                  <span className="text-[10px] font-mono text-[#ffb86d]">NFC-STAFF-DAVID</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNfcTagLogin('NFC-STAFF-PRIYA')}
                  className="p-2.5 rounded-xl bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-left transition-all"
                >
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 block w-max mb-1">
                    Manager
                  </span>
                  <span className="text-xs font-bold text-white block">Priya NFC Tag</span>
                  <span className="text-[10px] font-mono text-[#ffb86d]">NFC-STAFF-PRIYA</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNfcTagLogin('NFC-STAFF-ADMIN')}
                  className="p-2.5 rounded-xl bg-[#201d1e] hover:bg-[#282425] border border-white/10 text-left transition-all"
                >
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 block w-max mb-1">
                    Admin
                  </span>
                  <span className="text-xs font-bold text-white block">Admin NFC Tag</span>
                  <span className="text-[10px] font-mono text-[#ffb86d]">NFC-STAFF-ADMIN</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Demo Roles PINs for Kitchen Terminals & Rapid Testing */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b8079] font-['Syne',sans-serif]">
              Terminal PIN Access
            </span>
            <span className="text-[10px] text-[#6b625d]">Direct 1-tap demo sign-in</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_STAFF_MEMBERS.slice(0, 4).map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  const pin = member.role === 'KITCHEN' ? '1111' :
                              member.role === 'STAFF' ? '2222' :
                              member.role === 'MANAGER' ? '3333' : '4444';
                  setEmail(member.email || '');
                  setPassword(pin);
                  handleQuickRoleLogin(member.role, pin);
                }}
                className="p-2.5 rounded-xl bg-[#201d1e] hover:bg-[#282425] border border-white/[0.08] hover:border-[#ff5708]/40 text-left transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider ${
                    member.role === 'KITCHEN' ? 'bg-[#ff5708]/20 text-[#ff7a29]' :
                    member.role === 'STAFF' ? 'bg-sky-500/20 text-sky-400' :
                    member.role === 'MANAGER' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {member.role}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5e5550] group-hover:text-white transition-colors" />
                </div>
                <div className="text-xs font-semibold text-white/90 truncate">
                  {member.displayName.split(' ')[0]}
                </div>
                <div className="text-[10px] text-[#7c726c] font-mono mt-0.5">
                  PIN: {member.role === 'KITCHEN' ? '1111' : member.role === 'STAFF' ? '2222' : member.role === 'MANAGER' ? '3333' : '4444'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Return to Customer App */}
        {onExitToCustomer && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onExitToCustomer}
              className="inline-flex items-center gap-2 text-xs text-[#a0948e] hover:text-white transition-colors cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5 text-[#ff5708]" />
              <span>Return to Customer Dining Experience</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#1a1718] border border-white/10 rounded-2xl p-6 shadow-2xl relative"
            >
              <h3 className="font-['Syne',sans-serif] text-base font-bold uppercase text-white mb-2">
                Staff Password Reset
              </h3>
              <p className="text-xs text-[#a39791] mb-4">
                Enter your staff email address to receive password recovery instructions via Supabase Auth.
              </p>

              {resetFeedback && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  {resetFeedback}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@kingsofwings.menu"
                  className="w-full bg-[#242022] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#685f5a] focus:outline-none focus:border-[#ff5708]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(false);
                      setResetFeedback(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#b5a9a3] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="flex-1 py-2.5 rounded-xl bg-[#ff5708] hover:bg-[#ff7a29] text-xs font-bold text-white transition-colors"
                  >
                    {isSubmittingReset ? 'Sending...' : 'Send Link'}
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