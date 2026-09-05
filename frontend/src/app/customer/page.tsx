'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import HeroGreeting from '@/components/HeroGreeting';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import ShopCard from '@/components/ShopCard';
import VendorCTA from '@/components/VendorCTA';
import EmptyState from '@/components/EmptyState';
import { Icon } from '@/components/ui';
import { ShopSkeleton } from '@/components/Skeletons';
import { useAuth } from '@/hooks/useAuth';
import { Shop } from '@/types';
import { api } from '@/lib/api';
import { guestCartCount } from '@/lib/guestCart';
import { track } from '@/lib/analytics';

const SHOP_CATEGORIES = ['Sab', 'Grocery', 'Daily use', 'Vegetables', 'Fruits', 'Dairy'];

export default function CustomerHomePage() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Sab');
  const [cartCount, setCartCount] = useState(0);

  const loadShops = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Shop[] }>('/api/shops', token || undefined);
      if (res.success) setShops(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [token]);

  const loadCartCount = useCallback(async () => {
    if (!token) {
      // Guest: read the local guest cart so the FAB badge stays live.
      setCartCount(guestCartCount());
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: { items: unknown[] } }>('/api/cart', token);
      if (res.success && res.data?.items) setCartCount(res.data.items.length);
    } catch {}
  }, [token]);

  useEffect(() => {
    track({ type: 'view', page: '/customer' });
    loadShops();
    loadCartCount();
  }, [loadShops, loadCartCount]);

  const filteredShops = shops.filter(
    (shop) =>
      shop.name.toLowerCase().includes(search.toLowerCase()) ||
      shop.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell
      role="customer"
      guest={!token}
      showFab
      fabCount={cartCount}
      onFabClick={() => router.push('/customer/cart')}
    >
      <HeroGreeting name={token ? user?.name : undefined} />

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onSearch={() => {}}
      />

      <CategoryFilter
        categories={SHOP_CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <section className="mb-12">
        <div className="relative min-h-[240px] rounded-[2rem] overflow-hidden bg-surface-container p-8 flex flex-col justify-center border border-primary/15">
          {/* Obsidian + leaf ambient backdrop */}
          <div className="absolute inset-0 leaf-ambient-glow" />
          <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-primary/20 blur-[90px]" />
          <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-secondary/10 blur-[80px]" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full">
                <Icon name="bolt" size="sm" filled />
                10 minute delivery
              </span>
            </div>
            <h2 className="text-white text-3xl sm:text-4xl font-black leading-tight font-headline max-w-xl">
              Fresh Veggies &amp; Kirana in <span className="leaf-text-gradient">10 mins</span> from your trusted neighborhood dukaans
            </h2>
            <p className="text-on-surface-variant mt-3 max-w-md text-sm font-medium">
              Support your local shopkeepers while shopping as fast as any big app.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-on-surface font-headline">
              Aapke paas ki dukaan
            </h3>
            <p className="text-sm text-on-surface-variant">Handpicked stores in your vicinity</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <ShopSkeleton key={i} />
            ))}
          </div>
        ) : filteredShops.length === 0 ? (
          <EmptyState
            icon="storefront"
            title="Abhi koi dukaan available nahi hai"
            description="Hamare network mein naye stores jud rahe hain. Kripya thodi der baad dekhen."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredShops.map((shop) => (
              <ShopCard
                key={shop.id}
                id={shop.id}
                name={shop.name}
                image={shop.image}
                rating={shop.rating}
                distance={shop.distance}
                isOpen={shop.isActive}
                href={`/customer/shop/${shop.id}`}
              />
            ))}
          </div>
        )}
      </section>

      <VendorCTA />
    </AppShell>
  );
}
