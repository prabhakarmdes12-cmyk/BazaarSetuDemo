'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES } from '@/types';

export default function EditProfilePage() {
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'General',
    address: '',
    description: '',
    ownerName: '',
  });

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); }
    if (user) {
      setForm((prev) => ({ ...prev, ownerName: user.name }));
    }
  }, [token, authLoading, user]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      router.push('/vendor');
    }, 1000);
  };

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
              <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant bg-surface-container p-1 px-2 rounded">Shop Profile</span>
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
                <p className="text-[10px] text-on-surface-variant px-1">Mobile number cannot be changed for security</p>
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
