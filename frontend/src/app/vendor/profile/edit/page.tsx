'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES } from '@/types';
import { api } from '@/lib/api';

interface VendorShopProfile {
  id: string;
  name: string;
  category?: string;
  address: string;
  description: string;
  isActive: boolean;
  deliveryRadiusKm: number;
  serviceablePincodes: string;
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryAbove: number;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [shopId, setShopId] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'General',
    address: '',
    description: '',
    ownerName: '',
    deliveryRadiusKm: 3.5,
    serviceablePincodes: '826001',
    minOrderAmount: 0,
    deliveryFee: 15,
    freeDeliveryAbove: 199,
  });

  useEffect(() => {
    if (!authLoading && !token) {
      window.location.assign('/login');
      return;
    }
    if (user) {
      setForm((prev) => ({ ...prev, ownerName: user.name }));
    }
    if (!token) return;

    let cancelled = false;
    api.get<{ success: boolean; data: VendorShopProfile }>('/api/shops/vendor/my-shop', token)
      .then((response) => {
        if (cancelled || !response.success) return;
        const shop = response.data;
        setShopId(shop.id);
        setIsOpen(shop.isActive);
        setForm((prev) => ({
          ...prev,
          name: shop.name,
          category: shop.category || prev.category,
          address: shop.address,
          description: shop.description,
          deliveryRadiusKm: shop.deliveryRadiusKm,
          serviceablePincodes: shop.serviceablePincodes,
          minOrderAmount: shop.minOrderAmount,
          deliveryFee: shop.deliveryFee,
          freeDeliveryAbove: shop.freeDeliveryAbove,
        }));
      })
      .catch(() => {
        if (!cancelled) setFeedback('Shop details could not be loaded. Please try again.');
      });

    return () => { cancelled = true; };
  }, [token, authLoading, user]);

  const handleSave = async () => {
    if (!token || !shopId) {
      setFeedback('Shop details are still loading. Please try again.');
      return;
    }

    setSaving(true);
    setFeedback('');
    try {
      await api.put(`/api/shops/${shopId}`, {
        name: form.name,
        address: form.address,
        description: form.description,
        deliveryRadiusKm: form.deliveryRadiusKm,
        serviceablePincodes: form.serviceablePincodes,
        minOrderAmount: form.minOrderAmount,
        deliveryFee: form.deliveryFee,
        freeDeliveryAbove: form.freeDeliveryAbove,
      }, token);
      setFeedback('Delivery settings saved successfully.');
      setTimeout(() => router.push('/vendor'), 700);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Could not save shop settings.');
    } finally {
      setSaving(false);
    }
  };

  const radiusHelper = form.deliveryRadiusKm <= 2
    ? '⚡ 10-Min Instant Delivery Zone'
    : form.deliveryRadiusKm <= 5
      ? 'Standard Dukaan Delivery Zone'
      : 'Extended Town Zone';

  return (
    <div className="bg-surface min-h-screen">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar">
        <div className="flex items-center justify-between px-6 py-4 w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/vendor')}
              className="active:scale-95 transition-transform text-primary p-1 rounded-full hover:bg-slate-100"
            >
              <Icon name="arrow_back" />
            </button>
            <h1 className="font-headline font-bold text-lg tracking-tight text-primary">Edit Profile</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="active:scale-95 transition-transform font-headline font-bold text-sm bg-primary-container text-white px-5 py-2 rounded-full shadow-lg shadow-primary-container/20 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      <main className="mt-24 px-6 max-w-2xl mx-auto space-y-12 pb-32">
        {/* Profile Picture */}
        <section className="flex flex-col items-center justify-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface-container shadow-xl ring-4 ring-primary-container/10 bg-surface-container flex items-center justify-center">
              <Icon name="person" size="xl" className="text-on-surface-variant" />
            </div>
            <button className="absolute bottom-0 right-0 bg-primary-container text-white p-2.5 rounded-full shadow-lg active:scale-90 transition-all border-2 border-white">
              <Icon name="edit" size="sm" />
            </button>
          </div>
          <div className="text-center">
            <p className="font-headline font-extrabold text-primary italic text-sm">Apni local dukaan, ab online</p>
          </div>
        </section>

        {/* Form */}
        <div className="space-y-10">
          {feedback && (
            <div role="status" className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-on-surface">
              {feedback}
            </div>
          )}

          {/* Shop Status Toggle */}
          <section className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-secondary-container/20 p-2 rounded-xl">
                <Icon name="storefront" filled className="text-secondary" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface">Dukaan {isOpen ? 'Khuli' : 'Band'} Hai</h3>
                <p className="text-xs text-on-surface-variant">Manage your shop availability</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input checked={isOpen} onChange={() => setIsOpen(!isOpen)} className="sr-only peer" type="checkbox" />
              <div className="w-14 h-8 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-surface-container-lowest after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
            </label>
          </section>

          {/* Shop Details */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline font-extrabold text-xl text-on-surface flex items-center gap-2">
                <Icon name="shopping_basket" className="text-primary" />
                Dukaan ki Details
              </h2>
              <span className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant bg-surface-container p-1 px-2 rounded">Shop Profile</span>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="font-label font-semibold text-sm text-on-surface-variant px-1">Shop Name</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 text-on-surface font-medium focus:ring-2 focus:ring-primary-container/30 transition-all"
                  type="text"
                  placeholder="e.g. Sharma Fresh Produce"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="font-label font-semibold text-sm text-on-surface-variant px-1">Business Category</label>
                <div className="relative">
                  <select
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 text-on-surface font-medium focus:ring-2 focus:ring-primary-container/30 appearance-none transition-all"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Icon name="expand_more" className="absolute right-4 top-4 text-on-surface-variant pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label font-semibold text-sm text-on-surface-variant px-1">Shop Address</label>
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 text-on-surface font-medium focus:ring-2 focus:ring-primary-container/30 transition-all resize-none"
                  rows={3}
                  placeholder="Shop No. 4, Main Market, Sector 12"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="font-label font-semibold text-sm text-on-surface-variant px-1">Description</label>
                <textarea
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 text-on-surface font-medium focus:ring-2 focus:ring-primary-container/30 transition-all resize-none"
                  rows={2}
                  placeholder="Tell customers about your shop..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Delivery Range & Rules */}
          <section className="space-y-6 rounded-3xl border border-primary/15 bg-surface-container-low p-6 shadow-sm">
            <div>
              <h2 className="font-headline font-extrabold text-xl text-on-surface flex items-center gap-2">
                <Icon name="delivery_dining" className="text-primary" />
                Delivery Range &amp; Rules
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                Decide where you deliver and the order values that apply.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl bg-surface-container-lowest p-4">
              <div className="flex items-center justify-between gap-4">
                <label htmlFor="delivery-radius" className="font-label font-semibold text-sm text-on-surface-variant">
                  Delivery Radius
                </label>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-extrabold text-primary">
                  {form.deliveryRadiusKm.toFixed(1)} km
                </span>
              </div>
              <input
                id="delivery-radius"
                aria-describedby="delivery-radius-help"
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={form.deliveryRadiusKm}
                onChange={(e) => setForm({ ...form, deliveryRadiusKm: Number(e.target.value) })}
                className="h-2 w-full cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant">
                <span>1.0 km</span>
                <span>10.0 km</span>
              </div>
              <p id="delivery-radius-help" className="text-sm font-bold text-primary">{radiusHelper}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="serviceable-pins" className="font-label font-semibold text-sm text-on-surface-variant px-1">
                Serviceable PIN Codes
              </label>
              <input
                id="serviceable-pins"
                type="text"
                inputMode="numeric"
                placeholder="826001, 826004"
                value={form.serviceablePincodes}
                onChange={(e) => setForm({ ...form, serviceablePincodes: e.target.value })}
                className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-4 text-on-surface font-medium focus:ring-2 focus:ring-primary-container/30 transition-all"
              />
              <p className="text-[11px] text-on-surface-variant px-1">Enter comma-separated 6-digit PIN codes.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { key: 'deliveryFee', label: 'Base Delivery Fee', placeholder: '15' },
                { key: 'freeDeliveryAbove', label: 'Free Delivery Above', placeholder: '199' },
                { key: 'minOrderAmount', label: 'Minimum Order Amount', placeholder: '49' },
              ].map((field) => (
                <div className="space-y-2" key={field.key}>
                  <label htmlFor={field.key} className="font-label font-semibold text-xs text-on-surface-variant">
                    {field.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 font-bold text-on-surface-variant">₹</span>
                    <input
                      id={field.key}
                      type="number"
                      min="0"
                      step="1"
                      placeholder={field.placeholder}
                      value={form[field.key as 'deliveryFee' | 'freeDeliveryAbove' | 'minOrderAmount']}
                      onChange={(e) => setForm({ ...form, [field.key]: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-surface-container-lowest border-none rounded-xl py-3.5 pl-8 pr-3 text-on-surface font-bold focus:ring-2 focus:ring-primary-container/30 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Owner Details */}
          <section className="space-y-6">
            <h2 className="font-headline font-extrabold text-xl text-on-surface flex items-center gap-2">
              <Icon name="badge" className="text-primary" />
              Owner ki Details
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="font-label font-semibold text-sm text-on-surface-variant px-1">Name</label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-4 text-on-surface font-medium focus:ring-2 focus:ring-primary-container/30 transition-all"
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="font-label font-semibold text-sm text-on-surface-variant px-1">Mobile Number</label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-high border-none rounded-xl px-4 py-4 text-on-surface-variant font-medium opacity-70 cursor-not-allowed"
                    disabled
                    type="text"
                    value={user?.phone ? `+91 ${user.phone}` : '+91 98765 43210'}
                  />
                  <Icon name="lock" className="absolute right-4 top-4 text-on-surface-variant/40 text-sm" />
                </div>
                <p className="text-[11px] text-on-surface-variant px-1">Mobile number cannot be changed for security</p>
              </div>
            </div>
          </section>

          {/* Verification Badge */}
          <div className="bg-secondary/5 border border-secondary/10 p-6 rounded-3xl flex items-start gap-4">
            <div className="bg-secondary text-white p-2 rounded-full">
              <Icon name="verified" filled className="text-lg" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-on-surface">Verified Merchant</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Your profile is verified. Customers can trust your shop for quality service and authentic local products.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
