'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Icon, Badge, Button } from '@/components/ui';
import AppShell from '@/components/AppShell';
import ChatInterface from '@/components/ChatInterface';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useChitiConnectCall } from '@/hooks/useChitiConnectCall';
import { Shop, Product, Message } from '@/types';
import { api, API_URL } from '@/lib/api';
import { addToGuestCart, guestCartCount } from '@/lib/guestCart';
import { track } from '@/lib/analytics';
import BighiStorefront from '@/components/BighiStorefront';
import { BIGHI_STORE } from '@/lib/bighiCatalog';

type Tab = 'products' | 'chat';

// Route wrapper: the flagship "Bighi Brothers Mart" demo store is a fully
// bundled experience (1,000+ SKU master catalog, no backend shop record), so
// it renders its own component before the hook-heavy regular shop flow mounts.
export default function ShopPage() {
  const params = useParams();
  const shopId = params.id as string;
  if (shopId === BIGHI_STORE.id) return <BighiStorefront />;
  return <RegularShopPage shopId={shopId} />;
}

function RegularShopPage({ shopId }: { shopId: string }) {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const hasJoinedRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected, joinChat, sendMessage, sendProductMessage,
    sendTyping, sendStopTyping, markRead,
    onMessage, onTyping, onStopTyping,
  } = useSocket(token);

  const loadShopData = useCallback(async () => {
    try {
      const [shopRes, productsRes] = await Promise.all([
        api.get<{ success: boolean; data: Shop }>(`/api/shops/${shopId}`, token || undefined),
        api.get<{ success: boolean; data: Product[] }>(`/api/shops/${shopId}/products`, token || undefined),
      ]);
      if (shopRes.success) setShop(shopRes.data);
      if (productsRes.success) setProducts(productsRes.data);

      if (token) {
        const chatRes = await api.post<{ success: boolean; data: { chatId: string; messages: Message[] } }>(
          '/api/chats', { shopId }, token
        );
        if (chatRes.success) {
          setChatId(chatRes.data.chatId);
          setMessages(chatRes.data.messages || []);
        }
      }

      const cartRes = await api.get<{ success: boolean; data: { items: unknown[] } }>(
        `/api/cart/${shopId}`, token || undefined
      );
      if (cartRes.success) setCartCount(cartRes.data?.items?.length || 0);
    } catch (err) { console.error('Failed to load shop:', err); }
    setLoading(false);
  }, [token, shopId]);

  useEffect(() => {
    if (!token) {
      // Guest: keep the cart badge from the local guest cart.
      setCartCount(guestCartCount());
    }
  }, [token]);

  useEffect(() => {
    if (!shopId) return;
    loadShopData();
  }, [token, shopId, loadShopData]);

  useEffect(() => {
    if (!chatId || !isConnected || hasJoinedRef.current) return;
    joinChat(chatId);
    hasJoinedRef.current = true;
  }, [chatId, isConnected, joinChat]);

  useEffect(() => {
    const cleanup = onMessage((message: Message) => {
      setMessages((prev) => (prev.some((existing) => existing.id === message.id) ? prev : [...prev, message]));
    });
    return cleanup;
  }, [onMessage]);

  useEffect(() => {
    const cleanup1 = onTyping((data) => {
      if (data.chatId === chatId && data.userId !== user?.id) {
        setIsOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
      }
    });
    const cleanup2 = onStopTyping((data) => {
      if (data.chatId === chatId) setIsOtherTyping(false);
    });
    return () => { cleanup1(); cleanup2(); };
  }, [onTyping, onStopTyping, chatId, user?.id]);

  const refreshChatMessages = useCallback(async () => {
    if (!chatId || !token) return;
    const refreshed = await api.get<{ success: boolean; data: { messages: Message[] } }>(`/api/chats/${chatId}`, token);
    if (refreshed.success) setMessages(refreshed.data.messages || []);
  }, [chatId, token]);

  const chitiCall = useChitiConnectCall({ token, chatId, onRecorded: refreshChatMessages });

  const handleSendMessage = useCallback(async (content: string) => {
    if (!chatId) return;

    // Customer chat now enters the Shop Bot parser so free-form Hinglish lists
    // become persisted BasketDraft commerce state. If the parser is unavailable,
    // fall back to the existing realtime text chat to preserve messaging.
    if (user?.id && token) {
      try {
        const parsed = await api.post<{ success: boolean; data: { draft?: unknown } }>(
          '/api/shop-bot/parse',
          {
            customerId: user.id,
            shopId,
            conversationId: chatId,
            message: content,
            locale: 'hinglish',
            clientActionId: `${chatId}:${Date.now()}`,
          },
          token,
        );
        if (parsed.success) {
          await refreshChatMessages();
          return;
        }
      } catch (err) {
        console.error('Shop Bot parse failed, falling back to raw chat:', err);
      }
    }

    sendMessage(chatId, content);
  }, [chatId, refreshChatMessages, sendMessage, shopId, token, user?.id]);

  const handleSendVoiceNote = useCallback(async (audio: Blob, meta: { mimeType: string; durationMs: number }) => {
    if (!chatId || !token || !user?.id) return;
    const formData = new FormData();
    formData.append('customerId', user.id);
    formData.append('shopId', shopId);
    formData.append('conversationId', chatId);
    formData.append('locale', 'hinglish');
    formData.append('durationMs', String(meta.durationMs));
    formData.append('clientActionId', `${chatId}:voice:${Date.now()}`);
    formData.append('audio', audio, `voice-order-${Date.now()}.webm`);

    const response = await fetch(`${API_URL}/api/shop-bot/voice-order`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Voice order upload failed');
    await refreshChatMessages();
  }, [chatId, refreshChatMessages, shopId, token, user?.id]);

  const handleSendProduct = useCallback((product: { name: string; price: number; unit: string; image?: string }) => {
    if (!chatId) return;
    sendProductMessage(chatId, product);
  }, [chatId, sendProductMessage]);

  const handleTyping = useCallback(() => { if (chatId) sendTyping(chatId); }, [chatId, sendTyping]);
  const handleStopTyping = useCallback(() => { if (chatId) sendStopTyping(chatId); }, [chatId, sendStopTyping]);
  const handleMarkRead = useCallback(() => { if (chatId) markRead(chatId); }, [chatId, markRead]);

  const handleCallShop = () => {
    if (!token) {
      router.push('/login');
      return;
    }
    setActiveTab('chat');
    if (chitiCall.status === 'LIVE') {
      chitiCall.endCall('ENDED');
    } else if (chitiCall.status === 'RINGING') {
      chitiCall.endCall('NO_ANSWER');
    } else {
      chitiCall.startCall();
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!token) {
      // Guest: stash locally, merge on login. Cart badge updates instantly.
      addToGuestCart({
        productId: product.id,
        shopId,
        shopName: shop?.name || 'Local Shop',
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.image,
      }, 1);
      setCartCount(guestCartCount());
      track({ type: 'guest_add_to_cart', productId: product.id, shopId });
      return;
    }
    try {
      await api.post('/api/cart', { shopId, productId: product.id, quantity: 1 }, token);
      setCartCount((prev) => prev + 1);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface">
      <header className="glass-panel bg-surface/85 backdrop-blur-xl sticky top-0 z-50 shadow-top-bar">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} aria-label="Go back" className="active:scale-95 transition-transform text-on-surface-variant hover:text-primary">
              <Icon name="arrow_back" />
            </button>
            <div className="flex flex-col">
              <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface">{shop?.name || 'Shop'}</h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Icon name="verified" size="sm" filled className="text-secondary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Trusted Dukaan</span>
                </span>
                {shop && (
                  <>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary">
                      <Icon name="star" size="sm" filled />
                      {shop.rating.toFixed(1)}
                    </span>
                    {shop.distance != null && (
                      <span className="text-[10px] font-bold text-on-surface-variant">
                        {shop.distance} km
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCallShop}
              disabled={!token || !chatId}
              className={`flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold active:scale-95 transition-transform disabled:opacity-50 ${
                chitiCall.status === 'LIVE'
                  ? 'bg-error text-white'
                  : chitiCall.status === 'RINGING'
                    ? 'bg-warning-container text-on-surface animate-pulse'
                    : 'bg-primary text-on-primary'
              }`}
              aria-label="Call shop via Chiti-Connect"
            >
              <Icon name={chitiCall.status === 'LIVE' ? 'call_end' : 'call'} size="sm" />
              {chitiCall.status === 'RINGING' ? 'RINGING' : chitiCall.status === 'LIVE' ? 'LIVE' : 'CALL SHOP'}
            </button>
            <button className="active:scale-95 transition-transform text-primary" aria-label="Notifications">
              <Icon name="notifications" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto pb-32">
        {shop?.image && (
          <section className="px-6 pt-6 pb-4">
            <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-sm">
              <Image fill sizes="100vw" alt={shop.name} className="object-cover" src={shop.image} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <p className="text-white text-sm font-medium italic">&quot;Apni local dukaan, ab online&quot;</p>
              </div>
            </div>
          </section>
        )}

        <nav className="px-6 py-2 sticky top-[72px] bg-surface z-40">
          <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-headline font-semibold transition-colors ${
                activeTab === 'products' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon name="shopping_bag" size="md" />
              Products
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-headline font-semibold transition-colors ${
                activeTab === 'chat' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon name="chat" size="md" />
              Chat
            </button>
          </div>
        </nav>

        {activeTab === 'products' ? (
          <section className="px-6 mt-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">Available samaan</h2>
                <p className="text-on-surface-variant text-sm mt-1">Fresh stock from your neighborhood favorite</p>
              </div>
              <button className="text-primary font-bold text-xs flex items-center gap-1 bg-primary-fixed px-3 py-1.5 rounded-full whitespace-nowrap">
                Filters <Icon name="tune" size="sm" />
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon name="inventory_2" size="xl" className="text-on-surface-variant" />
                </div>
                <p className="text-on-surface-variant">Abhi koi product nahi hai</p>
                <p className="text-on-surface-variant/60 text-sm mt-1">Chat mein shopkeeper se poochein!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-surface-container-lowest rounded-md p-4 flex flex-col gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-transparent hover:border-primary/10 transition-all active:scale-[0.98]"
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface-container">
                      <Image
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        alt={product.name}
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        src={product.image || '/placeholder.jpg'}
                      />
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-headline font-bold text-on-surface leading-tight">{product.name}</h3>
                        <p className="text-on-surface-variant text-xs mt-1">{product.unit}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold tracking-widest text-on-surface-variant uppercase bg-surface-container px-1.5 py-0.5 rounded">MRP</span>
                        <span className="font-headline font-black text-lg text-primary">₹{product.price}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.isAvailable}
                      className="w-full leaf-gradient text-on-primary font-headline font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="add" size="sm" />
                      {product.isAvailable ? 'Add to bag' : 'Stock khatam'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <section className="mt-20 mb-12">
              <div className="bg-primary-fixed/30 rounded-[32px] p-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-primary-container flex items-center justify-center">
                    <Icon name="person" size="xl" className="text-on-primary-container" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="font-headline font-extrabold text-2xl text-on-primary-fixed">Meet the Shopkeeper</h3>
                    <p className="text-on-primary-fixed-variant mt-2 max-w-md leading-relaxed">&quot;Serving this community for over 25 years with honesty and fresh supplies. Now bringing our personalized service to your doorstep via Chiti Bazaar.&quot;</p>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
              </div>
            </section>
          </section>
        ) : !token ? (
          <div className="px-6 py-20 text-center space-y-5">
            <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto">
              <Icon name="chat" size="xl" className="text-on-surface-variant" />
            </div>
            <div>
              <p className="text-on-surface-variant font-medium">Chat karein ke liye login karein</p>
              <p className="text-on-surface-variant/60 text-sm mt-1">Shopkeeper se seedha baat karein</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="mx-auto leaf-gradient text-on-primary font-headline font-bold px-8 py-3 rounded-xl active:scale-95 transition-all"
            >
              Login karein
            </button>
          </div>
        ) : (
          <div className="px-6 mt-4 h-[calc(100vh-200px)]">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onSendProduct={handleSendProduct}
              onSendVoiceNote={handleSendVoiceNote}
              onAddToCart={handleAddToCart}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
              onMarkRead={handleMarkRead}
              isOtherTyping={isOtherTyping}
              currentUserRole="customer"
              isConnected={isConnected}
            />
          </div>
        )}
      </main>

      {cartCount > 0 && (
        <button
          onClick={() => router.push('/customer/cart')}
          className="fixed bottom-6 right-4 leaf-gradient text-on-primary px-5 py-3 rounded-2xl shadow-brand-glow flex items-center gap-2 z-30 active:scale-90 transition-transform"
        >
          <Icon name="shopping_cart" />
          <span className="font-semibold">Cart Dekhein</span>
          <span className="bg-surface-container-lowest text-primary text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        </button>
      )}
    </div>
  );
}
