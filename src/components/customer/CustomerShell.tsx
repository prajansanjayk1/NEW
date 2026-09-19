/**
 * CustomerShell
 *
 * The main customer app shell after successful session join.
 * Wraps RestaurantContext + TableSessionContext.
 * Provides bottom navigation: Menu / Cart / Orders / Bill
 * Replaces the scattered customer logic from App.tsx.
 *
 * This component is rendered at /customer/session/* paths
 * and also as the default customer view when a session is active.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UtensilsCrossed,
  ShoppingCart,
  ClipboardList,
  Receipt,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { RestaurantProvider, useRestaurant } from '../../contexts/RestaurantContext';
import { TableSessionProvider, useTableSessionCtx } from '../../contexts/TableSessionContext';
import { CustomerHomeView } from './CustomerHomeView';
import { CustomerAuthView } from './CustomerAuthView';
import { TableSessionJoinView } from './TableSessionJoinView';
import { ExploreMenuView } from '../ExploreMenuView';
import { LiveFireTrackerView } from '../LiveFireTrackerView';
import { CartDrawer } from '../CartDrawer';
import { BillView } from './BillView';
import { ServiceRequestModal } from '../ServiceRequestModal';
import { WingConciergeModal } from '../WingConciergeModal';
import { useCart } from '../../hooks/useCart';
import { useOrders } from '../../hooks/useOrders';
import { useServiceRequests } from '../../hooks/useServiceRequests';
import { realtimeService } from '../../services/realtimeService';
import { getStoredEntryContext } from '../../services/entryService';

type CustomerTab = 'HOME' | 'MENU' | 'ORDERS' | 'BILL';

interface CustomerShellInnerProps {
  restaurantId: string;
  tableId: string;
}

function CustomerShellInner({ restaurantId, tableId }: CustomerShellInnerProps) {
  const { restaurant, menu, isMenuLoading, menuError, refreshMenu } = useRestaurant();
  const {
    session,
    currentParticipant,
    participants,
    sessionPhase,
  } = useTableSessionCtx();

  const [activeTab, setActiveTab] = useState<CustomerTab>('HOME');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [connectionStatus] = useState(realtimeService.getConnectionStatus());

  // Cart state
  const {
    cart,
    myItems,
    participantGroups,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
    subtotal,
    tax,
    total,
  } = useCart(currentParticipant);

  // Orders state
  const {
    orders,
    activeOrder,
    placeOrder,
    updateOrderStatus,
    orderCount,
  } = useOrders(session?.tableNumber || '');

  // Service requests
  const {
    serviceRequests,
    requestService,
    acknowledgeServiceRequest,
    resolveServiceRequest,
  } = useServiceRequests(session?.tableNumber || '', currentParticipant);

  const handlePlaceOrder = useCallback(
    (specialInstructions: string) => {
      if (cart.length === 0 || !session) return;
      placeOrder(cart, specialInstructions, participants.length || 1, currentParticipant);
      clearCart();
      setIsCartOpen(false);
      setActiveTab('ORDERS');
    },
    [cart, session, participants, currentParticipant, placeOrder, clearCart]
  );

  const brandColor = restaurant?.branding?.primaryColor || '#ff5708';

  // Closed session screen
  if (sessionPhase === 'CLOSED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e0f] p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
            <Receipt className="w-7 h-7 text-white/30" />
          </div>
          <h2 className="text-xl font-black text-white mb-3 font-['Syne',sans-serif]">
            Table session closed
          </h2>
          <p className="text-sm text-white/50 mb-6">
            This table session has ended. Scan the table QR code to start a new session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-[#e5e2e3] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#ff5708] selection:text-white">

      {/* Realtime disconnected banner */}
      <AnimatePresence>
        {connectionStatus === 'OFFLINE' && (
          <motion.div
            initial={{ y: -32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -32, opacity: 0 }}
            className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-yellow-500/90 text-yellow-950 text-xs font-semibold py-2"
          >
            <WifiOff className="w-3.5 h-3.5" />
            Reconnecting…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area — scrollable, padded for bottom nav */}
      <div className="flex-1 pb-20 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'HOME' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CustomerHomeView
                restaurant={restaurant}
                session={session}
                participants={participants}
                currentParticipant={currentParticipant}
                onGoToMenu={() => setActiveTab('MENU')}
                onOpenService={() => setIsServiceOpen(true)}
                onOpenConcierge={() => setIsConciergeOpen(true)}
                brandColor={brandColor}
              />
            </motion.div>
          )}

          {activeTab === 'MENU' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ExploreMenuView
                restaurant={restaurant}
                menuItems={menu?.items || []}
                categories={menu?.categories || []}
                isLoading={isMenuLoading}
                loadError={menuError}
                onRetry={refreshMenu}
                cartItems={cart}
                currentParticipant={currentParticipant}
                onAddToCart={addToCart}
                onOpenCart={() => setIsCartOpen(true)}
                cartItemCount={itemCount}
                onOpenConcierge={() => setIsConciergeOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'ORDERS' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LiveFireTrackerView
                session={session}
                restaurant={restaurant}
                orders={orders}
                currentParticipant={currentParticipant}
                onUpdateOrderStatus={updateOrderStatus}
                brandColor={brandColor}
              />
            </motion.div>
          )}

          {activeTab === 'BILL' && (
            <motion.div
              key="bill"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <BillView
                session={session}
                restaurant={restaurant}
                participants={participants}
                currentParticipant={currentParticipant}
                orders={orders}
                brandColor={brandColor}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0e0e0f]/95 backdrop-blur-xl border-t border-white/8 safe-area-bottom">
        <div className="flex items-stretch h-16 max-w-lg mx-auto">
          {[
            { id: 'HOME' as CustomerTab, icon: UtensilsCrossed, label: 'Home', badge: 0 },
            { id: 'MENU' as CustomerTab, icon: UtensilsCrossed, label: 'Menu', badge: 0 },
            {
              id: 'ORDERS' as CustomerTab,
              icon: ClipboardList,
              label: 'Orders',
              badge: activeOrder ? 1 : 0,
            },
            { id: 'BILL' as CustomerTab, icon: Receipt, label: 'Bill', badge: 0 },
          ].map(({ id, icon: Icon, label, badge }) => {
            const isActive = activeTab === id;
            const isCart = id === 'MENU' && itemCount > 0;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors active:opacity-70"
              >
                <div className="relative">
                  <Icon
                    className="w-5 h-5 transition-colors"
                    style={{ color: isActive ? brandColor : 'rgba(255,255,255,0.4)' }}
                  />
                  {badge > 0 && (
                    <div
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      {badge}
                    </div>
                  )}
                </div>
                <span
                  className="text-[10px] font-semibold transition-colors"
                  style={{ color: isActive ? brandColor : 'rgba(255,255,255,0.35)' }}
                >
                  {label}
                </span>
                {isActive && (
                  <div
                    className="absolute top-0 inset-x-4 h-0.5 rounded-b-full"
                    style={{ backgroundColor: brandColor }}
                  />
                )}
              </button>
            );
          })}

          {/* Cart button — positioned between Menu and Orders */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors active:opacity-70"
          >
            <div className="relative">
              <ShoppingCart
                className="w-5 h-5 transition-colors"
                style={{ color: itemCount > 0 ? brandColor : 'rgba(255,255,255,0.4)' }}
              />
              {itemCount > 0 && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </div>
              )}
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{ color: itemCount > 0 ? brandColor : 'rgba(255,255,255,0.35)' }}
            >
              Cart
            </span>
          </button>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        myItems={myItems}
        participantGroups={participantGroups}
        currentParticipant={currentParticipant}
        session={session}
        restaurant={restaurant}
        subtotal={subtotal}
        tax={tax}
        total={total}
        itemCount={itemCount}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* Service Request Modal */}
      <ServiceRequestModal
        isOpen={isServiceOpen}
        onClose={() => setIsServiceOpen(false)}
        session={session}
        currentParticipant={currentParticipant}
        serviceRequests={serviceRequests}
        onRequestService={requestService}
      />

      {/* AI Concierge */}
      {restaurant && (
        <WingConciergeModal
          isOpen={isConciergeOpen}
          onClose={() => setIsConciergeOpen(false)}
          restaurant={restaurant}
          session={session}
          currentParticipant={currentParticipant}
          menuItems={menu?.items || []}
          orders={orders}
        />
      )}
    </div>
  );
}

/**
 * CustomerShell — top-level wrapper that provides contexts
 */
interface CustomerShellProps {
  restaurantId?: string;
  tableId?: string;
}

function CustomerShellRouter({ restaurantId, tableId }: CustomerShellInnerProps) {
  const { sessionPhase } = useTableSessionCtx();
  const { restaurant, table } = getStoredEntryContext() || { restaurant: null, table: null };

  if (sessionPhase === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e0f]">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#ff5708] animate-spin" />
      </div>
    );
  }

  if (sessionPhase === 'AUTH_REQUIRED' && restaurant && table) {
    return (
      <CustomerAuthView
        restaurant={restaurant as any}
        table={table as any}
        onAuthenticated={() => window.location.reload()}
      />
    );
  }

  if (sessionPhase === 'JOIN' && restaurant && table) {
    return (
      <TableSessionJoinView
        restaurant={restaurant as any}
        table={table as any}
      />
    );
  }

  if (sessionPhase === 'ERROR') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e0f] p-6 text-center">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-white/50 text-sm">Please scan the QR code again.</p>
        </div>
      </div>
    );
  }

  return <CustomerShellInner restaurantId={restaurantId} tableId={tableId} />;
}

export function CustomerShell({ restaurantId: propRid, tableId: propTid }: CustomerShellProps) {
  const ctx = getStoredEntryContext();
  const restaurantId = propRid || ctx?.restaurantId || '';
  const tableId = propTid || ctx?.tableId || '';

  return (
    <RestaurantProvider restaurantId={restaurantId}>
      <TableSessionProvider restaurantId={restaurantId} tableId={tableId}>
        <CustomerShellRouter restaurantId={restaurantId} tableId={tableId} />
      </TableSessionProvider>
    </RestaurantProvider>
  );
}
