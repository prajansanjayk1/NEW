import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Sparkles, 
  Building2, 
  MapPin, 
  Clock, 
  QrCode, 
  UtensilsCrossed, 
  ChefHat, 
  Package, 
  Truck, 
  Users, 
  ShieldAlert, 
  Tv, 
  Receipt, 
  CreditCard, 
  Bot, 
  Palette, 
  Percent, 
  ShoppingBag, 
  FileCheck, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useStaffAuth } from '../../contexts/StaffAuthContext';

interface ChecklistItem {
  id: string;
  label: string;
  category: 'SETUP' | 'FLOOR' | 'CULINARY' | 'PEOPLE' | 'FINANCE' | 'VERIFICATION';
  description: string;
  icon: React.ElementType;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  // Setup & Location
  {
    id: 'rest_created',
    label: 'Restaurant Created',
    category: 'SETUP',
    description: 'Establish unique branch UUID, code, and slug in the organization tenant index.',
    icon: Building2,
  },
  {
    id: 'biz_info',
    label: 'Business Information',
    category: 'SETUP',
    description: 'Set legal business name, registered entity details, contact email, and official phone.',
    icon: FileCheck,
  },
  {
    id: 'address',
    label: 'Address & Geo-coordinates',
    category: 'SETUP',
    description: 'Configure street address, postal code, and dining delivery zone parameters.',
    icon: MapPin,
  },
  {
    id: 'hours',
    label: 'Operating Hours',
    category: 'SETUP',
    description: 'Define service windows, lunch/dinner rush periods, and holiday exception schedules.',
    icon: Clock,
  },
  {
    id: 'branding',
    label: 'Branding & Theme Colors',
    category: 'SETUP',
    description: 'Upload high-resolution logo, set primary ember accent colors, and custom receipt headers.',
    icon: Palette,
  },
  {
    id: 'tax_config',
    label: 'Tax / GST Configuration',
    category: 'SETUP',
    description: 'Set 5% restaurant GST, CGST/SGST breakdowns, and optional service charge percentage.',
    icon: Percent,
  },

  // Floor & Hardware
  {
    id: 'tables',
    label: 'Tables & Seating Plan',
    category: 'FLOOR',
    description: 'Map out dining tables, VIP booths, and patio seating with floor capacity.',
    icon: UtensilsCrossed,
  },
  {
    id: 'qr_codes',
    label: 'QR Codes & NFC Tokens',
    category: 'FLOOR',
    description: 'Generate and print cryptographic QR table tokens for zero-app dining sessions.',
    icon: QrCode,
  },
  {
    id: 'kds',
    label: 'Kitchen Display System (KDS)',
    category: 'FLOOR',
    description: 'Mount kitchen screens for Fry, Grill, and Expo stations with real-time ticket sync.',
    icon: Tv,
  },

  // Culinary & Inventory
  {
    id: 'menu',
    label: 'Menu Items & Modifiers',
    category: 'CULINARY',
    description: 'Populate wings, sauces, heat levels (Scoville SHU), combos, and allergen tags.',
    icon: UtensilsCrossed,
  },
  {
    id: 'recipes',
    label: 'Recipe Ingredient Specs',
    category: 'CULINARY',
    description: 'Link BOM yields (grams of chicken, ml of glaze) for automated stock depletion.',
    icon: ChefHat,
  },
  {
    id: 'inventory',
    label: 'Initial Stock Count',
    category: 'CULINARY',
    description: 'Count walk-in cooler raw wings, fry oils, craft sodas, and packaging cartons.',
    icon: Package,
  },
  {
    id: 'suppliers',
    label: 'Suppliers & Vendor Directory',
    category: 'CULINARY',
    description: 'Add wholesale poultry, sauce blend, and produce vendors with contact details.',
    icon: Truck,
  },

  // Team & Governance
  {
    id: 'staff',
    label: 'Staff Roster & Pins',
    category: 'PEOPLE',
    description: 'Add line cooks, servers, and shift supervisors with individual 4-digit POS pins.',
    icon: Users,
  },
  {
    id: 'roles',
    label: 'Roles & Access Controls',
    category: 'PEOPLE',
    description: 'Grant role privileges (Admin, Manager, Staff, Kitchen, Customer) per branch.',
    icon: ShieldAlert,
  },

  // Finance & Payments
  {
    id: 'billing',
    label: 'Billing & Split-Payment Rules',
    category: 'FINANCE',
    description: 'Configure equal split, by-item split, and custom tip distribution policies.',
    icon: Receipt,
  },
  {
    id: 'payment_config',
    label: 'Payment Gateway Configuration',
    category: 'FINANCE',
    description: 'Connect Razorpay API Key ID and Key Secret with UPI, Card, and NetBanking routing.',
    icon: CreditCard,
  },

  // Verification & Launch
  {
    id: 'ai_config',
    label: 'AI Concierge & Copilot Setup',
    category: 'VERIFICATION',
    description: 'Calibrate Gemini 2.5 Flash heat recommendation prompts and inventory alerts.',
    icon: Bot,
  },
  {
    id: 'test_order',
    label: 'End-to-End Test Order',
    category: 'VERIFICATION',
    description: 'Place a guest order from Table 01 through KDS line to mark as DELIVERED.',
    icon: ShoppingBag,
  },
  {
    id: 'test_payment',
    label: 'Live / Sandbox Test Payment',
    category: 'VERIFICATION',
    description: 'Verify HMAC SHA-256 signature verification and digital receipt generation.',
    icon: CreditCard,
  },
  {
    id: 'prod_readiness',
    label: 'Production Readiness Certification',
    category: 'VERIFICATION',
    description: 'Verify security test suite, RLS policies, zero secret leaks, and live uptime.',
    icon: Sparkles,
  },
];

export const RestaurantOnboardingChecklistView: React.FC = () => {
  const { restaurant } = useStaffAuth();
  const storageKey = `tenant_onboarding_checklist_${restaurant?.id || 'default'}`;

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Default initial checked items for demo restaurant
    return {
      rest_created: true,
      biz_info: true,
      address: true,
      hours: true,
      branding: true,
      tax_config: true,
      tables: true,
      qr_codes: true,
      kds: true,
      menu: true,
      recipes: true,
      inventory: true,
      suppliers: true,
      staff: true,
      roles: true,
      billing: true,
      payment_config: true,
      ai_config: true,
      test_order: true,
      test_payment: true,
      prod_readiness: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checkedItems));
    } catch (err) {
      console.warn('Failed to save checklist state', err);
    }
  }, [checkedItems, storageKey]);

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedCount = DEFAULT_ITEMS.filter((i) => checkedItems[i.id]).length;
  const totalCount = DEFAULT_ITEMS.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  const handleSelectAll = () => {
    const allChecked: Record<string, boolean> = {};
    DEFAULT_ITEMS.forEach((i) => (allChecked[i.id] = true));
    setCheckedItems(allChecked);
  };

  const handleReset = () => {
    setCheckedItems({});
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#181516] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#ff5708]/20 text-[#ff7a29] border border-[#ff5708]/30">
              <CheckSquare className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black font-['Syne',sans-serif] text-white">
                Restaurant Branch Onboarding Checklist
              </h2>
              <p className="text-xs text-[#b5a8a1] mt-0.5">
                Route: <code className="text-[#ff7a29] font-mono">/platform/onboarding/checklist</code> · Location:{' '}
                <strong className="text-white">{restaurant?.name || 'Kings of Wings (Bengaluru)'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Progress Display & Quick Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="sm:text-right">
            <div className="text-2xl font-black font-['Syne',sans-serif] text-[#ff7a29]">
              {progressPercentage}%
            </div>
            <div className="text-[11px] font-bold text-[#8c7e77] uppercase tracking-wider">
              {completedCount} of {totalCount} Steps Completed
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition-colors"
            >
              Mark All Done
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#8c7e77] hover:text-white border border-white/10 transition-colors"
              title="Reset Checklist"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/[0.04] h-2.5 rounded-full overflow-hidden border border-white/[0.06]">
        <div
          className="h-full bg-gradient-to-r from-[#ff5708] to-[#df8600] transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Checklist Items Grouped */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {DEFAULT_ITEMS.map((item) => {
          const isDone = Boolean(checkedItems[item.id]);
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3.5 ${
                isDone
                  ? 'bg-emerald-500/[0.04] border-emerald-500/25 hover:border-emerald-500/40'
                  : 'bg-[#151314] border-white/[0.06] hover:border-white/20'
              }`}
            >
              <button
                type="button"
                className={`p-1 rounded-md transition-colors mt-0.5 flex-shrink-0 ${
                  isDone ? 'text-emerald-400' : 'text-[#8c7e77]'
                }`}
              >
                {isDone ? <CheckSquare className="w-5 h-5 fill-emerald-500/20" /> : <Square className="w-5 h-5" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-400' : 'text-[#ff7a29]'}`} />
                  <span
                    className={`text-sm font-bold font-['Syne',sans-serif] ${
                      isDone ? 'text-white line-through opacity-90' : 'text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-white/[0.04] text-[#8c7e77] uppercase ml-auto">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-[#a89b94] mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Banner if 100% */}
      {progressPercentage === 100 && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-4 text-emerald-300 text-xs font-['Syne',sans-serif]">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <div>
            <strong className="text-sm font-bold text-white block">
              All 21 Onboarding Milestones Verified
            </strong>
            This restaurant location meets all commercial SaaS launch requirements and is certified for live customer dining, real-time KDS line routing, and digital payments.
          </div>
        </div>
      )}
    </div>
  );
};
