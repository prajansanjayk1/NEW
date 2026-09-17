import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppScreen } from './types';
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
import { StaffAuthProvider, StaffAuthContext, useStaffAuth } from './contexts/StaffAuthContext';
import { Bell, Check, Sparkles } from 'lucide-react';

function TableAppContent() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('WELCOME');
  const [isOperationsMode, setIsOperationsMode] = useState<boolean>(false);
  const [salesChannel, setSalesChannel] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [isSparkAIOpen, setIsSparkAIOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isLobbyModalOpen, setIsLobbyModalOpen] = useState(false);

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

  // Place order into Kitchen Pit and auto-navigate to Live Fire Tracker
  const handlePlaceOrder = (specialInstructions: string) => {
    if (cart.length === 0) return;
    placeOrder(cart, specialInstructions, session.participants.length || crewCount, currentParticipant);
    clearCart();
    setCurrentScreen('TRACKER');
  };

  const isLobbyOrSpecialState = session.status === 'LOBBY' || session.status === 'EXPIRED' || session.status === 'CLOSED';

  // Dedicated Desktop-first Restaurant Operations Console
  if (isOperationsMode) {
    if (!isAuthenticated) {
      return (
        <StaffLoginPage
          onExitToCustomer={() => setIsOperationsMode(false)}
        />
      );
    }

    return (
      <StaffShell
        restaurant={restaurant}
        orders={orders}
        serviceRequests={serviceRequests}
        tables={tables}
        onUpdateOrderStatus={updateOrderStatus}
        onUpdateTableStatus={updateTableFloorStatus}
        onResolveServiceRequest={resolveServiceRequest}
        onAcknowledgeServiceRequest={acknowledgeServiceRequest}
        onExitToCustomer={() => setIsOperationsMode(false)}
      />
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
      {/* Mobile-first centered shell for desktop & mobile */}
      <div className="w-full max-w-md min-h-screen bg-[#131314] sm:border-x sm:border-white/[0.06] flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        {/* Top Header */}
        <Header
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          cartCount={itemCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenCrew={() => setIsCrewOpen(true)}
          onOpenService={() => setIsServiceModalOpen(true)}
          isKitchenMode={isOperationsMode}
          onToggleKitchenMode={() => setIsOperationsMode(!isOperationsMode)}
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
        {!isOperationsMode && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={setCurrentScreen}
            onOpenCrew={() => setIsCrewOpen(true)}
            activeOrderCount={orderCount}
          />
        )}

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
        {!isOperationsMode && (
          <button
            onClick={() => setIsSparkAIOpen(true)}
            className="fixed bottom-24 right-4 z-40 bg-gradient-to-r from-[#ff5708] to-[#df8600] text-white p-3 rounded-full shadow-[0_4px_20px_rgba(255,87,8,0.4)] hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 border border-white/20"
            aria-label="Open AI Concierge"
          >
            <Sparkles className="w-5 h-5 fill-current text-white animate-pulse" />
            <span className="text-xs font-bold font-syne uppercase tracking-wider pr-1 hidden sm:inline">
              Ask Concierge
            </span>
          </button>
        )}

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
