'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AppShell from '@/components/AppShell';
import HeroGreeting from '@/components/HeroGreeting';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import ShopCard from '@/components/ShopCard';
import VendorCTA from '@/components/VendorCTA';
import EmptyState from '@/components/EmptyState';
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
        <div className="relative h-48 rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary to-primary-container p-8 flex flex-col justify-center">
          <Image
            fill
            sizes="100vw"
            className="object-cover mix-blend-overlay opacity-30"
            alt="Local indian grocery store"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAO-TstSaBb3wfU3VfxbMuTYoitpw2y9i41UHhNWd9yr2tr-x1yvq4jux8jSnf3wF-zlzVIc37Ti6thucTZuXj2MgKM8DYVO52-yRv1xt_KhJG0SJ8uZ3u_Fx2GmL3lbKn234GQaNYINoB3Gu1Cd2eGLUALIqf5GurSsWv3Ag4nvMuT4HSl8tT10ZYk8fGFgptdvXApS8YDP9gVrO9FiZtyHlHr1_kpfM2UgwEbnKBdyUyaVP_rWyjsHzkFPy5LHzk1g6rUxmANOjQ"
          />
          <div className="relative z-10">
            <span className="bg-black/20 backdrop-blur-sm text-white text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full">
              Local Pride
            </span>
            <h2 className="text-white text-3xl font-black mt-3 leading-tight font-headline">
              Support your neighborhood<br />merchants today.
            </h2>
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
