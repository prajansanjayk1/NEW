import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppScreen, SessionParticipant } from './types';
import { useTableSession } from './hooks/useTableSession';
import { useCart } from './hooks/useCart';
import { useOrders } from './hooks/useOrders';
import { useCrew } from './hooks/useCrew';
import { useServiceRequests } from './hooks/useServiceRequests';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TableWelcomeView } from './components/TableWelcomeView';
import { ExploreMenuView } from './components/ExploreMenuView';
import { LiveFireTrackerView } from './components/LiveFireTrackerView';
import { CartDrawer } from './components/CartDrawer';
import { CrewModal } from './components/CrewModal';
import { BillSplitModal } from './components/BillSplitModal';
import { WingConciergeModal } from './components/WingConciergeModal';
import { ServiceRequestModal } from './components/ServiceRequestModal';
import { TableLobbyModal } from './components/TableLobbyModal';
import { StaffLoginPage } from './components/staff/StaffLoginPage';
import { StaffShell } from './components/staff/StaffShell';
import { TakeawayExperience } from './components/takeaway/TakeawayExperience';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { OnboardingGatewayModal } from './components/OnboardingGatewayModal';
import { RestaurantOnboardingModal } from './components/saas/RestaurantOnboardingModal';
import { RestaurantOnboardingChecklistView } from './components/saas/RestaurantOnboardingChecklistView';
import { StaffAuthProvider, StaffAuthContext, useStaffAuth } from './contexts/StaffAuthContext';
import { Bell, Check, Sparkles, Smartphone, Shield, Crown, Radio, Zap, HelpCircle, Store, CheckSquare, X } from 'lucide-react';

type PortalMode = 'customer' | 'staff' | 'admin';

const getInitialPortal = (): PortalMode => {
  if (typeof window === 'undefined') return 'customer';
  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const portalParam = search.get('portal')?.toLowerCase();
  if (path === '/admin' || portalParam === 'admin') return 'admin';
  if (path === '/staff' || portalParam === 'staff') return 'staff';
  return 'customer';
};

function TableAppContent() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('WELCOME');
  const [portal, setPortal] = useState<PortalMode>(getInitialPortal);
  const [salesChannel, setSalesChannel] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [isSparkAIOpen, setIsSparkAIOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isLobbyModalOpen, setIsLobbyModalOpen] = useState(false);
  const [nfcBanner, setNfcBanner] = useState<string | null>(null);

  // Modal states for Customer Login, Onboarding Tour & Restaurant Wizards
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);
  const [isOnboardingGatewayOpen, setIsOnboardingGatewayOpen] = useState(false);
  const [isRestaurantWizardOpen, setIsRestaurantWizardOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  // Staff Authentication state
  const { isAuthenticated, userRole: staffRole } = useStaffAuth();

  // Table Session State & Permissions Hook
  const {
    restaurant,
    tables,
    session,
    currentParticipant,
    userRole,
    sessionError,
    joinSession,
    switchRole,
    updateSessionStatus,
    simulateSessionScan,
    resetDemoSession,
    updateTableFloorStatus,
  } = useTableSession();

  // Modular custom hooks wired to the session context
  const {
    cart,
    myItems,
    participantGroups,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
  } = useCart(currentParticipant);

  const {
    orders,
    activeOrder,
    placeOrder,
    updateOrderStatus,
    orderCount,
  } = useOrders(session.tableNumber);

  const {
    crew,
    isCrewOpen,
    setIsCrewOpen,
    inviteFriend,
    crewCount,
  } = useCrew();

  const {
    serviceRequests,
    toastMessage,
    requestService,
    acknowledgeServiceRequest,
    resolveServiceRequest,
    pendingCount,
  } = useServiceRequests(session.tableNumber, currentParticipant);

  // URL routing listener
  useEffect(() => {
    const handlePopState = () => {
      setPortal(getInitialPortal());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Detect NFC tag or Table parameter in query on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const nfcParam = params.get('nfc');
    const tableParam = params.get('table');
    if (nfcParam || tableParam) {
      setNfcBanner(`⚡ Contactless Verification: Table ${tableParam || session.tableNumber} active (${nfcParam || 'QR scan'})`);
      const timer = setTimeout(() => setNfcBanner(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [session.tableNumber]);

  const navigatePortal = (target: PortalMode) => {
    setPortal(target);
    if (typeof window !== 'undefined') {
      const url = target === 'customer' ? '/' : `/${target}`;
      window.history.pushState({}, '', url);
    }
  };

  const handleSelectTable = (tableNumber: string) => {
    simulateSessionScan(tableNumber);
    setNfcBanner(`⚡ Switched to Table ${tableNumber} (NFC Contactless Session Active)`);
    const timer = setTimeout(() => setNfcBanner(null), 4000);
  };

  // Place order into Kitchen Pit and auto-navigate to Live Fire Tracker
  const handlePlaceOrder = (specialInstructions: string) => {
    if (cart.length === 0) return;
    placeOrder(cart, specialInstructions, session.participants.length || crewCount, currentParticipant);
    clearCart();
    setCurrentScreen('TRACKER');
  };

  const isLobbyOrSpecialState = session.status === 'LOBBY' || session.status === 'EXPIRED' || session.status === 'CLOSED';

  // Dedicated Desktop-first Restaurant Operations Console (Staff Portal / Admin Console)
  if (portal === 'staff' || portal === 'admin') {
    if (!isAuthenticated) {
      return (
        <div className="relative min-h-screen">
          {/* Top portal switcher */}
          <div className="fixed top-3 right-4 z-50 flex items-center gap-1.5 bg-[#1c1a1b]/95 backdrop-blur-md border border-white/10 p-1 rounded-xl shadow-xl">
            <button
              onClick={() => navigatePortal('customer')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#9d918b] hover:text-white flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>
            <button
              onClick={() => navigatePortal('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                portal === 'staff' ? 'bg-[#ff5708] text-white' : 'text-[#9d918b] hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Staff (/staff)</span>
            </button>
            <button
              onClick={() => navigatePortal('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                portal === 'admin' ? 'bg-purple-600 text-white' : 'text-[#9d918b] hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Admin (/admin)</span>
            </button>
          </div>

          <StaffLoginPage
            portalMode={portal}
            onExitToCustomer={() => navigatePortal('customer')}
            onSwitchPortal={(mode) => navigatePortal(mode)}
          />
        </div>
      );
    }

    return (
      <div className="relative min-h-screen">
        {/* Top portal switcher in authenticated staff shell */}
        <div className="fixed top-3 right-20 z-50 hidden sm:flex items-center gap-1.5 bg-[#1c1a1b]/95 backdrop-blur-md border border-white/10 p-1 rounded-xl shadow-xl text-xs font-bold font-['Syne',sans-serif]">
          <button
            onClick={() => navigatePortal('customer')}
            className="px-2.5 py-1 rounded-lg text-[#9d918b] hover:text-white flex items-center gap-1"
          >
            <Smartphone className="w-3 h-3 text-[#ff5708]" />
            <span>Customer</span>
          </button>
          <button
            onClick={() => navigatePortal('staff')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
              portal === 'staff' ? 'bg-[#ff5708] text-white' : 'text-[#9d918b] hover:text-white'
            }`}
          >
            <span>Staff</span>
          </button>
          <button
            onClick={() => navigatePortal('admin')}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
              portal === 'admin' ? 'bg-purple-600 text-white' : 'text-[#9d918b] hover:text-white'
            }`}
          >
            <span>Admin</span>
          </button>
        </div>

        <StaffShell
          restaurant={restaurant}
          orders={orders}
          serviceRequests={serviceRequests}
          tables={tables}
          onUpdateOrderStatus={updateOrderStatus}
          onUpdateTableStatus={updateTableFloorStatus}
          onResolveServiceRequest={resolveServiceRequest}
          onAcknowledgeServiceRequest={acknowledgeServiceRequest}
          onExitToCustomer={() => navigatePortal('customer')}
        />
      </div>
    );
  }

  // Multi-Channel Commerce: Takeaway & Pickup Experience
  if (salesChannel === 'TAKEAWAY') {
    return (
      <TakeawayExperience onBackToDineIn={() => setSalesChannel('DINE_IN')} />
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#e5e2e3] selection:bg-[#ff5708] selection:text-white flex flex-col items-center font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Floating Multi-Portal & Environment Switcher Bar */}
      <div className="w-full max-w-4xl px-4 pt-3 pb-1 flex flex-wrap items-center justify-between gap-2 z-40 text-xs font-['Syne',sans-serif]">
        <div className="flex items-center gap-1.5 p-1 bg-[#181617]/90 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
          <button
            onClick={() => navigatePortal('customer')}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              portal === 'customer' ? 'bg-[#ff5708] text-white shadow-sm' : 'text-[#a0948e] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
          <button
            onClick={() => navigatePortal('staff')}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              portal === 'staff' ? 'bg-[#ff5708] text-white shadow-sm' : 'text-[#a0948e] hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#ff7a29]" />
            <span>Staff (/staff)</span>
          </button>
          <button
            onClick={() => navigatePortal('admin')}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              portal === 'admin' ? 'bg-purple-600 text-white shadow-sm' : 'text-[#a0948e] hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin (/admin)</span>
          </button>

          <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block" />

          {/* Quick Onboarding Tour & Table Hub Button */}
          <button
            onClick={() => setIsOnboardingGatewayOpen(true)}
            title="Open Platform Onboarding, Table Selector & Quick Tour"
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ffb86d] animate-pulse" />
            <span>Onboarding Tour</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Supabase Live
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
            <Zap className="w-3 h-3 text-amber-400" />
            Razorpay: TEST MODE
          </span>
        </div>
      </div>

      {/* NFC Contactless Banner */}
      <AnimatePresence>
        {nfcBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-md px-4 pt-2"
          >
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#df8600]/20 to-[#ff5708]/20 border border-[#df8600]/40 text-[#ffb86d] text-xs font-bold flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#ffb86d] animate-pulse" />
                <span>{nfcBanner}</span>
              </div>
              <button
                onClick={() => setNfcBanner(null)}
                className="text-[#9e8f88] hover:text-white text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile-first centered shell for desktop & mobile */}
      <div className="w-full max-w-md min-h-screen bg-[#131314] sm:border-x sm:border-white/[0.06] flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.8)] mt-1">
        {/* Top Header */}
        <Header
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          cartCount={itemCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenCrew={() => setIsCrewOpen(true)}
          onOpenService={() => setIsServiceModalOpen(true)}
          onOpenAuthModal={() => setIsCustomerAuthOpen(true)}
          onOpenTablePicker={() => setIsOnboardingGatewayOpen(true)}
          isKitchenMode={false}
          onToggleKitchenMode={() => navigatePortal('staff')}
          onSwitchToTakeaway={() => setSalesChannel('TAKEAWAY')}
          currentParticipant={currentParticipant}
          session={session}
          userRole={userRole}
          pendingServiceCount={pendingCount}
        />

        {/* Main Content Stage with Screen Transitions */}
        <main className="flex-1 w-full pt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {currentScreen === 'WELCOME' && (
                <TableWelcomeView
                  onStartOrdering={() => setCurrentScreen('MENU')}
                  onOpenCrew={() => setIsCrewOpen(true)}
                  onNavigateToStatus={() => setCurrentScreen('TRACKER')}
                  onOpenService={() => setIsServiceModalOpen(true)}
                  onOpenAuthModal={() => setIsCustomerAuthOpen(true)}
                  onSelectTable={handleSelectTable}
                  onOpenOnboardingTour={() => setIsOnboardingGatewayOpen(true)}
                  activeOrderExists={orders.length > 0}
                  crewCount={session.participants.length || crewCount}
                  session={session}
                />
              )}

              {currentScreen === 'MENU' && (
                <ExploreMenuView
                  onAddToCart={(item, cust, qty) => addToCart(item, cust, qty, currentParticipant)}
                  onOpenCart={() => setIsCartOpen(true)}
                  onOpenSparkAI={() => setIsSparkAIOpen(true)}
                  onOpenSplitBill={() => setIsSplitBillOpen(true)}
                  cart={cart}
                  participants={session.participants}
                  tableNumber={session.tableNumber}
                />
              )}

              {currentScreen === 'TRACKER' && (
                <LiveFireTrackerView
                  order={activeOrder}
                  onAddAnotherRound={() => setCurrentScreen('MENU')}
                  onRequestService={requestService}
                  onOpenSplitBill={() => setIsSplitBillOpen(true)}
                  activeRequests={serviceRequests}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation (Customer mode only) */}
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          onOpenCrew={() => setIsCrewOpen(true)}
          activeOrderCount={orderCount}
        />

        {/* Cart Drawer (with shared table vs my items toggle) */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          myItems={myItems}
          participantGroups={participantGroups}
          currentParticipant={currentParticipant}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onPlaceOrder={handlePlaceOrder}
          onOpenBillSplit={() => setIsSplitBillOpen(true)}
        />

        {/* Crew & Table Diners Modal */}
        <CrewModal
          isOpen={isCrewOpen}
          onClose={() => setIsCrewOpen(false)}
          crew={crew}
          participants={session.participants}
          session={session}
          onInviteFriend={inviteFriend}
        />

        {/* Bill & Split Modal (Full, Equal, By Item) */}
        <BillSplitModal
          isOpen={isSplitBillOpen}
          onClose={() => setIsSplitBillOpen(false)}
          order={activeOrder}
          crew={crew}
          participants={session.participants}
          currentParticipant={currentParticipant}
        />

        {/* Wing Concierge AI Modal */}
        <WingConciergeModal
          isOpen={isSparkAIOpen}
          onClose={() => setIsSparkAIOpen(false)}
          onAddToCart={(item, cust) => addToCart(item, cust, 1, currentParticipant)}
          cartItems={cart}
          activeOrder={activeOrder}
          tableNumber={session.tableNumber}
          sessionId={session.id}
          participantName={currentParticipant?.displayName}
          onViewOrderStatus={() => {
            setIsSparkAIOpen(false);
            setCurrentScreen('TRACKER');
          }}
          onViewCart={() => {
            setIsSparkAIOpen(false);
            setIsCartOpen(true);
          }}
          onRequestService={(type, note) => {
            requestService(type as any, note);
          }}
        />

        {/* Floating Quick AI Concierge Trigger */}
        <button
          onClick={() => setIsSparkAIOpen(true)}
          className="fixed bottom-24 right-4 z-40 bg-gradient-to-r from-[#ff5708] to-[#df8600] text-white p-3 rounded-full shadow-[0_4px_20px_rgba(255,87,8,0.4)] hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 border border-white/20 cursor-pointer"
          aria-label="Open AI Concierge"
        >
          <Sparkles className="w-5 h-5 fill-current text-white animate-pulse" />
          <span className="text-xs font-bold font-syne uppercase tracking-wider pr-1 hidden sm:inline">
            Ask Concierge
          </span>
        </button>

        {/* Instant 1-Tap Service Request Modal */}
        <ServiceRequestModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          onRequestService={(type, note) => requestService(type, note)}
          activeRequests={serviceRequests}
          tableNumber={session.tableNumber}
        />

        {/* Table Lobby & Join Modal */}
        <TableLobbyModal
          isOpen={isLobbyModalOpen || isLobbyOrSpecialState}
          session={session}
          sessionError={sessionError}
          onJoin={(name, emoji) => {
            joinSession(name, emoji);
            setIsLobbyModalOpen(false);
          }}
          onResetSession={resetDemoSession}
        />

        {/* Customer Supabase Auth & Profile Modal */}
        <CustomerAuthModal
          isOpen={isCustomerAuthOpen}
          onClose={() => setIsCustomerAuthOpen(false)}
          currentParticipant={currentParticipant}
          onParticipantUpdated={(updated) => {
            // Update session storage and local state
            sessionStorage.setItem('kow_current_participant_v2', JSON.stringify(updated));
          }}
        />

        {/* Platform Onboarding Tour & Table Gateway Hub */}
        <OnboardingGatewayModal
          isOpen={isOnboardingGatewayOpen}
          onClose={() => setIsOnboardingGatewayOpen(false)}
          onSelectPersona={(p) => navigatePortal(p)}
          onSelectTable={handleSelectTable}
          onOpenRestaurantWizard={() => setIsRestaurantWizardOpen(true)}
          onOpenChecklist={() => setIsChecklistOpen(true)}
          tables={tables}
          currentTableNumber={session.tableNumber}
        />

        {/* Restaurant 4-Step Setup Wizard Modal */}
        <RestaurantOnboardingModal
          isOpen={isRestaurantWizardOpen}
          onClose={() => setIsRestaurantWizardOpen(false)}
          onSuccess={(restId) => {
            setIsRestaurantWizardOpen(false);
            navigatePortal('admin');
          }}
        />

        {/* 25-Point Readiness Checklist Modal Container */}
        {isChecklistOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-2xl bg-[#161415] border border-white/10 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="font-['Syne',sans-serif] text-base font-bold text-white uppercase">
                  Launch Readiness Checklist
                </h3>
                <button
                  onClick={() => setIsChecklistOpen(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0948e] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <RestaurantOnboardingChecklistView />
            </div>
          </div>
        )}

        {/* Floating Realtime Service Toast */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 16, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 16, x: '-50%' }}
              className="fixed bottom-20 left-1/2 z-50 bg-[#df8600] text-[#4d2b00] px-4 py-2.5 rounded-full font-syne text-xs font-black uppercase tracking-wider shadow-2xl flex items-center gap-2 max-w-[90vw] text-center"
            >
              <Check className="w-4 h-4 text-[#4d2b00] flex-shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const existingContext = React.useContext(StaffAuthContext);
  if (existingContext) {
    return <TableAppContent />;
  }
  return (
    <StaffAuthProvider>
      <TableAppContent />
    </StaffAuthProvider>
  );
}