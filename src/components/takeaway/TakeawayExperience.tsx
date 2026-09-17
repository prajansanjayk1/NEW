import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  ChevronRight, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ArrowLeft, 
  Package, 
  Phone, 
  User, 
  FileText, 
  CreditCard, 
  Flame, 
  Printer, 
  Share2, 
  AlertCircle 
} from 'lucide-react';
import { MenuItem, CartItem, Order } from '../../types';
import { takeawayService } from '../../services/takeawayService';

interface TakeawayExperienceProps {
  onBackToDineIn?: () => void;
}

export const TakeawayExperience: React.FC<TakeawayExperienceProps> = ({ onBackToDineIn }) => {
  const [viewState, setViewState] = useState<'MENU' | 'CART' | 'TRACKING'>('MENU');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupTime, setPickupTime] = useState<'ASAP' | 'SCHEDULED'>('ASAP');
  const [scheduledTime, setScheduledTime] = useState('19:30');
  const [pickupNotes, setPickupNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'PAY_AT_COUNTER'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Active placed order
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Load menu & cart on mount
  useEffect(() => {
    takeawayService.getTakeawayMenu().then((res) => {
      setMenuItems(res.items || []);
    });
    setCart(takeawayService.getTakeawayCart());
  }, []);

  // Save cart changes
  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    takeawayService.saveTakeawayCart(newCart);
  };

  const addToCart = (item: MenuItem) => {
    const existingIndex = cart.findIndex((c) => c.menuItemId === item.id);
    const unitPrice = item.takeawayPrice || item.price;
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * unitPrice;
      updateCart(updated);
    } else {
      const newItem: CartItem = {
        id: `cart-t-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        menuItemId: item.id,
        name: item.name,
        image: item.image,
        unitPrice,
        totalPrice: unitPrice,
        quantity: 1,
        customization: {
          portionSize: '10 PC',
          portionPriceDelta: 0,
          heatLevel: item.heatFlames > 2 ? 'HOT' : 'MILD',
          styleCut: 'Classic Bone-In',
          styleCutDelta: 0,
          dip: 'Cool Ranch',
        },
        addedBy: 'Guest',
      };
      updateCart([...cart, newItem]);
    }
  };

  const changeQuantity = (itemId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    updateCart(updated);
  };

  const bill = takeawayService.calculateTakeawayBill(cart);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please enter your name and phone number for pickup alerts.');
      return;
    }
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const finalPickupTime = pickupTime === 'ASAP' ? 'ASAP (~15-20 mins)' : `Scheduled for ${scheduledTime}`;
      const result = await takeawayService.submitTakeawayOrder({
        restaurantId: 'rest-kow-blr-01',
        customerName,
        customerPhone,
        pickupTime: finalPickupTime,
        pickupNotes,
        items: cart,
        paymentMethod,
      });

      if (result.success && result.order) {
        setActiveOrder(result.order);
        setCart([]);
        setViewState('TRACKING');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['ALL', 'Wings', 'Combos', 'Burgers', 'Sides'];

  const filteredItems = selectedCategory === 'ALL'
    ? menuItems
    : menuItems.filter((i) => i.category.toUpperCase() === selectedCategory.toUpperCase());

  return (
    <div id="takeaway-experience-root" className="min-h-screen bg-[#0f0f10] text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Takeaway Header */}
      <header className="bg-[#18181b] border-b border-zinc-800/80 sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToDineIn && (
              <button
                id="btn-back-to-dinein"
                onClick={onBackToDineIn}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Return to Table Dine-In"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dine-In Mode</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Takeaway & Pickup Channel
                </span>
                <span className="text-zinc-400 text-xs hidden sm:inline">·</span>
                <span className="text-zinc-400 text-xs hidden sm:inline flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Prep: 15–20 mins
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Kings of Wings Takeaway Counter
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewState === 'MENU' && (
              <button
                id="btn-view-takeaway-cart"
                onClick={() => setViewState('CART')}
                className="relative flex items-center gap-2 bg-[#ff5708] hover:bg-[#ff5708]/90 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-[#ff5708]/20 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                <span className="bg-black/30 px-2 py-0.5 rounded-full text-xs font-mono">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </button>
            )}

            {viewState !== 'MENU' && (
              <button
                id="btn-return-menu"
                onClick={() => setViewState('MENU')}
                className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-700"
              >
                Browse Menu
              </button>
            )}
          </div>
        </div>
      </header>

      {/* VIEW: TAKEAWAY MENU */}
      {viewState === 'MENU' && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-6">
          {/* Channel Banner info */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-400" />
                Thermal Takeaway Sealed Packaging
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                All takeaway orders are packed in vented heat-retentive boxes to preserve crispiness.
                Dedicated takeaway pricing applies.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-zinc-400">Order Channel:</span>
              <span className="ml-1 text-xs font-bold text-emerald-400">EXPRESS PICKUP</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`btn-cat-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const displayPrice = item.takeawayPrice || item.price;
              const cartCount = cart.find((c) => c.menuItemId === item.id)?.quantity || 0;

              return (
                <div
                  key={item.id}
                  id={`takeaway-item-${item.id}`}
                  className="bg-[#18181b] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl overflow-hidden flex flex-col transition-all group"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-amber-400 text-[10px] font-bold border border-white/10 uppercase tracking-wider">
                        Takeaway Pack
                      </span>
                    </div>

                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md text-xs font-semibold text-white">
                      <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                      <span>{item.heatFlames}/5</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-white text-base leading-snug">{item.name}</h3>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-white">₹{displayPrice}</span>
                          {item.dineInPrice && item.dineInPrice !== displayPrice && (
                            <span className="block text-[10px] text-zinc-400 line-through">₹{item.dineInPrice} Dine-In</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                        <Package className="w-3 h-3 text-zinc-400" /> Pkg: ₹{item.packagingCharge || 15}
                      </span>

                      {cartCount > 0 ? (
                        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-lg">
                          <button
                            id={`btn-dec-${item.id}`}
                            onClick={() => {
                              const found = cart.find((c) => c.menuItemId === item.id);
                              if (found) changeQuantity(found.id, -1);
                            }}
                            className="text-zinc-400 hover:text-white p-0.5"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold font-mono px-1">{cartCount}</span>
                          <button
                            id={`btn-inc-${item.id}`}
                            onClick={() => addToCart(item)}
                            className="text-zinc-400 hover:text-white p-0.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn-add-${item.id}`}
                          onClick={() => addToCart(item)}
                          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add to Pack
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Cart bar on mobile */}
          {cart.length > 0 && (
            <div className="fixed bottom-4 left-4 right-4 sm:hidden z-20">
              <button
                id="btn-floating-takeaway-cart"
                onClick={() => setViewState('CART')}
                className="w-full bg-[#ff5708] hover:bg-[#ff5708]/90 text-white font-bold py-3 px-4 rounded-xl shadow-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  <span>{cart.reduce((s, i) => s + i.quantity, 0)} Items in Takeaway Cart</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-extrabold text-sm">
                  <span>₹{bill.total}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}
        </main>
      )}

      {/* VIEW: TAKEAWAY CART & CHECKOUT */}
      {viewState === 'CART' && (
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-amber-400" />
              Takeaway Checkout
            </h2>
            <button
              onClick={() => setViewState('MENU')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Menu
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Your takeaway cart is empty</h3>
              <p className="text-xs text-zinc-400 mb-6">Add hot wings, combos or burgers for fast pickup.</p>
              <button
                onClick={() => setViewState('MENU')}
                className="bg-amber-500 text-black px-6 py-2.5 rounded-xl font-bold text-sm"
              >
                Browse Takeaway Menu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {/* Cart Items List */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 sm:p-5 divide-y divide-zinc-800/80">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Order Items</h3>
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg bg-zinc-800" />
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <span className="text-xs text-zinc-400 font-mono">₹{item.unitPrice} each</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-2 py-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, -1)}
                          className="text-zinc-400 hover:text-white p-0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold font-mono px-1">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQuantity(item.id, 1)}
                          className="text-zinc-400 hover:text-white p-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-white font-mono w-16 text-right">
                        ₹{item.totalPrice}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pickup Customer Information */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Pickup Customer Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" /> Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Verma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" /> Phone Number (For Pickup SMS) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Pickup Time Option */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" /> Pickup Time
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPickupTime('ASAP')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        pickupTime === 'ASAP'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> ASAP (~15–20 mins)
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-0.5 block">Kitchen starts immediately</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPickupTime('SCHEDULED')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        pickupTime === 'SCHEDULED'
                          ? 'border-amber-500 bg-amber-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Schedule Pickup
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-0.5 block">Pick your exact time</span>
                    </button>
                  </div>

                  {pickupTime === 'SCHEDULED' && (
                    <div className="mt-3">
                      <label className="block text-[11px] text-zinc-400 mb-1">Select Pickup Time Today:</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 text-white px-3 py-1.5 rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Pickup Notes */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" /> Special Pickup Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Extra napkins, pack sauces in separate pouch"
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                      paymentMethod === 'UPI'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">Pay Online (Instant UPI / Card)</span>
                      <span className="text-[11px] text-zinc-400">Zero wait at pickup counter</span>
                    </div>
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PAY_AT_COUNTER')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                      paymentMethod === 'PAY_AT_COUNTER'
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">Pay at Counter on Pickup</span>
                      <span className="text-[11px] text-zinc-400">Cash / Card / POS at counter</span>
                    </div>
                    <Package className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>

              {/* Transparent Bill Breakdown */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-2.5 font-mono text-xs">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-['Plus_Jakarta_Sans'] mb-3">
                  Financial Breakdown
                </h3>
                <div className="flex justify-between text-zinc-300">
                  <span>Takeaway Food Subtotal</span>
                  <span>₹{bill.itemsSubtotal}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3" /> Certified Thermal Packaging Fee
                  </span>
                  <span>₹{bill.packagingFee}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Restaurant GST (5%)</span>
                  <span>₹{bill.tax}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between text-base font-extrabold text-white">
                  <span className="font-['Plus_Jakarta_Sans']">Total Amount Payable</span>
                  <span className="text-[#ff5708]">₹{bill.total}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                id="btn-submit-takeaway-order"
                disabled={isSubmitting}
                className="w-full bg-[#ff5708] hover:bg-[#ff5708]/90 disabled:opacity-50 text-white font-extrabold py-3.5 px-6 rounded-xl text-sm shadow-xl shadow-[#ff5708]/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Transmitting to Kitchen...</span>
                ) : (
                  <>
                    <span>Confirm Takeaway Order & Pay ₹{bill.total}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </main>
      )}

      {/* VIEW: LIVE ORDER TRACKING & DIGITAL RECEIPT */}
      {viewState === 'TRACKING' && activeOrder && (
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:px-6 space-y-6">
          {/* Order Header Badge */}
          <div className="bg-[#18181b] border border-amber-500/30 rounded-3xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-[#ff5708] to-amber-500" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              Takeaway Order Registered
            </div>

            <div className="text-4xl font-extrabold tracking-tight text-white font-mono mt-1">
              #{activeOrder.takeawayOrderNumber || activeOrder.ticketNumber}
            </div>

            <p className="text-xs text-zinc-400 mt-2">
              Customer: <span className="text-white font-semibold">{activeOrder.customerName}</span> · Pickup:{' '}
              <span className="text-amber-400 font-semibold">{activeOrder.pickupTime}</span>
            </p>
          </div>

          {/* Stepper Timeline */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Kitchen & Pickup Progress</h3>
            
            <div className="space-y-3">
              {[
                { status: 'ORDER_RECEIVED', label: 'Order Transmitted to Pit Kitchen', active: true, done: true },
                { status: 'CONFIRMED', label: 'Order Confirmed by Pitmaster', active: true, done: true },
                { status: 'PREPARING', label: 'Wings Cooking & Saucing in Station', active: true, done: false },
                { status: 'READY_FOR_PICKUP', label: 'Packed & Ready at Takeaway Counter', active: false, done: false },
                { status: 'PICKED_UP', label: 'Handed Over to Customer', active: false, done: false },
              ].map((step, idx) => (
                <div key={step.status} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                      step.done
                        ? 'bg-emerald-500 text-black'
                        : step.active
                        ? 'bg-amber-500 text-black animate-pulse'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {step.done ? '✓' : idx + 1}
                  </div>
                  <span className={`text-xs font-semibold ${step.done || step.active ? 'text-white' : 'text-zinc-500'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Please arrive at Kings of Wings Counter. Mention order{' '}
                <strong>#{activeOrder.takeawayOrderNumber || activeOrder.ticketNumber}</strong> to collect your sealed pack.
              </span>
            </div>
          </div>

          {/* Order Summary & Digital Receipt */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Digital Takeaway Receipt</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="Print Receipt"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Order tracking link copied to clipboard!');
                  }}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="Share Order"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-zinc-800/60 font-mono text-xs">
              {activeOrder.items.map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between">
                  <span className="text-zinc-300">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-white">₹{item.totalPrice}</span>
                </div>
              ))}

              <div className="pt-2 flex justify-between text-zinc-400">
                <span>Thermal Packaging</span>
                <span>₹{activeOrder.packagingCharge || 15}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>GST (5%)</span>
                <span>₹{activeOrder.tax}</span>
              </div>
              <div className="pt-2 flex justify-between text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                <span>Total Paid ({activeOrder.paymentMethod})</span>
                <span className="text-[#ff5708] font-mono">₹{activeOrder.total}</span>
              </div>
            </div>
          </div>

          {/* Place Another Order Button */}
          <button
            onClick={() => {
              setActiveOrder(null);
              setViewState('MENU');
            }}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-xs transition-colors"
          >
            Start Another Takeaway Order
          </button>
        </main>
      )}
    </div>
  );
};
