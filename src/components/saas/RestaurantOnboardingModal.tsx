import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Building2,
  Palette,
  Clock,
  LayoutGrid,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Store,
  MapPin,
  Check,
  AlertCircle,
} from 'lucide-react';
import { RestaurantOnboardingData } from '../../types/saas';
import { tenantService } from '../../services/saas/tenantService';
import { useStaffAuth } from '../../contexts/StaffAuthContext';

interface RestaurantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (restaurantId: string) => void;
}

export const RestaurantOnboardingModal: React.FC<RestaurantOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { switchRestaurant, refreshMemberships } = useStaffAuth();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<RestaurantOnboardingData>({
    restaurantName: '',
    legalEntityName: '',
    slug: '',
    country: 'India',
    state: 'Tamil Nadu',
    city: 'Chennai',
    address: '',
    phone: '',
    email: '',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    currencySymbol: '₹',
    primaryColor: '#ff5708',
    secondaryColor: '#ffb86d',
    tagline: 'Flame-Kissed Smoked Craft Wings',
    operatingHours: {
      monday: { open: '11:00', close: '23:00', closed: false },
      tuesday: { open: '11:00', close: '23:00', closed: false },
      wednesday: { open: '11:00', close: '23:00', closed: false },
      thursday: { open: '11:00', close: '23:00', closed: false },
      friday: { open: '11:00', close: '00:00', closed: false },
      saturday: { open: '11:00', close: '00:00', closed: false },
      sunday: { open: '11:00', close: '23:00', closed: false },
    },
    gstOrTaxNumber: '33AAAAA1111A1Z1',
    gstPercent: 5.0,
    tableCount: 12,
    menuTemplate: 'WINGS_SMOKEHOUSE',
  });

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData((prev) => ({
      ...prev,
      restaurantName: name,
      slug: prev.slug === '' || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug,
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.restaurantName.trim()) {
        setError('Restaurant name is required.');
        return false;
      }
      if (!formData.slug.trim()) {
        setError('URL Slug identifier is required.');
        return false;
      }
      if (!formData.city.trim() || !formData.address.trim()) {
        setError('City and Address are required.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(5, s + 1));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await tenantService.createRestaurantFromOnboarding(formData);
      if (res.success && res.restaurant) {
        await refreshMemberships();
        await switchRestaurant(res.restaurant.id);
        onSuccess?.(res.restaurant.id);
        onClose();
      } else {
        setError(res.error || 'Failed to onboard restaurant.');
      }
    } catch (err: any) {
      setError(err.message || 'Onboarding error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#171415] border border-white/[0.12] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-white/[0.08] bg-[#1d1a1b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff5708]/20 border border-[#ff5708]/30 flex items-center justify-center">
              <Store className="w-5 h-5 text-[#ff5708]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ffb86d] font-bold">
                Phase 9 · SaaS Tenant Provisioning
              </span>
              <h2 className="text-lg font-black text-white font-['Syne',sans-serif]">
                Onboard New Restaurant Branch
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-[#938680] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-6 py-3 border-b border-white/[0.06] bg-[#121011] flex items-center justify-between overflow-x-auto">
          {[
            { num: 1, label: 'Info & Location', icon: Building2 },
            { num: 2, label: 'Brand & Color', icon: Palette },
            { num: 3, label: 'Hours & Tax', icon: Clock },
            { num: 4, label: 'Tables & Menu', icon: LayoutGrid },
            { num: 5, label: 'Review & Launch', icon: CheckCircle2 },
          ].map((item) => {
            const Icon = item.icon;
            const isCompleted = step > item.num;
            const isCurrent = step === item.num;
            return (
              <div
                key={item.num}
                className={`flex items-center gap-2 text-xs font-bold whitespace-nowrap ${
                  isCurrent
                    ? 'text-[#ff5708]'
                    : isCompleted
                    ? 'text-emerald-400'
                    : 'text-[#6a5e59]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${
                    isCurrent
                      ? 'bg-[#ff5708] text-white shadow-[0_0_12px_rgba(255,87,8,0.5)]'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/[0.05] text-[#6a5e59]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : item.num}
                </div>
                <span className="hidden sm:inline">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: RESTAURANT INFO */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                  Restaurant / Branch Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., WingHouse — Anna Nagar Pit"
                  value={formData.restaurantName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff5708] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                  URL Slug (Live QR Routing) *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-white/[0.04] border border-r-0 border-white/[0.1] rounded-l-xl text-xs text-[#8e817b] font-mono">
                    https://app.menu/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                    }
                    className="flex-1 px-4 py-2.5 rounded-r-xl bg-black/40 border border-white/[0.1] text-white font-mono text-xs focus:outline-none focus:border-[#ff5708]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                  Full Street Address *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 18 2nd Avenue, Anna Nagar Roundtana, Chennai 600040"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 44 2621 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                    Branch Email
                  </label>
                  <input
                    type="email"
                    placeholder="branch@winghouse.menu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BRANDING */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                  Tagline / Header Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Blazing Heat & Craft Beers — Table-Side Ordering"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-2">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono text-xs w-28"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-2">
                    Secondary Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, secondaryColor: e.target.value })
                      }
                      className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, secondaryColor: e.target.value })
                      }
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono text-xs w-28"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Preview Card */}
              <div
                className="p-5 rounded-2xl border"
                style={{
                  backgroundColor: '#161415',
                  borderColor: formData.primaryColor + '40',
                }}
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8e817b] block mb-2">
                  Live Customer View Preview
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4
                      className="text-base font-black font-['Syne',sans-serif]"
                      style={{ color: formData.primaryColor }}
                    >
                      {formData.restaurantName || 'Restaurant Name'}
                    </h4>
                    <p className="text-xs text-[#cfc5bf]">
                      {formData.tagline || 'Craft Pitmaster Experience'}
                    </p>
                  </div>
                  <button
                    type="button"
                    style={{ backgroundColor: formData.primaryColor }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-lg"
                  >
                    View Menu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: HOURS & TAX */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                    GST / VAT Tax Number
                  </label>
                  <input
                    type="text"
                    value={formData.gstOrTaxNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, gstOrTaxNumber: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                    Default GST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.gstPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, gstPercent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-2">
                  Operating Shift Hours
                </label>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2 text-xs">
                  {['monday', 'wednesday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="flex items-center justify-between text-zinc-300">
                      <span className="capitalize font-bold w-28">{day}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400">11:00 AM — 11:30 PM</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                          Open
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TABLES & MENU TEMPLATE */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-1">
                  Initial Dining Tables Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.tableCount}
                  onChange={(e) =>
                    setFormData({ ...formData, tableCount: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm"
                />
                <span className="text-[11px] text-[#8e817b] mt-1 block">
                  Creates QR table records 01 through {formData.tableCount.toString().padStart(2, '0')}.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#b5a7a1] uppercase mb-2">
                  Starter Menu Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'WINGS_SMOKEHOUSE',
                      title: 'Smoked Wings & Pitmaster',
                      desc: 'Wings, Platters, Loaded Fries & Cold Brews',
                    },
                    {
                      id: 'BURGER_CRAFT',
                      title: 'Artisan Burgers & Taps',
                      desc: 'Smashed Patties, Shakes & Sliders',
                    },
                    {
                      id: 'EMPTY',
                      title: 'Empty Canvas',
                      desc: 'Start with blank menu categories',
                    },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          menuTemplate: tpl.id as any,
                        })
                      }
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        formData.menuTemplate === tpl.id
                          ? 'bg-[#ff5708]/15 border-[#ff5708] text-white'
                          : 'bg-black/30 border-white/[0.08] text-[#8e817b] hover:border-white/[0.2]'
                      }`}
                    >
                      <h5 className="text-xs font-bold text-white mb-1">{tpl.title}</h5>
                      <p className="text-[10px] leading-relaxed">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & LAUNCH */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-black/50 border border-white/[0.1] space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="text-[10px] font-mono text-[#8e817b] uppercase">
                      New Branch Name
                    </span>
                    <h3 className="text-base font-black text-white font-['Syne',sans-serif]">
                      {formData.restaurantName}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Ready to Provision
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#8e817b] block">Slug / URL:</span>
                    <span className="font-mono text-white">/{formData.slug}</span>
                  </div>
                  <div>
                    <span className="text-[#8e817b] block">Location:</span>
                    <span className="text-white">
                      {formData.city}, {formData.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8e817b] block">Initial Tables:</span>
                    <span className="text-white">{formData.tableCount} Tables (Auto QR)</span>
                  </div>
                  <div>
                    <span className="text-[#8e817b] block">Starter Menu:</span>
                    <span className="text-white font-mono">{formData.menuTemplate}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#8e817b] leading-relaxed">
                Clicking <strong className="text-white">Launch Restaurant Branch</strong> will provision the
                isolated multi-tenant schema, seed starter categories and tables, configure branding, and immediately
                switch your staff console to this new operational tenant.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/[0.08] bg-[#1d1a1b] flex items-center justify-between">
          <button
            type="button"
            onClick={step === 1 ? onClose : handleBack}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#b5a7a1] hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-1.5"
          >
            {step > 1 && <ChevronLeft className="w-4 h-4" />}
            <span>{step === 1 ? 'Cancel' : 'Back'}</span>
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#ff5708] hover:bg-[#e04c06] shadow-[0_4px_16px_rgba(255,87,8,0.4)] transition-all flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#ff5708] to-[#ff7d3b] hover:opacity-90 shadow-[0_4px_20px_rgba(255,87,8,0.5)] transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Provisioning Tenant...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Launch Restaurant Branch</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
