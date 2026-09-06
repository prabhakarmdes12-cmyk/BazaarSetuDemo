'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Icon from './ui/Icon';
import CatalogTile from './CatalogTile';
import BighiProductCard, { CatalogProduct } from './BighiProductCard';
import PromoCarousels from './PromoCarousels';
import FloatingCartDock from './FloatingCartDock';
import ProductDetailSheet from './ProductDetailSheet';
import DukaanHotlineModal from './DukaanHotlineModal';
import { useAuth } from '@/hooks/useAuth';
import { useChitiConnectCall } from '@/hooks/useChitiConnectCall';
import { api } from '@/lib/api';
import {
  BIGHI_STORE,
  BIGHI_CATEGORIES,
  BIGHI_CATALOG,
  BIGHI_CATEGORY_COUNTS,
} from '@/lib/bighiCatalog';
import {
  addToGuestCart,
  getGuestCart,
  updateGuestQuantity,
} from '@/lib/guestCart';
import { track } from '@/lib/analytics';

const SHOP_ID = BIGHI_STORE.id;
const SHOP_NAME = BIGHI_STORE.name;
const INITIAL_PER_CATEGORY = 8;
const REVEAL_BATCH = 24;

function toGuestCartInput(p: CatalogProduct) {
  return {
    productId: p.id,
    shopId: SHOP_ID,
    shopName: SHOP_NAME,
    name: p.name,
    price: p.price,
    unit: p.unit,
    image: p.image || '',
    mrp: p.mrp,
    icon: p.icon,
    from: p.from,
    to: p.to,
  };
}

export default function BighiStorefront() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [activeCat, setActiveCat] = useState(BIGHI_CATEGORIES[0].id);
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  // Product detail is a sheet, not a route — the shelf stays mounted behind it.
  const [detail, setDetail] = useState<CatalogProduct | null>(null);
  const [revealed, setRevealed] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const railRef = useRef<HTMLDivElement>(null);
  const asideRailRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // ---- cart state (guest cart works for both logged-in & anonymous) ----
  const refreshCart = useCallback(() => {
    const items = getGuestCart().filter((i) => i.shopId === SHOP_ID);
    const qty: Record<string, number> = {};
    let count = 0;
    let total = 0;
    for (const i of items) {
      qty[i.productId] = i.quantity;
      count += i.quantity;
      total += i.quantity * i.price;
    }
    setQuantities(qty);
    return { count, total };
  }, []);

  const [cartMeta, setCartMeta] = useState({ count: 0, total: 0 });
  useEffect(() => {
    setCartMeta(refreshCart());
  }, [refreshCart]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  // ---- Chiti Connect dukaan hotline -------------------------------------
  const [hotlineOpen, setHotlineOpen] = useState(false);
  const [hotlineChatId, setHotlineChatId] = useState<string | null>(null);
  const chitiCall = useChitiConnectCall({ token, chatId: hotlineChatId });

  const callDukaan = useCallback(async () => {
    if (!token) {
      showToast('Dukaan ko call karne ke liye login karein.');
      router.push('/login');
      return;
    }

    let chatId = hotlineChatId;
    if (!chatId) {
      try {
        const res = await api.post<{ success: boolean; data: { chatId: string } }>(
          '/api/chats',
          { shopId: SHOP_ID },
          token,
        );
        if (res.success) {
          chatId = res.data.chatId;
          setHotlineChatId(chatId);
        }
      } catch (err) {
        console.error('Failed to open Chiti Connect conversation:', err);
        showToast('Call abhi connect nahi ho paayi. Kripya dobara koshish karein.');
        return;
      }
    }

    setHotlineOpen(true);
    track({ type: 'chiti_connect_call_start', shopId: SHOP_ID, surface: 'storefront_hero' });
    void chitiCall.startCall();
  }, [chitiCall, hotlineChatId, router, showToast, token]);

  const hangUpDukaan = useCallback(() => {
    track({
      type: 'chiti_connect_call_end',
      shopId: SHOP_ID,
      durationSeconds: chitiCall.liveAt ? Math.round((Date.now() - chitiCall.liveAt.getTime()) / 1000) : 0,
      status: chitiCall.status,
    });
    void chitiCall.endCall(chitiCall.status === 'LIVE' ? 'ENDED' : 'NO_ANSWER');
  }, [chitiCall]);

  // The hook needs the chat id at call time; start once it lands.
  useEffect(() => {
    if (hotlineOpen && hotlineChatId && chitiCall.status === 'IDLE') {
      void chitiCall.startCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotlineChatId, hotlineOpen]);

  // ---- cart actions ----
  const add = useCallback(
    (p: CatalogProduct) => {
      addToGuestCart(toGuestCartInput(p), 1);
      setCartMeta(refreshCart());
      track({ type: 'guest_add_to_cart', productId: p.id, shopId: SHOP_ID });
    },
    [refreshCart],
  );
  const inc = useCallback(
    (p: CatalogProduct) => {
      addToGuestCart(toGuestCartInput(p), 1);
      setCartMeta(refreshCart());
    },
    [refreshCart],
  );
  const dec = useCallback(
    (p: CatalogProduct) => {
      const cur = getGuestCart().find((i) => i.productId === p.id)?.quantity || 0;
      updateGuestQuantity(p.id, cur - 1);
      setCartMeta(refreshCart());
    },
    [refreshCart],
  );

  // ---- search results (across whole catalog) ----
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return BIGHI_CATALOG.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    ).slice(0, 60);
  }, [search]);

  // ---- scroll spy: highlight the category in view ----
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrolling.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-cat-id');
            if (id) setActiveCat(id);
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0 },
    );
    BIGHI_CATEGORIES.forEach((c) => {
      const el = sectionRefs.current[c.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const jumpToCategory = useCallback((catId: string) => {
    const el = sectionRefs.current[catId];
    if (!el) return;
    isScrolling.current = true;
    setActiveCat(catId);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Mobile: sync the horizontal rail.
    railRef.current
      ?.querySelector(`[data-rail-id="${catId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    setTimeout(() => {
      isScrolling.current = false;
    }, 600);
  }, []);

  // Reveal more products within a category when its shelf scrolls near.
  const revealRef = useCallback((catId: string) => (node: HTMLElement | null) => {
    sectionRefs.current[catId] = node;
  }, []);

  useEffect(() => {
    const initial: Record<string, number> = {};
    BIGHI_CATEGORIES.forEach((c) => (initial[c.id] = INITIAL_PER_CATEGORY));
    setRevealed(initial);
  }, []);

  const revealMore = useCallback((catId: string) => {
    setRevealed((prev) => ({
      ...prev,
      [catId]: Math.min(BIGHI_CATEGORY_COUNTS[BIGHI_CATEGORIES.find((c) => c.id === catId)?.label || ''] || 999, (prev[catId] || INITIAL_PER_CATEGORY) + REVEAL_BATCH),
    }));
  }, []);

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-28">
      {/* ---- Store header ---- */}
      <header className="glass-panel bg-surface/85 backdrop-blur-xl sticky top-0 z-50 shadow-top-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/customer')}
              aria-label="Go back to stores"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-primary active:scale-95 transition"
            >
              <Icon name="arrow_back" size="sm" />
            </button>
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl leaf-gradient flex items-center justify-center shadow-brand-glow shrink-0">
                <Icon name="storefront" filled size="md" className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-headline font-black text-base sm:text-lg leading-tight truncate">
                  {SHOP_NAME}
                </h1>
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
                  <span className="flex items-center gap-0.5 text-warning">
                    <Icon name="star" size="sm" filled />
                    {BIGHI_STORE.rating}
                    <span className="text-on-surface-variant font-semibold">(12.4k+)</span>
                  </span>
                  <span className="flex items-center gap-0.5 text-emerald-300">
                    <Icon name="bolt" size="sm" filled />
                    {BIGHI_STORE.etaMinutes} mins
                  </span>
                  <span className="hidden sm:flex items-center gap-0.5 text-primary">
                    <Icon name="verified_user" size="sm" filled />
                    {BIGHI_STORE.verifiedLabel}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => showToast('Chat with Bighi Brothers is opening…')}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-surface-container-high text-on-surface hover:text-primary border border-white/5 active:scale-95 transition"
              aria-label="Chat with shop"
            >
              <Icon name="chat" size="sm" />
              <span className="hidden sm:inline">Chat</span>
            </button>
            <button
              onClick={callDukaan}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold leaf-gradient text-white shadow-brand-glow active:scale-95 transition"
              aria-label="Call Dukaan via Chiti Connect"
            >
              <Icon name="call" size="sm" />
              <span className="hidden sm:inline">Call</span>
            </button>
          </div>

          {/* In-store live search */}
          <div className="mt-3 relative">
            <Icon name="search" size="sm" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${SHOP_NAME} — try "Amul milk", "Maggi", "atta"…`}
              className="w-full bg-surface-container-high border border-white/10 focus:border-primary/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 outline-none transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <Icon name="close" size="sm" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        {/* ---- Hero banner ---- */}
        {!search && (
          <section className="relative rounded-3xl overflow-hidden mb-5 border border-primary/20 shadow-editorial-lg min-h-[180px] sm:min-h-[220px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BIGHI_STORE.heroBanner}
              alt={`${SHOP_NAME} — ${BIGHI_STORE.subtitle}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 p-6 sm:p-8 max-w-lg">
              <span className="inline-flex items-center gap-1 bg-primary/90 text-white text-[11px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full font-headline">
                <Icon name="bolt" size="sm" filled />
                ⚡ {BIGHI_STORE.etaMinutes}-minute delivery
              </span>
              <h2 className="text-white text-2xl sm:text-3xl font-black font-headline mt-3 leading-tight">
                {SHOP_NAME}
              </h2>
              <p className="text-emerald-200 italic text-sm sm:text-base font-semibold">
                “{BIGHI_STORE.subtitle}”
              </p>
              <div className="flex items-center gap-3 mt-3 text-[11px] font-bold text-white/90">
                <span className="flex items-center gap-1">
                  <Icon name="star" size="sm" filled className="text-warning" />
                  {BIGHI_STORE.reviewsLabel}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="verified_user" size="sm" filled className="text-emerald-300" />
                  {BIGHI_STORE.verifiedLabel}
                </span>
              </div>

              {/*
                The hotline is the moat, so it gets hero real estate — not a
                buried support link. Dark stores hide behind ticket bots; here
                the shopper is one tap from the person packing their order.
              */}
              <button
                onClick={callDukaan}
                aria-label="Call Dukaan via Chiti Connect"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/95 hover:bg-white text-emerald-950 font-headline font-black uppercase tracking-wider text-xs px-5 py-3 shadow-editorial-lg active:scale-95 transition"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full leaf-gradient text-white">
                  <Icon name="call" size="sm" filled />
                </span>
                📞 Call Dukaan
                <span className="hidden sm:inline text-[10px] font-bold normal-case tracking-normal text-emerald-800/70">
                  · number private rehta hai
                </span>
              </button>
            </div>
          </section>
        )}

        {/* ---- Promotional carousels ---- */}
        {!search && (
          <section className="mb-6">
            <PromoCarousels />
          </section>
        )}

        {search ? (
          /* ---- Search results ---- */
          <section>
            <h3 className="font-headline font-black text-lg mb-1">
              Results for “{search}”
            </h3>
            <p className="text-on-surface-variant text-sm mb-4">{searchResults.length} items found</p>
            {searchResults.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="search_off" size="xl" className="text-on-surface-variant mx-auto mb-3" />
                <p className="text-on-surface-variant font-medium">No items match “{search}”</p>
                <p className="text-on-surface-variant/70 text-sm">Try a different keyword.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {searchResults.map((p) => (
                  <BighiProductCard
                    key={p.id}
                    product={p}
                    quantity={quantities[p.id] || 0}
                    onAdd={add}
                    onInc={inc}
                    onDec={dec}
                    onOpen={setDetail}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          /* ---- Dual rail: category sidebar + shelves ---- */
          <div>
            {/* Mobile category rail (horizontal, full-width, sticky) */}
            <div
              ref={railRef}
              className="lg:hidden sticky top-[132px] z-30 bg-surface/95 backdrop-blur-md -mx-4 px-4 mb-4"
            >
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2.5">
                {BIGHI_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    data-rail-id={c.id}
                    onClick={() => jumpToCategory(c.id)}
                    data-aside-cat={c.id}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                      activeCat === c.id
                        ? 'leaf-gradient text-white border-transparent shadow-brand-glow'
                        : 'bg-surface-container-high text-on-surface-variant border-white/5'
                    }`}
                  >
                    <Icon name={c.icon} size="sm" filled />
                    {c.label.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-5">
            {/* Left rail (desktop) */}
            <aside className="hidden lg:block w-56 shrink-0">
              <div ref={asideRailRef} className="sticky top-[140px] max-h-[calc(100vh-160px)] overflow-y-auto overscroll-contain pr-1.5 space-y-1">
                {BIGHI_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    data-aside-cat={c.id}
                    onClick={() => jumpToCategory(c.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all border ${
                      activeCat === c.id
                        ? 'bg-primary/15 border-primary/40 text-white shadow-sm'
                        : 'bg-transparent border-transparent text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <CatalogTile
                      image={c.image}
                      icon={c.icon}
                      from={c.from}
                      to={c.to}
                      name={c.label}
                      className="w-8 h-8 shrink-0"
                      rounded="rounded-lg"
                      iconClassName="text-sm"
                    />
                    <span className="leading-tight">{c.label}</span>
                    <span className="ml-auto text-[11px] text-on-surface-variant/70 tabular-nums">
                      {BIGHI_CATEGORY_COUNTS[c.label]}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Shelves */}
            <div className="flex-1 min-w-0">
              {BIGHI_CATEGORIES.map((c) => {
                const items = BIGHI_CATALOG.filter((p) => p.category === c.label).slice(
                  0,
                  revealed[c.id] ?? INITIAL_PER_CATEGORY,
                );
                const totalInCat = BIGHI_CATEGORY_COUNTS[c.label] || 0;
                const shown = items.length;
                return (
                  <section
                    key={c.id}
                    ref={revealRef(c.id)}
                    data-cat-id={c.id}
                    className="mb-10 scroll-mt-[210px]"
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <CatalogTile
                        image={c.image}
                        icon={c.icon}
                        from={c.from}
                        to={c.to}
                        name={c.label}
                        className="w-9 h-9 shrink-0"
                        rounded="rounded-xl"
                        iconClassName="text-base"
                      />
                      <div>
                        <h3 className="font-headline font-black text-lg leading-tight">{c.label}</h3>
                        <p className="text-[11px] text-on-surface-variant">{totalInCat} items</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                      {items.map((p) => (
                        <BighiProductCard
                          key={p.id}
                          product={p}
                          quantity={quantities[p.id] || 0}
                          onAdd={add}
                          onInc={inc}
                          onDec={dec}
                          onOpen={setDetail}
                        />
                      ))}
                    </div>
                    {shown < totalInCat && (
                      <button
                        onClick={() => revealMore(c.id)}
                        className="mt-4 w-full py-3 rounded-xl border-2 border-primary/40 text-primary font-black text-sm uppercase tracking-wide font-headline hover:bg-primary/10 active:scale-[0.99] transition"
                      >
                        Show more · {totalInCat - shown}+ items
                      </button>
                    )}
                  </section>
                );
              })}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest border border-primary/30 text-on-surface text-sm font-bold px-5 py-3 rounded-2xl shadow-editorial-lg flex items-center gap-2"
        >
          <Icon name="check_circle" size="sm" filled className="text-primary" />
          {toast}
        </motion.div>
      )}

      <FloatingCartDock
        count={cartMeta.count}
        total={cartMeta.total}
        label="items"
        onClick={() => router.push('/customer/cart')}
      />

      <ProductDetailSheet
        product={detail}
        open={detail !== null}
        onClose={() => setDetail(null)}
        quantity={detail ? quantities[detail.id] || 0 : 0}
        onAdd={add}
        onInc={inc}
        onDec={dec}
      />

      <DukaanHotlineModal
        open={hotlineOpen}
        onClose={() => setHotlineOpen(false)}
        status={chitiCall.status}
        callerName={user?.name || 'Aap'}
        shopName={SHOP_NAME}
        shopLocality="Ashok Nagar, Ranchi"
        liveAt={chitiCall.liveAt}
        isMuted={chitiCall.isMuted}
        isSpeakerOn={chitiCall.isSpeakerOn}
        transport={chitiCall.transport}
        localStream={chitiCall.localStream}
        remoteStream={chitiCall.remoteStream}
        onToggleMute={chitiCall.toggleMute}
        onToggleSpeaker={chitiCall.toggleSpeaker}
        onHangUp={hangUpDukaan}
      />
    </div>
  );
}
