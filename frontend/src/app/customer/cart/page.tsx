'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, Badge } from '@/components/ui';
import AppShell from '@/components/AppShell';
import CatalogTile from '@/components/CatalogTile';
import { useAuth } from '@/hooks/useAuth';
import { Cart, CartItem } from '@/types';
import { api } from '@/lib/api';
import { GuestCartItem, getGuestCart, updateGuestQuantity, removeGuestItem } from '@/lib/guestCart';

interface CartViewItem {
  key: string;
  productId: string;
  name: string;
  unit: string;
  image: string;
  icon?: string;
  from?: string;
  to?: string;
  quantity: number;
  price: number;
}

export default function CartPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const loadCart = useCallback(async () => {
    if (!token) {
      // Guest cart is local — no network.
      const items = getGuestCart();
      setGuestItems(items);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: Cart }>('/api/cart', token);
      if (res.success) setCart(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!token) {
      updateGuestQuantity(productId, quantity);
      setGuestItems(getGuestCart());
      return;
    }
    if (!cart) return;
    try {
      if (quantity <= 0) {
        await api.delete(`/api/cart/${cart.shopId}/items/${productId}`, token);
      } else {
        await api.put(`/api/cart/${cart.shopId}/items`, { productId, quantity }, token);
      }
      await loadCart();
    } catch (err) { console.error(err); }
  };

  const handleRemove = async (productId: string) => {
    if (!token) {
      removeGuestItem(productId);
      setGuestItems(getGuestCart());
      return;
    }
    await handleUpdateQuantity(productId, 0);
  };

  const handlePlaceOrder = async () => {
    if (!cart || !token) return;
    setOrdering(true);
    try {
      const res = await api.post<{ success: boolean; data: { orderId: string } }>(
        '/api/orders', { shopId: cart.shopId }, token
      );
      if (res.success) {
        setOrderSuccess(true);
        setTimeout(() => router.push(`/customer/orders/${res.data.orderId}/confirm`), 900);
      }
    } catch (err) { console.error(err); }
    setOrdering(false);
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 bg-secondary-container rounded-full flex items-center justify-center mb-6">
          <Icon name="check_circle" size="xl" className="text-secondary" filled />
        </div>
        <h2 className="text-2xl font-extrabold text-on-surface font-headline mb-2">Order ho gaya!</h2>
        <p className="text-on-surface-variant">Shopkeeper ko message bhej diya</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isGuest = !token;
  const guestShops = isGuest ? Array.from(new Set(guestItems.map((i) => i.shopId))).length : 1;
  const guestTitle = isGuest
    ? guestShops > 1
      ? 'Multiple dukaanein'
      : guestItems[0]?.shopName || 'Aapki dukaan'
    : cart?.shopName || 'Shop';
  const viewItems: CartViewItem[] = isGuest
    ? guestItems.map((i) => ({
        key: i.productId,
        productId: i.productId,
        name: i.name,
        unit: i.unit,
        image: i.image,
        icon: i.icon,
        from: i.from,
        to: i.to,
        quantity: i.quantity,
        price: i.price,
      }))
    : (cart?.items || []).map((item: CartItem) => ({
        key: item.id,
        productId: item.productId,
        name: item.product.name,
        unit: item.product.unit,
        image: item.product.image,
        quantity: item.quantity,
        price: item.price,
      }));

  const total = viewItems.reduce((sum: number, item: CartViewItem) => sum + item.price * item.quantity, 0);

  const emptyView = (
    <AppShell role="customer" guest={isGuest} showTopNav={false}>
      <div className="pt-24 flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
          <Icon name="shopping_cart" size="xl" className="text-outline-variant" />
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Cart khali hai</h3>
        <p className="text-on-surface-variant">Kuch items add karein apni dukaan se</p>
      </div>
    </AppShell>
  );

  if (viewItems.length === 0) return emptyView;

  return (
    <div className="bg-background min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md shadow-top-bar flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-primary active:scale-95 transition-transform">
            <Icon name="arrow_back" />
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface">Aapka cart</h1>
        </div>
        <span className="font-headline font-extrabold text-primary italic">Chiti Bazaar</span>
      </header>

      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-8">
        <section className="flex items-center justify-between bg-surface-container-lowest p-6 rounded-xl shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icon name="storefront" className="text-secondary" />
              <h2 className="text-xl font-bold text-on-surface truncate">
                {guestTitle}
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant font-medium italic opacity-80">&apos;Apni local dukaan, ab online&apos;</p>
          </div>
          {!(isGuest && guestShops > 1) && (
            <Badge variant="info">
              <Icon name="verified" size="sm" filled className="mr-1" />
              VERIFIED
            </Badge>
          )}
        </section>

        {isGuest && (
          <section className="flex gap-3 items-center p-4 border border-primary/20 rounded-xl bg-primary-fixed/20">
            <Icon name="info" className="text-primary" />
            <p className="text-sm text-on-surface-variant">
              Aap guest mode mein hain. Order karne ke liye login karein — aapka cart apne aap merge ho jayega.
            </p>
          </section>
        )}

        <section className="space-y-6">
          {viewItems.map((item) => (
            <div key={item.key} className="grid grid-cols-[100px_1fr] gap-6 bg-surface-container-low p-4 rounded-xl items-center">
              <CatalogTile
                image={item.image}
                icon={item.icon}
                from={item.from}
                to={item.to}
                name={item.name}
                className="w-[100px] h-[100px] !rounded-xl"
                iconClassName="text-3xl"
              />
              <div className="flex flex-col justify-between h-full py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-on-surface">{item.name}</h3>
                    <p className="text-sm text-on-surface-variant">{item.unit}</p>
                  </div>
                  <span className="font-bold text-on-surface">₹{item.price}</span>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center bg-surface-container-highest rounded-lg overflow-hidden">
                    <button onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)} aria-label="Decrease quantity" className="px-3 py-1 hover:bg-primary-fixed transition-colors">
                      <Icon name="remove" size="sm" />
                    </button>
                    <span className="px-3 font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)} aria-label="Increase quantity" className="px-3 py-1 hover:bg-primary-fixed transition-colors">
                      <Icon name="add" size="sm" />
                    </button>
                  </div>
                  <button onClick={() => handleRemove(item.productId)} aria-label="Remove item" className="text-on-surface-variant hover:text-error transition-colors">
                    <Icon name="delete" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="bg-surface-container-low rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
            <Icon name="receipt" className="text-primary" />
            Bill details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Items total</span>
              <span>₹{total}</span>
            </div>
            <div className="flex justify-between text-sm text-on-surface-variant">
              <span>Delivery partner fee</span>
              <span className="text-secondary font-medium">FREE</span>
            </div>
            <div className="h-px bg-outline-variant/20 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-on-surface">Total amount</span>
              <span className="text-xl font-extrabold text-on-surface">₹{total}</span>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest/90 backdrop-blur-xl px-6 pt-4 pb-8 shadow-bottom-nav flex flex-col gap-4 z-40">
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">PAYING</span>
            <span className="text-lg font-extrabold text-on-surface">₹{total}</span>
          </div>
          <div className="flex items-center gap-1 text-secondary text-sm font-bold">
            <Icon name="verified_user" size="sm" />
            100% Secure
          </div>
        </div>
        {isGuest ? (
          <a
            href="/login"
            className="w-full py-4 rounded-xl leaf-gradient text-on-primary font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Login karke order karein
            <Icon name="chevron_right" />
          </a>
        ) : (
          <button
            onClick={handlePlaceOrder} disabled={ordering}
            className="w-full py-4 rounded-xl leaf-gradient text-on-primary font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {ordering ? 'Order ho raha hai...' : 'Order karein'}
            <Icon name="chevron_right" />
          </button>
        )}
      </div>
    </div>
  );
}
