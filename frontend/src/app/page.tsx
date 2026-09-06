'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui';
import PwaInstallCoach from '@/components/PwaInstallCoach';
import VoiceParchiSandbox from '@/components/VoiceParchiSandbox';
import QuickMerchantSignup from '@/components/QuickMerchantSignup';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'shoppers' | 'merchants'>('shoppers');

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container font-body">
      {/* Top Banner / Locality Broadcast */}
      <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 text-center text-xs font-semibold text-primary flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>📍 Flagship Pilot Live: <strong>Bank More & Hirapur, Dhanbad (826001)</strong> · 10-Min Delivery Active</span>
      </div>

      {/* Main Top Navigation */}
      <header className="sticky top-0 z-50 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/15 px-4 sm:px-8 py-3.5 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl leaf-gradient flex items-center justify-center text-white font-black text-xl shadow-md">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-black text-xl tracking-tight text-on-surface leading-none">
              paaska<span className="text-primary font-bold">.in</span>
            </span>
            <span className="text-[10px] text-on-surface-variant font-semibold tracking-wider uppercase">
              Dhanbad Hyperlocal
            </span>
          </div>
        </Link>

        {/* Audience Toggle Tabs */}
        <div className="flex p-1 bg-surface-container-low border border-outline-variant/25 rounded-2xl">
          <button
            onClick={() => setActiveTab('shoppers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'shoppers'
                ? 'leaf-gradient text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="shopping_bag" size="sm" />
            <span>For Shoppers</span>
          </button>
          <button
            onClick={() => setActiveTab('merchants')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'merchants'
                ? 'leaf-gradient text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Icon name="storefront" size="sm" />
            <span>For Dukaans</span>
          </button>
        </div>

        {/* Quick Nav links */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/download"
            className="px-3.5 py-1.5 bg-surface-container-low border border-outline-variant/30 text-xs font-bold rounded-xl text-on-surface hover:border-primary transition-colors flex items-center gap-1"
          >
            <Icon name="download" size="sm" />
            <span>Get App</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-1.5 leaf-gradient text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition-opacity"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 pt-8 pb-20 space-y-12">
        {/* ================================================================ */}
        {/* TAB 1: FOR SHOPPERS                                              */}
        {/* ================================================================ */}
        {activeTab === 'shoppers' && (
          <div className="space-y-10 animate-fade-in">
            {/* Hero Banner */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary inline-flex items-center gap-1.5">
                <Icon name="bolt" size="sm" />
                ⚡ 10-Minute Instant Delivery in Dhanbad
              </span>
              <h1 className="font-headline font-black text-3xl sm:text-5xl text-on-surface tracking-tight leading-tight">
                Dhanbad Ki Apni Dukaan, <br />
                <span className="text-primary">10 Minute Mein Ghar Par.</span>
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant max-w-xl mx-auto">
                Bighi Brothers Mart aur aapke nazdeeki kirana stores se taaza doodh, sabzi aur ration mangwayein. Real Dhanbad MRP, zero extra charges, aur 1-tap encrypted call hotline.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
                <Link
                  href="/customer"
                  className="w-full sm:w-auto px-6 py-4 leaf-gradient text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="shopping_cart" />
                  <span>Start Shopping Online</span>
                </Link>
                <Link
                  href="/download"
                  className="w-full sm:w-auto px-5 py-4 bg-surface-container-low border border-outline-variant/30 text-on-surface font-bold text-base rounded-2xl hover:border-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="install_mobile" />
                  <span>Install App (2 MB)</span>
                </Link>
              </div>
            </div>

            {/* PWA Install Coach Banner */}
            <div className="max-w-xl mx-auto">
              <PwaInstallCoach />
            </div>

            {/* Interactive Voice Parchi Hero Sandbox */}
            <div className="max-w-xl mx-auto">
              <VoiceParchiSandbox />
            </div>

            {/* Flagship Storefront Spotlight: Bighi Brothers Mart */}
            <div className="bg-surface-container-low border border-outline-variant/20 rounded-3xl p-6 sm:p-8 space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-outline-variant/15">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Flagship Partner Dukaan</span>
                  <h2 className="font-headline font-bold text-2xl text-on-surface">Bighi Brothers Mart</h2>
                  <p className="text-xs text-on-surface-variant">Bank More, Dhanbad · Serving PIN 826001</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold flex items-center gap-1">
                    <Icon name="star" size="sm" filled className="text-secondary" />
                    4.8 Rating
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                    ⚡ 10 mins ETA
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
                  <div className="text-xl font-headline font-extrabold text-primary">2,242</div>
                  <div className="text-[11px] text-on-surface-variant font-medium">Verified SKUs</div>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
                  <div className="text-xl font-headline font-extrabold text-secondary">10 Mins</div>
                  <div className="text-[11px] text-on-surface-variant font-medium">Avg Delivery</div>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
                  <div className="text-xl font-headline font-extrabold text-tertiary">₹0 Fee</div>
                  <div className="text-[11px] text-on-surface-variant font-medium">Above ₹199</div>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
                  <div className="text-xl font-headline font-extrabold text-on-surface">Self-Pickup</div>
                  <div className="text-[11px] text-on-surface-variant font-medium">Counter Ready</div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  href="/customer"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Explore Bighi Brothers Catalog (26 Aisles)</span>
                  <Icon name="arrow_forward" size="sm" />
                </Link>
              </div>
            </div>

            {/* Why Paaska Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon name="mic" />
                </div>
                <h3 className="font-headline font-bold text-base text-on-surface">Hindi Voice Parchi</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bina lambi typing ke apni boli mein bolkar list bhej dijiye. AI turant samaan pehchankar cart bana deta hai.
                </p>
              </div>

              <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <Icon name="call" />
                </div>
                <h3 className="font-headline font-bold text-base text-on-surface">Chiti Connect Dukaan Call</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  1-tap encrypted call button se seedha apne dukandar se baat karein. Zero phone number leakage.
                </p>
              </div>

              <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                  <Icon name="chat" />
                </div>
                <h3 className="font-headline font-bold text-base text-on-surface">WhatsApp Cart Bridge</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Agar slow net hai, toh seedha 1-click mein WhatsApp par poori bill parchi bhejkar order book karein.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: FOR MERCHANTS / DUKAAN OWNERS                            */}
        {/* ================================================================ */}
        {activeTab === 'merchants' && (
          <div className="space-y-10 animate-fade-in">
            {/* Merchant Hero */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="px-3.5 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full text-xs font-bold text-secondary inline-flex items-center gap-1.5">
                <Icon name="store" size="sm" />
                🏪 Dhanbad Kirana Digital Kranti
              </span>
              <h1 className="font-headline font-black text-3xl sm:text-5xl text-on-surface tracking-tight leading-tight">
                Apni Dukaan Ko Banayein <br />
                <span className="text-primary">10-Minute Superstore.</span>
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant max-w-xl mx-auto">
                0% Platform Commission. Seedha aapke UPI Soundbox par paisa. 60 second mein online aao, counter standee print karo aur poore Dhanbad mein becho.
              </p>
            </div>

            {/* Quick 60-Second Onboarding Form */}
            <div className="max-w-md mx-auto">
              <QuickMerchantSignup />
            </div>

            {/* Value Pillars for Kiranas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/20 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon name="currency_rupee" />
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface">0% Commission Promise</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Badi companiyo ki tarah hum aapke munafey se 15-20% commission nahi katte. Aapka 100% munafa aapka rehta hai.
                </p>
              </div>

              <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/20 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <Icon name="qr_code" />
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface">Free Counter Standee (PDF)</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Signup karte hi aapko aapki dukaan ka printable QR code milta hai. Apne counter par lagayein aur customer ko online jodein.
                </p>
              </div>

              <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/20 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                  <Icon name="volume_up" />
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface">Tez Audio Order Ghanti</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Naya order aate hi aapke mobile par loud audio alarm bajti hai aur WhatsApp notification aata hai, taaki koi order miss na ho.
                </p>
              </div>

              <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/20 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon name="book" />
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface">Digital Udhaar Khata</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Purane vishwasu grahako ka Udhaar khata app mein maintain karein. 1-tap par payment reminder bhein.
                </p>
              </div>
            </div>

            {/* Standee Preview CTA */}
            <div className="bg-surface-container-lowest border border-primary/20 rounded-3xl p-6 text-center space-y-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Already Registered?</span>
              <h3 className="font-headline font-bold text-xl text-on-surface">Apni Dukaan Ka Counter Standee Print Karein</h3>
              <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                Customer aate hain counter par? Unhe QR code dikhayein taaki woh ghar baithkar bhi aapse hi samaan mangwayein.
              </p>
              <div className="pt-2">
                <Link
                  href="/vendor/standee"
                  className="px-6 py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                >
                  <Icon name="print" size="sm" />
                  <span>Open Standee Print View</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/15 bg-surface-container-lowest py-8 px-6 text-xs text-on-surface-variant">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="font-headline font-bold text-sm text-on-surface">Paaska Hyperlocal Marketplace</div>
            <p className="text-[11px] text-on-surface-variant/80">
              Powered by Chiti Technologies · Unified Design System v3 · Bank More, Dhanbad (826001)
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs font-medium">
            <Link href="/customer" className="hover:text-primary transition-colors">Storefront</Link>
            <Link href="/vendor" className="hover:text-primary transition-colors">Vendor Cockpit</Link>
            <Link href="/download" className="hover:text-primary transition-colors">Install App</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy (DPDP)</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
