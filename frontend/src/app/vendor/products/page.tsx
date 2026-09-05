'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppShell from '@/components/AppShell';
import ProductCard from '@/components/ProductCard';
import CatalogTile from '@/components/CatalogTile';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/types';
import { api } from '@/lib/api';
import {
  BIGHI_CATEGORIES,
  BIGHI_CATALOG,
  BIGHI_ESSENTIALS,
  BighiProduct,
} from '@/lib/bighiCatalog';

type Tab = 'inventory' | 'catalog' | 'custom';

// ---- Local (offline) store for catalog adds, so the picker works in previews
// even before a vendor backend exists. Server-added products are merged on top.
const LOCAL_STORE_KEY = 'chitibazaar_my_store_catalog';

type LocalCatalogItem = BighiProduct & { addedAt: number };

function readLocalCatalog(): LocalCatalogItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORE_KEY) || '[]');
  } catch {
    return [];
  }
}
function writeLocalCatalog(items: LocalCatalogItem[]) {
  try {
    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(items));
  } catch {
    /* best-effort */
  }
}

const bighiToProduct = (b: BighiProduct): Product => ({
  id: b.id,
  shopId: 'master-catalog',
  name: b.name,
  description: '',
  price: b.price,
  mrp: b.mrp,
  image: '',
  category: b.category,
  unit: b.unit,
  isAvailable: true,
  createdAt: new Date().toISOString(),
});

export default function VendorProductsPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('inventory');

  // --- My Dukaan inventory (server) + locally-added catalog items ---
  const [products, setProducts] = useState<Product[]>([]);
  const [localItems, setLocalItems] = useState<LocalCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Master catalog browser ---
  const [catFilter, setCatFilter] = useState<string>('All');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [inStore, setInStore] = useState<Set<string>>(new Set());

  // --- Quick-add essentials panel ---
  const [essentialsOpen, setEssentialsOpen] = useState(true);
  const [essentialsCat, setEssentialsCat] = useState<string>('All');
  const [essentialsOnly, setEssentialsOnly] = useState(false);

  // --- Custom product form ---
  const [form, setForm] = useState({
    name: '',
    price: '',
    mrp: '',
    unit: 'pack',
    category: BIGHI_CATEGORIES[0].label,
    image: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const loadProducts = useCallback(async () => {
    setLocalItems(readLocalCatalog());
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ success: boolean; data: Product[] }>('/api/products/vendor', token);
      if (res.success) setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!authLoading && !token) {
      // Allow browsing the catalog; still load local items.
      loadProducts();
      return;
    }
    if (token) loadProducts();
  }, [token, authLoading, loadProducts]);

  // Seed the "already in store" set from local catalog adds.
  useEffect(() => {
    setInStore(new Set(localItems.map((i) => i.id)));
  }, [localItems]);

  // --- Catalog filtering ---
  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return BIGHI_CATALOG.filter((p) => {
      const matchCat = catFilter === 'All' || p.category === catFilter;
      const matchQ =
        !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchEssential = !essentialsOnly || p.essential === true;
      return matchCat && matchQ && matchEssential;
    });
  }, [catFilter, catalogSearch, essentialsOnly]);

  // Essentials shown in the quick-add panel, filtered by its own dropdown.
  const visibleEssentials = useMemo(
    () =>
      essentialsCat === 'All'
        ? BIGHI_ESSENTIALS
        : BIGHI_ESSENTIALS.filter((p) => p.category === essentialsCat),
    [essentialsCat],
  );

  const countsByCat = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of BIGHI_CATALOG) map[p.category] = (map[p.category] || 0) + 1;
    return map;
  }, []);

  // --- Actions: add master catalog item(s) to my store ---
  const persistLocal = useCallback((items: LocalCatalogItem[]) => {
    setLocalItems(items);
    writeLocalCatalog(items);
    setInStore(new Set(items.map((i) => i.id)));
  }, []);

  const addCatalogItem = useCallback(
    async (b: BighiProduct) => {
      if (inStore.has(b.id)) return;
      // Try the real vendor API when authenticated; otherwise keep locally.
      if (token) {
        try {
          await api.post(
            '/api/products',
            { name: b.name, price: b.price, unit: b.unit, category: b.category, description: b.unit },
            token,
          );
          await loadProducts();
        } catch (err) {
          console.error('server add failed, storing locally', err);
        }
      }
      const next = [...readLocalCatalog(), { ...b, addedAt: Date.now() }];
      persistLocal(next);
      showToast(`Added “${b.name.split(' ').slice(0, 3).join(' ')}…” to your dukaan`);
    },
    [inStore, token, loadProducts, persistLocal, showToast],
  );

  const addSelected = useCallback(async () => {
    const chosen = BIGHI_CATALOG.filter((p) => selected.has(p.id) && !inStore.has(p.id));
    if (chosen.length === 0) {
      showToast('Nothing new to add');
      return;
    }
    if (token) {
      // Best-effort server persistence; local copy always kept for the preview.
      for (const b of chosen) {
        try {
          await api.post(
            '/api/products',
            { name: b.name, price: b.price, unit: b.unit, category: b.category, description: b.unit },
            token,
          );
        } catch {
          /* fall through to local */
        }
      }
    }
    const existing = readLocalCatalog();
    const merged = [...existing, ...chosen.map((b) => ({ ...b, addedAt: Date.now() }))];
    persistLocal(merged);
    setSelected(new Set());
    showToast(`${chosen.length} product${chosen.length > 1 ? 's' : ''} added to your dukaan`);
    if (token) loadProducts();
  }, [selected, inStore, token, persistLocal, showToast, loadProducts]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllInCategory = useCallback(() => {
    const ids = filteredCatalog.filter((p) => !inStore.has(p.id)).map((p) => p.id);
    setSelected((prev) => {
      const next = new Set(prev);
      const allAlready = ids.every((id) => next.has(id));
      if (allAlready) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, [filteredCatalog, inStore]);

  // --- Inventory actions (server-backed) ---
  const toggleAvailability = async (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p)));
    if (token) {
      try {
        await api.patch(`/api/products/${product.id}`, { isAvailable: !product.isAvailable }, token);
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast(product.isAvailable ? 'Marked out of stock (offline preview)' : 'Marked in stock (offline preview)');
    }
  };

  const editPrice = async (product: Product, price: number) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, price } : p)));
    if (token) {
      try {
        await api.patch(`/api/products/${product.id}`, { price }, token);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const removeLocalItem = (id: string) => {
    persistLocal(readLocalCatalog().filter((i) => i.id !== id));
    showToast('Removed from your dukaan');
  };

  const handleCustomAdd = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      unit: form.unit,
      category: form.category,
      description: form.description || '',
      image: form.image || '',
    };
    if (token) {
      try {
        const res = await api.post<{ success: boolean; data: Product }>('/api/products', payload, token);
        if (res.success) {
          setProducts((prev) => [res.data, ...prev]);
          showToast('Custom product added');
        }
      } catch (err) {
        console.error(err);
        showToast('Could not save to server (offline preview)');
      }
    } else {
      showToast('Custom product saved (offline preview)');
    }
    setForm({ name: '', price: '', mrp: '', unit: 'pack', category: BIGHI_CATEGORIES[0].label, image: '', description: '' });
    setSaving(false);
    setTab('inventory');
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'inventory', label: 'My Dukaan', icon: 'storefront' },
    { id: 'catalog', label: `Master Catalog`, icon: 'grid_view' },
    { id: 'custom', label: '+ Custom', icon: 'add_box' },
  ];

  return (
    <AppShell topNavTitle="Products" role="vendor" guest={!token}>
      {/* Tab bar */}
      <div className="flex gap-1.5 p-1 bg-surface-container-low rounded-2xl mb-4 sticky top-[64px] z-30 backdrop-blur-md">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              tab === t.id
                ? 'leaf-gradient text-white shadow-brand-glow'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Icon name={t.icon} size="sm" filled={tab === t.id} />
            <span>{t.label}</span>
            {t.id === 'inventory' && (products.length + localItems.length) > 0 && (
              <span className="bg-black/20 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {products.length + localItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============ TAB 1: MY DUKAAN INVENTORY ============ */}
      {tab === 'inventory' && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse !p-3">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-lg bg-surface-container-high" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-surface-container-high rounded w-2/3" />
                      <div className="h-3 bg-surface-container-high rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length + localItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-5">
                <Icon name="inventory_2" size="xl" className="text-on-surface-variant" />
              </div>
              <p className="text-on-surface font-bold font-headline text-lg">Your dukaan is empty</p>
              <p className="text-on-surface-variant text-sm mt-1 mb-5">
                Add products from the 1,000-item master catalog in one tap.
              </p>
              <button onClick={() => setTab('catalog')} className="btn-primary text-sm">
                Browse Master Catalog
              </button>
            </div>
          ) : (
            <>
              {/* Locally added master-catalog items (icon tiles) */}
              {localItems.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 p-3 bg-surface-container-low border border-white/5 rounded-2xl"
                >
                  <CatalogTile
                    image={b.image}
                    icon={b.icon}
                    from={b.from}
                    to={b.to}
                    name={b.name}
                    className="w-14 h-14 shrink-0 !rounded-xl"
                    iconClassName="text-xl"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate font-headline">{b.name}</p>
                    <p className="text-[11px] text-on-surface-variant">{b.unit}</p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-sm font-extrabold text-primary font-headline tabular-nums">₹{b.price}</span>
                      {b.mrp > b.price && (
                        <span className="text-[11px] text-on-surface-variant/60 line-through tabular-nums">₹{b.mrp}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeLocalItem(b.id)}
                    aria-label="Remove product"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition"
                  >
                    <Icon name="delete" size="sm" />
                  </button>
                </div>
              ))}

              {/* Server-backed products with price edit + availability toggle */}
              {products.map((product) => (
                <div key={product.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <ProductCard product={product} compact />
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleAvailability(product)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        product.isAvailable
                          ? 'bg-secondary-container text-success'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {product.isAvailable ? 'In Stock' : 'Out'}
                    </button>
                    <label className="flex items-center gap-1 text-[11px] text-on-surface-variant px-1">
                      ₹
                      <input
                        type="number"
                        defaultValue={product.price}
                        key={product.price}
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          if (Number.isFinite(v) && v > 0 && v !== product.price) editPrice(product, v);
                        }}
                        className="w-16 bg-surface-container-high rounded-md px-1.5 py-1 text-on-surface outline-none focus:border-primary border border-transparent tabular-nums"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ============ TAB 2: MASTER CATALOG PICKER ============ */}
      {tab === 'catalog' && (
        <div>
          {/* ---- Quick-add essentials -------------------------------------
              Shopkeepers never type a product — they tap it. This surfaces the
              highest-velocity kirana lines so a new dukaan can be stocked in
              under a minute. */}
          <div className="mb-4 rounded-2xl border border-primary/25 bg-primary/[0.06] overflow-hidden">
            <button
              onClick={() => setEssentialsOpen((v) => !v)}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left"
            >
              <span className="w-8 h-8 rounded-xl leaf-gradient flex items-center justify-center shrink-0">
                <Icon name="bolt" size="sm" filled className="text-white" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-black text-on-surface font-headline">
                  Quick-add essentials
                </span>
                <span className="block text-[11px] text-on-surface-variant">
                  {BIGHI_ESSENTIALS.length} most-ordered items · one tap to stock
                </span>
              </span>
              <Icon
                name={essentialsOpen ? 'expand_less' : 'expand_more'}
                size="sm"
                className="text-on-surface-variant shrink-0"
              />
            </button>

            <AnimatePresence initial={false}>
              {essentialsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5">
                    {/* Category dropdown */}
                    <select
                      value={essentialsCat}
                      onChange={(e) => setEssentialsCat(e.target.value)}
                      className="w-full mb-3 bg-surface-container-low border border-white/10 focus:border-primary/50 rounded-xl px-3 py-2.5 text-sm font-semibold text-on-surface outline-none"
                    >
                      <option value="All">All essentials · {BIGHI_ESSENTIALS.length}</option>
                      {BIGHI_CATEGORIES.map((c) => {
                        const n = BIGHI_ESSENTIALS.filter((p) => p.category === c.label).length;
                        if (!n) return null;
                        return (
                          <option key={c.id} value={c.label}>
                            {c.label} · {n}
                          </option>
                        );
                      })}
                    </select>

                    {/* Photo grid of essentials */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {visibleEssentials.map((b) => {
                        const added = inStore.has(b.id);
                        return (
                          <button
                            key={b.id}
                            onClick={() => addCatalogItem(b)}
                            disabled={added}
                            title={`${b.name} · ${b.unit}`}
                            className={`group relative flex flex-col text-left rounded-xl border p-1.5 transition ${
                              added
                                ? 'border-primary/50 bg-primary/10'
                                : 'border-white/5 bg-surface-container-low hover:border-primary/40 active:scale-95'
                            }`}
                          >
                            <CatalogTile
                              image={b.image}
                              icon={b.icon}
                              from={b.from}
                              to={b.to}
                              name={b.name}
                              className="w-full aspect-square mb-1.5"
                              rounded="rounded-lg"
                              iconClassName="text-2xl"
                            />
                            <span className="text-[10px] font-bold text-on-surface leading-tight line-clamp-2 min-h-[1.6rem] font-headline">
                              {b.name}
                            </span>
                            <span className="text-[9px] text-on-surface-variant truncate">{b.unit}</span>
                            <span className="mt-0.5 flex items-center justify-between gap-1">
                              <span className="text-[11px] font-black text-on-surface tabular-nums">
                                ₹{b.price}
                              </span>
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                                  added ? 'bg-primary text-white' : 'bg-primary/15 text-primary'
                                }`}
                              >
                                <Icon name={added ? 'check' : 'add'} size="sm" />
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Icon name="search" size="sm" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search 1,000+ products — Amul, Maggi, Surf Excel…"
              className="w-full bg-surface-container-low border border-white/10 focus:border-primary/50 rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 outline-none"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            <button
              onClick={() => setCatFilter('All')}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                catFilter === 'All'
                  ? 'leaf-gradient text-white border-transparent'
                  : 'bg-surface-container-low text-on-surface-variant border-white/5'
              }`}
            >
              All · {BIGHI_CATALOG.length}
            </button>
            <button
              onClick={() => setEssentialsOnly((v) => !v)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                essentialsOnly
                  ? 'bg-warning text-[#1C1503] border-transparent'
                  : 'bg-surface-container-low text-on-surface-variant border-white/5'
              }`}
            >
              <Icon name="bolt" size="sm" filled={essentialsOnly} />
              Essentials
              <span className="opacity-60">{BIGHI_ESSENTIALS.length}</span>
            </button>
            {BIGHI_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.label)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                  catFilter === c.label
                    ? 'leaf-gradient text-white border-transparent'
                    : 'bg-surface-container-low text-on-surface-variant border-white/5'
                }`}
              >
                <Icon name={c.icon} size="sm" filled={catFilter === c.label} />
                {c.label.split(',')[0]}
                <span className="opacity-60">{countsByCat[c.label]}</span>
              </button>
            ))}
          </div>

          {/* Bulk action bar */}
          <div className="sticky top-[120px] z-20 mt-2 mb-3 flex items-center justify-between gap-3 bg-surface-container/95 backdrop-blur border border-white/10 rounded-2xl px-3 py-2.5">
            <button
              onClick={selectAllInCategory}
              className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition"
            >
              <Icon name="select_check_box" size="sm" />
              {catFilter === 'All' ? 'Select all visible' : 'Select all in category'}
            </button>
            <span className="text-xs text-on-surface-variant font-semibold tabular-nums">
              {selected.size > 0 ? `${selected.size} selected` : ''}
            </span>
            <button
              onClick={addSelected}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 leaf-gradient text-white text-xs font-black px-4 py-2 rounded-xl shadow-brand-glow disabled:opacity-40 disabled:shadow-none active:scale-95 transition"
            >
              <Icon name="add_shopping_cart" size="sm" />
              Add Selected{selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
          </div>

          <p className="text-[11px] text-on-surface-variant mb-3">
            Showing {filteredCatalog.length} products · tap <span className="text-primary font-bold">+ Add</span> for one tap, or tick boxes to bulk add.
          </p>

          {/* Catalog grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCatalog.map((b) => {
              const added = inStore.has(b.id);
              const isChecked = selected.has(b.id);
              return (
                <motion.div
                  layout
                  key={b.id}
                  className={`relative flex flex-col bg-surface-container-low border rounded-2xl p-2.5 transition ${
                    isChecked ? 'border-primary/60' : 'border-white/5'
                  }`}
                >
                  <button
                    onClick={() => !added && toggleSelect(b.id)}
                    disabled={added}
                    aria-label={added ? 'Already in store' : 'Select product'}
                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md flex items-center justify-center border transition ${
                      added
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : isChecked
                          ? 'bg-primary border-primary text-white'
                          : 'bg-black/50 border-white/30 text-transparent hover:border-white'
                    }`}
                  >
                    <Icon name={added ? 'check' : 'check'} size="sm" />
                  </button>

                  <CatalogTile
                    image={b.image}
                    icon={b.icon}
                    from={b.from}
                    to={b.to}
                    name={b.name}
                    className="w-full aspect-square mb-2"
                  />
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wide truncate font-headline">
                    {b.category.split(',')[0]}
                  </p>
                  <h4 className="font-bold text-on-surface text-[12px] leading-snug line-clamp-2 min-h-[2rem] font-headline">
                    {b.name}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant truncate">{b.unit}</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-sm font-black text-on-surface font-headline tabular-nums">₹{b.price}</span>
                    {added ? (
                      <span className="flex items-center gap-1 text-[11px] font-black text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg">
                        <Icon name="check_circle" size="sm" filled />
                        Added
                      </span>
                    ) : (
                      <button
                        onClick={() => addCatalogItem(b)}
                        className="flex items-center gap-0.5 border-2 border-primary/70 text-primary hover:bg-primary hover:text-white text-[12px] font-black px-3 py-1.5 rounded-lg uppercase active:scale-95 transition"
                      >
                        <Icon name="add" size="sm" />
                        Add
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ TAB 3: ADD CUSTOM PRODUCT ============ */}
      {tab === 'custom' && (
        <div className="card space-y-3">
          <h3 className="font-headline font-black text-lg text-on-surface flex items-center gap-2">
            <Icon name="add_box" className="text-primary" />
            Add a custom local product
          </h3>
          <p className="text-xs text-on-surface-variant -mt-2">
            Sell unique items not in the master catalog — your own specials, local sweets, homemade picks.
          </p>

          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-1 block">Product image URL</label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://… or leave blank for an icon tile"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-1 block">Product title *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Homemade Aam Papad (200 g)"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">Selling price (₹) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="45"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">MRP (₹)</label>
              <input
                type="number"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                placeholder="55"
                className="input-field"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">Pack size / unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="200 g pack"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
              >
                {BIGHI_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short note for customers…"
              rows={2}
              className="input-field resize-none"
            />
          </div>
          <button
            onClick={handleCustomAdd}
            disabled={saving || !form.name.trim() || !form.price}
            className="w-full btn-primary text-sm disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add product to my dukaan'}
          </button>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest border border-primary/30 text-on-surface text-sm font-bold px-5 py-3 rounded-2xl shadow-editorial-lg flex items-center gap-2 max-w-[90vw]"
          >
            <Icon name="check_circle" size="sm" filled className="text-primary shrink-0" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
