import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Check, 
  ChefHat, 
  Send, 
  Flame, 
  ThumbsUp, 
  ThumbsDown, 
  ShoppingBag, 
  Clock, 
  Droplet, 
  Receipt,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem, CustomizationOption, CartItem, Order, ServiceRequestType } from '../types';
import { AIMessage, AIRecommendation, AIAction, AIConversationContext } from '../types/ai';
import { aiClient } from '../services/ai/aiClient';
import { DEMO_MENU_ITEMS } from '../data/mockData';

interface WingConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, customization: CustomizationOption) => void;
  cartItems?: CartItem[];
  activeOrder?: Order | null;
  tableNumber?: string;
  sessionId?: string;
  participantName?: string;
  onViewOrderStatus?: () => void;
  onViewCart?: () => void;
  onRequestService?: (type: string, note?: string) => void;
}

const QUICK_PROMPTS = [
  { label: '🔥 What is spicy?', query: "What's good for someone who likes spicy food?" },
  { label: '💰 Under ₹500', query: 'I want something delicious under ₹500.' },
  { label: '👥 Feast for 3', query: 'What should 3 people order to share?' },
  { label: '🍗 Signature Wings', query: "What's your hottest signature wing?" },
  { label: '🥗 Veg / Meat-free', query: "I don't eat meat, what are my options?" },
  { label: '📍 Where is my food?', query: 'Where is my order right now?' },
  { label: '💧 Request Water', query: 'Can I request drinking water for the table?' },
];

export const WingConciergeModal: React.FC<WingConciergeModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
  cartItems = [],
  activeOrder = null,
  tableNumber = '18',
  sessionId = 'sess-active',
  participantName = 'Diner',
  onViewOrderStatus,
  onViewCart,
  onRequestService,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Welcome to Kings of Wings! I am your **Pitmaster AI Concierge** for Table ${tableNumber}.\n\nAsk me about heat levels, group feasts, vegetarian options, food pairings, or check your live order status!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recommendations: [
        {
          menuItemId: 'wings-firecracker',
          name: 'Firecracker Wings',
          price: 249,
          reason: 'Our #1 house icon with smoky firecracker glaze and burnt garlic.',
          confidence: 0.96,
        },
        {
          menuItemId: 'wings-korean',
          name: 'Korean Fire Wings',
          price: 269,
          reason: 'Intense 125,000 SHU fermented gochujang heat for true spice seekers.',
          confidence: 0.94,
        }
      ]
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string, boolean>>({});
  const [conversationContext, setConversationContext] = useState<AIConversationContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isTyping) return;

    setInputQuery('');
    const userMsgId = `user-${Date.now()}`;
    const userMsg: AIMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await aiClient.sendMessageToConcierge({
        restaurantId: 'rest-kow-blr-01',
        tableNumber,
        sessionId,
        participantName,
        message: query,
        history: historyPayload,
        context: conversationContext,
        cartSummary: {
          totalItems: cartItems.reduce((sum, c) => sum + c.quantity, 0),
          totalAmount: cartItems.reduce((sum, c) => sum + c.totalPrice, 0),
          items: cartItems.map((c) => ({
            menuItemId: c.menuItemId,
            name: c.name,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
          })),
        },
        activeOrderStatus: activeOrder ? {
          orderId: activeOrder.id,
          ticketNumber: activeOrder.ticketNumber,
          status: activeOrder.status,
          itemCount: activeOrder.items.length,
        } : undefined,
      });

      const assistantMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: response.recommendations,
        actions: response.actions,
        modelUsed: response.model,
        isDemoFallback: response.isDemoFallback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.updatedContext) {
        setConversationContext((prev) => ({ ...prev, ...response.updatedContext }));
      }

      // Execute non-cart auto-actions if applicable (e.g. Service Requests)
      if (response.actions) {
        for (const action of response.actions) {
          if (action.type === 'CREATE_SERVICE_REQUEST' && onRequestService && action.serviceType) {
            onRequestService(action.serviceType, action.serviceNote);
          }
        }
      }
    } catch (err) {
      console.error('[Concierge Modal] Message send failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: "I ran into a momentary hiccup. Here are some of our best-selling signature wings while I reconnect!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToCart = (rec: AIRecommendation) => {
    const menuItem = DEMO_MENU_ITEMS.find((m) => m.id === rec.menuItemId);
    if (!menuItem) return;

    const customization: CustomizationOption = {
      portionSize: rec.suggestedCustomization?.portionSize || '10 PC',
      portionPriceDelta: 0,
      heatLevel: rec.suggestedCustomization?.heatLevel || (menuItem.heatFlames > 2 ? 'HOT' : 'MILD'),
      styleCut: rec.suggestedCustomization?.styleCut || 'Classic Bone-In',
      styleCutDelta: 0,
      dip: rec.suggestedCustomization?.dip || 'Cool Ranch',
      extraNotes: 'Added via Pitmaster AI Concierge',
    };

    onAddToCart(menuItem, customization);
    setAddedItemMap((prev) => ({ ...prev, [rec.menuItemId]: true }));
    setTimeout(() => {
      setAddedItemMap((prev) => ({ ...prev, [rec.menuItemId]: false }));
    }, 2000);
  };

  const handleFeedback = (messageId: string, rating: 'HELPFUL' | 'NOT_HELPFUL') => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: rating } : msg))
    );
    aiClient.submitAIFeedback({
      messageId,
      conversationType: 'CONCIERGE',
      rating,
      tableNumber,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-[#18181a] border border-white/[0.12] rounded-3xl shadow-2xl flex flex-col h-[85vh] max-h-[720px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#1e1e20] border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff5708] to-[#df8600] flex items-center justify-center text-[#3d1100] shadow-md shadow-[#ff5708]/30">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-syne font-black text-white text-base tracking-wide">
                  Pitmaster AI Concierge
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#ff5708]/15 border border-[#ff5708]/30 text-[#ff7a29] text-[10px] font-bold uppercase tracking-wider">
                  Table {tableNumber}
                </span>
              </div>
              <p className="text-white/40 text-xs">
                Real-time menu intelligence, pairings & table assistance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close Concierge"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-[#141416] border-b border-white/[0.04] overflow-x-auto no-scrollbar flex items-center gap-2 flex-shrink-0">
          <span className="text-white/30 text-[11px] font-semibold uppercase tracking-wider pl-1 flex-shrink-0">
            Ask:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt.query)}
              disabled={isTyping}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-[#ff5708]/20 hover:border-[#ff5708]/40 border border-white/[0.08] text-white/80 hover:text-white text-xs font-medium transition-all whitespace-nowrap"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-[#ff5708] to-[#df8600] text-white font-medium shadow-md shadow-[#ff5708]/20 rounded-tr-none'
                    : 'bg-[#222226] border border-white/[0.08] text-white/90 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line break-words">
                  {msg.content}
                </div>

                {/* Recommendations Carousel/Cards */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2.5 pt-2 border-t border-white/10">
                    <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block">
                      Recommended for you
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.recommendations.map((rec) => {
                        const menuItem = DEMO_MENU_ITEMS.find((m) => m.id === rec.menuItemId);
                        const isAdded = addedItemMap[rec.menuItemId];
                        return (
                          <div
                            key={rec.menuItemId}
                            className="bg-[#18181b] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-[#ff5708]/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {menuItem?.image && (
                                <img
                                  src={menuItem.image}
                                  alt={rec.name || menuItem.name}
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-white text-xs truncate">
                                    {rec.name || menuItem?.name}
                                  </h4>
                                  {menuItem && menuItem.heatFlames > 0 && (
                                    <span className="flex items-center text-[#ff5708] text-[10px] font-bold">
                                      <Flame className="w-3 h-3 fill-current" />
                                      {menuItem.heatFlames}
                                    </span>
                                  )}
                                </div>
                                <p className="text-white/50 text-[11px] line-clamp-1">
                                  {rec.reason}
                                </p>
                                <span className="font-syne font-black text-[#ff7a29] text-xs">
                                  ₹{rec.price || menuItem?.price || 0}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddToCart(rec)}
                              disabled={isAdded}
                              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                                isAdded
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-[#ff5708] hover:bg-[#ff7a29] text-white shadow-sm'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Structured Action Triggers */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
                    {msg.actions.map((act, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 text-[11px] font-medium text-white/80 flex items-center gap-1.5"
                      >
                        {act.type === 'VIEW_ORDER_STATUS' && <Clock className="w-3 h-3 text-amber-400" />}
                        {act.type === 'VIEW_CART' && <ShoppingBag className="w-3 h-3 text-[#ff5708]" />}
                        {act.type === 'CREATE_SERVICE_REQUEST' && <Droplet className="w-3 h-3 text-sky-400" />}
                        <span>{act.actionSummary || act.type}</span>
                        {act.type === 'VIEW_ORDER_STATUS' && onViewOrderStatus && (
                          <button
                            onClick={onViewOrderStatus}
                            className="underline text-amber-400 font-bold ml-1 hover:text-amber-300"
                          >
                            Open Tracker
                          </button>
                        )}
                        {act.type === 'VIEW_CART' && onViewCart && (
                          <button
                            onClick={onViewCart}
                            className="underline text-[#ff7a29] font-bold ml-1 hover:text-[#ff9450]"
                          >
                            View Cart
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp & Feedback (Assistant only) */}
              <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-white/30">
                <span>{msg.timestamp}</span>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleFeedback(msg.id, 'HELPFUL')}
                      className={`p-1 rounded hover:bg-white/10 transition-colors ${
                        msg.feedback === 'HELPFUL' ? 'text-emerald-400' : 'text-white/40'
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, 'NOT_HELPFUL')}
                      className={`p-1 rounded hover:bg-white/10 transition-colors ${
                        msg.feedback === 'NOT_HELPFUL' ? 'text-rose-400' : 'text-white/40'
                      }`}
                      title="Not Helpful"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-2">
              <div className="bg-[#222226] border border-white/[0.08] rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 text-white/50 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#ff5708] animate-spin" />
                <span>Pitmaster AI is checking menu & kitchen pit...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-[#1e1e20] border-t border-white/[0.08] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about heat levels, combos, water, allergens..."
            className="flex-1 bg-[#141416] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff5708]/60 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#ff5708] to-[#df8600] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 shadow-md shadow-[#ff5708]/20 transition-opacity"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
