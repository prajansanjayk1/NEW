import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  ClipboardList, 
  ChefHat, 
  Layers, 
  Bell, 
  UtensilsCrossed, 
  Users, 
  TrendingUp, 
  Receipt, 
  Settings, 
  Flame, 
  LogOut, 
  Utensils, 
  Clock, 
  Shield, 
  ChevronRight, 
  Menu as MenuIcon, 
  X,
  Lock,
  Wifi,
  Sparkles,
  Package,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  StaffPortalTab, 
  UserRole,
  ExtendedUserRole,
  Order, 
  ServiceRequest, 
  RestaurantTable, 
  Restaurant, 
  TableStatus, 
  OrderStatus 
} from '../../types';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { OperationsOverviewView } from './OperationsOverviewView';
import { StaffOrdersView } from './StaffOrdersView';
import { StaffKitchenView } from './StaffKitchenView';
import { StaffTablesView } from './StaffTablesView';
import { StaffServiceView } from './StaffServiceView';
import { StaffMenuView } from './StaffMenuView';
import { StaffTakeawayQueueView } from './StaffTakeawayQueueView';
import { StaffTakeawayMenuView } from './StaffTakeawayMenuView';
import { StaffTeamView } from './StaffTeamView';
import { StaffAnalyticsView } from './StaffAnalyticsView';
import { StaffBillingView } from './StaffBillingView';
import { StaffSettingsView } from './StaffSettingsView';
import { StaffCopilotView } from './StaffCopilotView';
import { StaffInventoryView } from './StaffInventoryView';
import { StaffRecipesView } from './StaffRecipesView';
import { RestaurantSwitcher } from '../saas/RestaurantSwitcher';
import { RestaurantOnboardingModal } from '../saas/RestaurantOnboardingModal';
import { PlatformAdminConsole } from '../saas/PlatformAdminConsole';
import { ProductionReadinessView } from '../saas/ProductionReadinessView';
import { RestaurantOnboardingChecklistView } from '../saas/RestaurantOnboardingChecklistView';

interface StaffShellProps {
  restaurant: Restaurant;
  orders: Order[];
  serviceRequests: ServiceRequest[];
  tables: RestaurantTable[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateTableStatus: (tableId: string, status: TableStatus) => void;
  onResolveServiceRequest: (requestId: string) => void;
  onAcknowledgeServiceRequest?: (requestId: string) => void;
  onExitToCustomer: () => void;
}

interface NavItemConfig {
  tab: StaffPortalTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  allowedRoles: UserRole[];
  badgeCount?: number;
}

export const StaffShell: React.FC<StaffShellProps> = ({
  restaurant,
  orders,
  serviceRequests,
  tables,
  onUpdateOrderStatus,
  onUpdateTableStatus,
  onResolveServiceRequest,
  onAcknowledgeServiceRequest,
  onExitToCustomer,
}) => {
  const { currentStaff, logout, switchRole, userRole } = useStaffAuth();

  // Initial tab based on role
  const getDefaultTabForRole = (role: ExtendedUserRole): StaffPortalTab => {
    switch (role) {
      case 'KITCHEN': return 'KITCHEN';
      case 'STAFF': return 'ORDERS';
      case 'MANAGER':
      case 'ADMIN':
      case 'PLATFORM_ADMIN': return 'OVERVIEW';
      default: return 'OVERVIEW';
    }
  };

  const [activeTab, setActiveTab] = useState<StaffPortalTab>(() => getDefaultTabForRole(userRole));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showPlatformConsole, setShowPlatformConsole] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update tab if role changed and current tab is not allowed
  useEffect(() => {
    const allowed = isTabAllowed(activeTab, userRole);
    if (!allowed) {
      setActiveTab(getDefaultTabForRole(userRole));
    }
  }, [userRole]);

  const openRequestsCount = serviceRequests.filter((r) => r.status !== 'COMPLETED').length;
  const activeOrdersCount = orders.filter((o) => o.status !== 'DELIVERED').length;
  const occupiedTablesCount = tables.filter((t) => t.status !== 'AVAILABLE' && t.status !== 'CLOSED').length;

  const navItems: NavItemConfig[] = [
    {
      tab: 'OVERVIEW',
      label: 'Overview',
      icon: LayoutGrid,
      allowedRoles: ['MANAGER', 'ADMIN'],
    },
    {
      tab: 'ORDERS',
      label: 'Live Orders',
      icon: ClipboardList,
      allowedRoles: ['STAFF', 'MANAGER', 'ADMIN'],
      badgeCount: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    {
      tab: 'KITCHEN',
      label: 'Kitchen Pit & KDS',
      icon: ChefHat,
      allowedRoles: ['KITCHEN', 'STAFF', 'MANAGER', 'ADMIN'],
      badgeCount: activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    {
      tab: 'TABLES',
      label: 'Floor & Tables',
      icon: Layers,
      allowedRoles: ['STAFF', 'MANAGER', 'ADMIN'],
      badgeCount: occupiedTablesCount > 0 ? occupiedTablesCount : undefined,
    },
    {
      tab: 'SERVICE',
      label: 'Service Calls',
      icon: Bell,
      allowedRoles: ['STAFF', 'MANAGER', 'ADMIN'],
      badgeCount: openRequestsCount > 0 ? openRequestsCount : undefined,
    },
    {
      tab: 'TAKEAWAY_QUEUE',
      label: 'Pickup Counter',
      icon: ShoppingBag,
      allowedRoles: ['STAFF', 'KITCHEN', 'MANAGER', 'ADMIN'],
    },
    {
      tab: 'TAKEAWAY_MENU',
      label: 'Takeaway Pricing',
      icon: ShoppingBag,
      allowedRoles: ['MANAGER', 'ADMIN'],
    },
    {
      tab: 'MENU',
      label: 'Menu & Stock',
      icon: UtensilsCrossed,
      allowedRoles: ['MANAGER', 'ADMIN'],
    },
    {
      tab: 'INVENTORY',
      label: 'Inventory & Stock',
      icon: Package,
      allowedRoles: ['STAFF', 'KITCHEN', 'MANAGER', 'ADMIN'],
    },
    {
      tab: 'RECIPES',
      label: 'Recipes & Costing',
      icon: BookOpen,
      allowedRoles: ['KITCHEN', 'MANAGER', 'ADMIN'],
    },
    {
      tab: 'TEAM',
      label: 'Team & Roster',
      icon: Users,
      allowedRoles: ['MANAGER', 'ADMIN'],
    },
    {
      tab: 'ANALYTICS',
      label: 'Analytics',
      icon: TrendingUp,
      allowedRoles: ['MANAGER', 'ADMIN'],
    },
    {
      tab: 'AI_COPILOT',
      label: 'AI Copilot',
      icon: Sparkles,
      allowedRoles: ['MANAGER', 'ADMIN', 'STAFF'],
    },
    {
      tab: 'BILLING',
      label: 'Billing & Bills',
      icon: Receipt,
      allowedRoles: ['MANAGER', 'ADMIN'],
    },
    {
      tab: 'SETTINGS',
      label: 'Settings',
      icon: Settings,
      allowedRoles: ['ADMIN'],
    },
    {
      tab: 'READINESS',
      label: 'Prod Readiness',
      icon: ShieldCheck,
      allowedRoles: ['MANAGER', 'ADMIN'],
    },
    {
      tab: 'CHECKLIST',
      label: 'Onboarding Checklist',
      icon: CheckSquare,
      allowedRoles: ['MANAGER', 'ADMIN'],
    },
  ];

  function isTabAllowed(tab: StaffPortalTab, role: UserRole | ExtendedUserRole): boolean {
    if (role === 'PLATFORM_ADMIN') return true;
    const item = navItems.find((n) => n.tab === tab);
    return item ? item.allowedRoles.includes(role as UserRole) : false;
  }

  const roleTheme: Record<ExtendedUserRole, { badge: string; border: string }> = {
    CUSTOMER: { badge: 'bg-white/10 text-white', border: 'border-white/20' },
    KITCHEN: { badge: 'bg-[#ff5708]/20 text-[#ff7a29]', border: 'border-[#ff5708]/40' },
    STAFF: { badge: 'bg-sky-500/20 text-sky-400', border: 'border-sky-500/40' },
    MANAGER: { badge: 'bg-amber-500/20 text-amber-400', border: 'border-amber-500/40' },
    ADMIN: { badge: 'bg-purple-500/20 text-purple-400', border: 'border-purple-500/40' },
    PLATFORM_ADMIN: { badge: 'bg-indigo-500/20 text-indigo-300', border: 'border-indigo-500/40' },
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'OVERVIEW':
        return (
          <OperationsOverviewView
            orders={orders}
            serviceRequests={serviceRequests}
            tables={tables}
            onNavigateTab={setActiveTab}
          />
        );
      case 'ORDERS':
        return (
          <StaffOrdersView
            orders={orders}
            onUpdateOrderStatus={onUpdateOrderStatus}
            userRole={userRole}
          />
        );
      case 'KITCHEN':
        return (
          <StaffKitchenView
            orders={orders}
            onUpdateOrderStatus={onUpdateOrderStatus}
            userRole={userRole}
          />
        );
      case 'TABLES':
        return (
          <StaffTablesView
            tables={tables}
            orders={orders}
            serviceRequests={serviceRequests}
            onUpdateTableStatus={onUpdateTableStatus}
            userRole={userRole}
          />
        );
      case 'SERVICE':
        return (
          <StaffServiceView
            serviceRequests={serviceRequests}
            onAcknowledgeRequest={onAcknowledgeServiceRequest}
            onResolveRequest={onResolveServiceRequest}
            userRole={userRole}
          />
        );
      case 'TAKEAWAY_QUEUE':
        return <StaffTakeawayQueueView />;
      case 'TAKEAWAY_MENU':
        return <StaffTakeawayMenuView />;
      case 'MENU':
        return <StaffMenuView userRole={userRole} />;
      case 'INVENTORY':
        return (
          <StaffInventoryView
            userRole={userRole}
            onNavigateToRecipes={() => setActiveTab('RECIPES')}
          />
        );
      case 'RECIPES':
        return (
          <StaffRecipesView
            userRole={userRole}
            onNavigateToInventory={() => setActiveTab('INVENTORY')}
          />
        );
      case 'TEAM':
        return <StaffTeamView userRole={userRole} currentUserId={currentStaff?.id || ''} />;
      case 'ANALYTICS':
        return <StaffAnalyticsView userRole={userRole} />;
      case 'AI_COPILOT':
        return (
          <StaffCopilotView
            restaurant={restaurant}
            orders={orders}
            serviceRequests={serviceRequests}
            tables={tables}
          />
        );
      case 'BILLING':
        return <StaffBillingView userRole={userRole} />;
      case 'SETTINGS':
        return <StaffSettingsView restaurant={restaurant} userRole={userRole} />;
      case 'READINESS':
        return <ProductionReadinessView />;
      case 'CHECKLIST':
        return <RestaurantOnboardingChecklistView />;
      default:
        return null;
    }
  };

  if (showPlatformConsole) {
    return (
      <>
        <PlatformAdminConsole
          onBackToStaff={() => setShowPlatformConsole(false)}
          onOpenOnboarding={() => setShowOnboardingModal(true)}
        />
        <RestaurantOnboardingModal
          isOpen={showOnboardingModal}
          onClose={() => setShowOnboardingModal(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0b0c] text-[#f4efe6] flex font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#ff5708] selection:text-white">
      {/* DESKTOP SIDEBAR (1024px+) */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#141213] border-r border-white/[0.08] flex-shrink-0 z-30">
        {/* Brand Banner */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff5708] to-[#b83200] flex items-center justify-center shadow-[0_0_20px_rgba(255,87,8,0.4)]">
              <Flame className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="font-['Syne',sans-serif] font-black text-sm uppercase tracking-wider text-white">
                KINGS OF WINGS
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-[#8c807b] font-bold">
                  Live Operations
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Profile Card in Sidebar */}
        <div className="p-4 border-b border-white/[0.08] bg-[#181516]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#ff5708]/20 border border-[#ff5708]/30 flex items-center justify-center text-xs font-bold text-white font-['Syne',sans-serif]">
                {(currentStaff?.displayName || 'Staff').charAt(0)}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate max-w-[120px]">
                  {currentStaff?.displayName || 'Active Staff'}
                </div>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded tracking-wider ${roleTheme[userRole].badge}`}>
                  {userRole}
                </span>
              </div>
            </div>

            {/* Quick Demo Role Switcher Dropdown */}
            <select
              value={userRole}
              onChange={(e) => switchRole(e.target.value as any)}
              className="bg-[#221f20] border border-white/10 rounded-lg text-[10px] font-bold text-[#b5a8a1] px-1.5 py-1 focus:outline-none focus:border-[#ff5708]"
              title="Quick test role switcher"
            >
              <option value="KITCHEN">Kitchen</option>
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
            </select>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isAllowed = isTabAllowed(item.tab, userRole);
            const isActive = activeTab === item.tab;
            const Icon = item.icon;

            if (!isAllowed) {
              return null; // Don't show inaccessible tabs to keep kitchen / staff focused
            }

            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all font-['Syne',sans-serif] ${
                  isActive
                    ? 'bg-[#ff5708] text-white shadow-[0_4px_16px_rgba(255,87,8,0.3)]'
                    : 'text-[#9c908a] hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#80746e]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-black/30 text-white' : 'bg-[#ff5708] text-white animate-pulse'
                  }`}>
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/[0.08] space-y-1">
          <button
            type="button"
            onClick={onExitToCustomer}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#a89d97] hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <Utensils className="w-4 h-4 text-[#ff5708]" />
            <span>Customer Dining Mode</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Terminal</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Operational Bar */}
        <header className="h-16 border-b border-white/[0.08] bg-[#141213]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-['Syne',sans-serif] font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <span>{navItems.find((n) => n.tab === activeTab)?.label || 'Dashboard'}</span>
              </h2>
              <span className="text-[10px] text-[#7d716c] hidden sm:inline">
                {restaurant?.name || 'Kings of Wings'} Operations Console
              </span>
            </div>

            {/* Tenant Restaurant Switcher */}
            <div className="hidden md:block ml-2">
              <RestaurantSwitcher
                onOpenOnboarding={() => setShowOnboardingModal(true)}
                onOpenPlatformAdmin={() => setShowPlatformConsole(true)}
              />
            </div>
          </div>

          {/* Right Header Metrics & Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Platform Console Launcher for Admin / Platform Admin */}
            {(userRole === 'ADMIN' || userRole === 'PLATFORM_ADMIN') && (
              <button
                type="button"
                onClick={() => setShowPlatformConsole(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold font-['Syne',sans-serif] transition-colors"
                title="Open SaaS Platform Admin Console"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Platform</span>
              </button>
            )}

            {/* Live Clock */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-white/90">
              <Clock className="w-3.5 h-3.5 text-[#ff7a29]" />
              <span>{currentTime}</span>
            </div>

            {/* Customer view toggle */}
            <button
              type="button"
              onClick={onExitToCustomer}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-colors font-['Syne',sans-serif]"
            >
              <Utensils className="w-3.5 h-3.5 text-[#ff5708]" />
              <span className="hidden sm:inline">Guest View</span>
            </button>

            {/* Sign out */}
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-[#a0948e] hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActiveTabContent()}
        </main>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 bg-[#141213] border-r border-white/10 h-full flex flex-col justify-between p-4 z-10 shadow-2xl"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-6 h-6 text-[#ff5708] fill-[#ff5708]" />
                    <span className="font-['Syne',sans-serif] font-black uppercase tracking-wider text-white text-sm">
                      KOW STAFF
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-lg bg-white/5 text-[#a0948e]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isAllowed = isTabAllowed(item.tab, userRole);
                    if (!isAllowed) return null;
                    const isActive = activeTab === item.tab;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.tab}
                        onClick={() => {
                          setActiveTab(item.tab);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors font-['Syne',sans-serif] ${
                          isActive ? 'bg-[#ff5708] text-white' : 'text-[#a0948e] hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badgeCount && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff5708] text-white">
                            {item.badgeCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2">
                <div className="py-1">
                  <RestaurantSwitcher
                    onOpenOnboarding={() => {
                      setIsMobileMenuOpen(false);
                      setShowOnboardingModal(true);
                    }}
                    onOpenPlatformAdmin={() => {
                      setIsMobileMenuOpen(false);
                      setShowPlatformConsole(true);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onExitToCustomer();
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Exit to Customer View
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RestaurantOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
      />
    </div>
  );
};
