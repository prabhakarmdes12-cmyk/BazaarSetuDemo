'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import ProductCard from '@/components/ProductCard';
import ShopCard from '@/components/ShopCard';
import VendorCTA from '@/components/VendorCTA';
import EmptyState from '@/components/EmptyState';
import { Icon } from '@/components/ui';
import { ShopSkeleton } from '@/components/Skeletons';
import { useAuth } from '@/hooks/useAuth';
import { Shop, Product } from '@/types';
import { api } from '@/lib/api';
import {
  addToGuestCart,
  getGuestCart,
  guestCartCount,
  updateGuestQuantity,
  GuestCartItem,
} from '@/lib/guestCart';
import { track } from '@/lib/analytics';

const SHOP_CATEGORIES = ['Sab', 'Dairy', 'Grains', 'Oil', 'Snacks', 'Beverages', 'Home Care', 'Personal Care'];

// Built-in starter pilot products for Ashok Nagar / Ranchi so shelves are immediately populated
const FALLBACK_PILOT_PRODUCTS: Product[] = [
  {
    id: 'p-milk',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Amul Taaza Toned Fresh Milk',
    description: 'Fresh pasteurized toned milk with 3.0% fat, 8.5% SNF.',
    price: 28,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    category: 'Dairy',
    unit: 'pouch',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-atta',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Aashirvaad Shudh Chakki Whole Wheat Atta',
    description: '100% pure whole wheat grain flour with 0% maida.',
    price: 44,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    category: 'Grains',
    unit: 'kg',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-oil',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Fortune Sunlite Refined Sunflower Oil',
    description: 'Light and healthy cooking oil enriched with vitamins A & D.',
    price: 155,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    category: 'Oil',
    unit: 'litre',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-maggi',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Maggi 2-Minute Masala Instant Noodles',
    description: 'Classic favorite noodle pack with signature tastemaker spices.',
    price: 14,
    image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    category: 'Snacks',
    unit: 'pack',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-parle',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Parle-G Gold Glucose Biscuits',
    description: 'Crispy golden tea-time biscuits packed with goodness of wheat.',
    price: 10,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
    category: 'Snacks',
    unit: 'pack',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-tea',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Brooke Bond Red Label Strong Tea',
    description: 'Strong Assam tea grains with rich flavor and aroma.',
    price: 135,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    category: 'Beverages',
    unit: 'pack',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-toor',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Tata Sampann Unpolished Toor Dal',
    description: 'High protein unpolished arhar dal with natural taste.',
    price: 168,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    category: 'Grains',
    unit: 'kg',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-salt',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Tata Salt Vacuum Evaporated Iodised',
    description: 'Desh ka namak with guaranteed purity and right iodine.',
    price: 24,
    image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=600&auto=format&fit=crop&q=80',
    category: 'Grains',
    unit: 'kg',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-surf',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Surf Excel Quick Wash Detergent Powder',
    description: 'Tough stain removal in just 1 wash, gentle on fabrics.',
    price: 128,
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
    category: 'Home Care',
    unit: 'pack',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-dettol',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Dettol Original Germ Protection Bath Soap',
    description: '100% better protection against illness-causing germs.',
    price: 38,
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&auto=format&fit=crop&q=80',
    category: 'Personal Care',
    unit: 'bar',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-vim',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Vim Dishwash Bar with Lemon Power',
    description: 'Cuts through stubborn grease with natural lemon extract.',
    price: 10,
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80',
    category: 'Home Care',
    unit: 'bar',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-colgate',
    shopId: '33d3b547-cf75-411b-88e4-1b5f1c0e8da0',
    name: 'Colgate Strong Teeth Dental Cream Toothpaste',
    description: 'Cavity protection formula with calcium and active fluoride.',
    price: 58,
    image: 'https://images.unsplash.com/photo-1559591937-e62fb330914c?w=600&auto=format&fit=crop&q=80',
    category: 'Personal Care',
    unit: 'tube',
    isAvailable: true,
    createdAt: new Date().toISOString(),
  },
];

export default function CustomerHomePage() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>(FALLBACK_PILOT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Sab');
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  const refreshCartState = useCallback(() => {
    const items = getGuestCart();
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
    const qtyMap: Record<string, number> = {};
    for (const item of items) {
      qtyMap[item.productId] = item.quantity;
    }
    setCartCount(count);
    setCartTotal(total);
    setCartQuantities(qtyMap);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: Shop[] }>('/api/shops', token || undefined);
      if (res.success && res.data.length > 0) {
        setShops(res.data);
        // Load live products from the primary pilot shop
        const primaryShopId = res.data[0].id;
        try {
          const prodRes = await api.get<{ success: boolean; data: Product[] }>(
            `/api/shops/${primaryShopId}/products`,
            token || undefined
          );
          if (prodRes.success && prodRes.data.length > 0) {
            // Merge with fallback products to guarantee rich coverage
            const serverProducts = prodRes.data;
            const merged = [...serverProducts];
            for (const fallback of FALLBACK_PILOT_PRODUCTS) {
              if (!merged.some((p) => p.name.toLowerCase() === fallback.name.toLowerCase())) {
                merged.push(fallback);
              }
            }
            setProducts(merged);
          }
        } catch {
          // Keep rich fallback products if shop products fail
        }
      }
    } catch (err) {
      console.error('Failed to load shops:', err);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    track({ type: 'view', page: '/customer' });
    loadData();
    refreshCartState();
  }, [loadData, refreshCartState]);

  const handleAddToCart = (product: Product) => {
    const primaryShop = shops[0];
    addToGuestCart(
      {
        productId: product.id,
        shopId: product.shopId || primaryShop?.id || 'pilot-shop',
        shopName: primaryShop?.name || 'Gupta General Store',
        name: product.name,
        price: product.price,
        unit: product.unit || 'unit',
        image: product.image || '',
      },
      1
    );
    refreshCartState();
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateGuestQuantity(productId, quantity);
    refreshCartState();
  };

  // Filtered by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        activeCategory === 'Sab' ||
        (p.category && p.category.toLowerCase() === activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);

  // Product Shelves
  const dailyMilkShelf = useMemo(
    () => products.filter((p) => ['Dairy'].includes(p.category)),
    [products]
  );
  const staplesShelf = useMemo(
    () => products.filter((p) => ['Grains', 'Oil', 'Essentials', 'Pulses'].includes(p.category)),
    [products]
  );
  const snacksShelf = useMemo(
    () => products.filter((p) => ['Snacks', 'Beverages'].includes(p.category)),
    [products]
  );
  const homeCareShelf = useMemo(
    () => products.filter((p) => ['Home Care', 'Personal Care'].includes(p.category)),
    [products]
  );

  return (
    <AppShell
      role="customer"
      guest={!token}
      showFab={false}
    >
      {/* 10-Minute Fast Delivery Location Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl leaf-gradient flex items-center justify-center text-white shadow-brand-glow">
            <Icon name="bolt" size="md" filled />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-primary font-headline">
                Delivery in 10 minutes
              </span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
            </div>
            <p className="text-sm font-bold text-on-surface flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
              <span>Ashok Nagar Road No. 4, Ranchi</span>
              <Icon name="keyboard_arrow_down" size="sm" />
            </p>
          </div>
        </div>

        {/* Quick Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/vendor')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-white/10 hover:border-primary/40 text-xs font-bold text-on-surface-variant hover:text-primary transition-all active:scale-95"
          >
            <Icon name="storefront" size="sm" />
            <span>Dukaan Partner</span>
          </button>
        </div>
      </div>

      {/* Instant Live Search */}
      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onSearch={() => {}}
        placeholder="Search 'Amul milk', 'Aashirvaad atta', 'Maggi'..."
      />

      {/* Category Pills Strip */}
      <CategoryFilter
        categories={SHOP_CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Featured Hero Banner */}
      {search === '' && activeCategory === 'Sab' && (
        <section className="mb-10">
          <div className="relative min-h-[200px] sm:min-h-[220px] rounded-3xl overflow-hidden bg-surface-container-low p-6 sm:p-8 flex flex-col justify-center border border-primary/20 shadow-editorial-lg">
            <div className="absolute inset-0 leaf-ambient-glow" />
            <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-primary/25 blur-[90px]" />
            <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-secondary/15 blur-[80px]" />

            <div className="relative z-10 max-w-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 bg-primary/20 border border-primary/40 text-primary text-[11px] font-black tracking-wider uppercase px-3 py-1 rounded-full font-headline shadow-sm">
                  <Icon name="bolt" size="sm" filled />
                  Lightning Fast
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  Gupta General Store &bull; 800m away
                </span>
              </div>
              <h2 className="text-white text-2xl sm:text-3xl font-black leading-tight font-headline">
                Daily Essentials &amp; Kirana in <span className="leaf-text-gradient">10 mins</span>
              </h2>
              <p className="text-on-surface-variant mt-2 text-xs sm:text-sm font-medium">
                Support your trusted local shopkeeper while getting instant 10-minute doorstep delivery.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Filtered or Search View */}
      {search !== '' || activeCategory !== 'Sab' ? (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface font-headline">
                {search ? `Results for "${search}"` : activeCategory}
              </h3>
              <p className="text-xs text-on-surface-variant">{filteredProducts.length} items available</p>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <EmptyState
              icon="search_off"
              title="Koi product nahi mila"
              description="Kripya doosra naam search karein ya category badlein."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={cartQuantities[product.id] || 0}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Curated Fresh Grocery Shelves */
        <div className="space-y-12">
          {/* Shelf 1: Daily Milk & Breakfast */}
          {dailyMilkShelf.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🥛</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface font-headline">
                      Daily Milk &amp; Breakfast
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium">
                      Fresh milk, curd, bread &amp; morning essentials in 10 mins
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {dailyMilkShelf.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={cartQuantities[product.id] || 0}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Shelf 2: Atta, Rice, Dal & Oils */}
          {staplesShelf.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🌾</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface font-headline">
                      Atta, Rice, Dals &amp; Oils
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium">
                      Kitchen staples &amp; cooking essentials from local dukaans
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {staplesShelf.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={cartQuantities[product.id] || 0}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Shelf 3: Snacks & Munchies */}
          {snacksShelf.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🍿</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface font-headline">
                      Munchies, Biscuits &amp; Beverages
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium">
                      Instant noodles, tea, coffee &amp; evening tea snacks
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {snacksShelf.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={cartQuantities[product.id] || 0}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Shelf 4: Cleaning & Personal Care */}
          {homeCareShelf.length > 0 && (
            <section>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🧼</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface font-headline">
                      Cleaning &amp; Personal Care
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium">
                      Soaps, detergents, pest control &amp; hygiene
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {homeCareShelf.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={cartQuantities[product.id] || 0}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Neighborhood Kirana Dukaans */}
          <section className="pt-6 border-t border-white/5">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface font-headline">
                  Aapke paas ki local dukaans
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Orders are packed and dispatched directly from these verified neighborhood stores
                </p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <ShopSkeleton key={i} />
                ))}
              </div>
            ) : shops.length === 0 ? (
              <EmptyState
                icon="storefront"
                title="Abhi koi dukaan available nahi hai"
                description="Hamare network mein naye stores jud rahe hain. Kripya thodi der baad dekhen."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop) => (
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
        </div>
      )}

      {/* Floating Quick Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-28 sm:bottom-8 left-0 right-0 z-50 px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="max-w-xl mx-auto pointer-events-auto">
            <div className="leaf-gradient text-white rounded-2xl p-4 shadow-editorial-lg flex items-center justify-between border border-emerald-400/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                  <Icon name="shopping_cart" filled className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black font-headline tracking-tight">
                    {cartCount} {cartCount === 1 ? 'item' : 'items'} &bull; ₹{cartTotal}
                  </p>
                  <p className="text-[11px] text-white/80 font-medium flex items-center gap-1">
                    <Icon name="bolt" size="sm" filled />
                    Delivery in 10 mins
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/customer/cart')}
                className="bg-white text-emerald-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 hover:bg-white/90 active:scale-95 transition-all shadow-md font-headline uppercase tracking-wider"
              >
                <span>View Cart</span>
                <Icon name="arrow_forward" size="sm" />
              </button>
            </div>
          </div>
        </div>
      )}

      <VendorCTA />
    </AppShell>
  );
}
