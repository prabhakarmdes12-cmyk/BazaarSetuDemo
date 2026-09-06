'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui';

export default function StandeePage() {
  const [shopName, setShopName] = useState('Bighi Brothers Mart');
  const [shopPhone, setShopPhone] = useState('9876543210');
  const [pincode] = useState('826001');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const userStr = localStorage.getItem('chitibazaar_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.name) setShopName(u.name);
        if (u.phone) setShopPhone(u.phone);
      }
    } catch {
      // fallback
    }
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=https://paaska.in/customer?shop=bighi-brothers-mart`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-8 flex flex-col items-center">
      {/* Screen-only top action bar */}
      <div className="w-full max-w-lg mb-6 flex justify-between items-center print:hidden">
        <Link href="/vendor" className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1">
          <Icon name="arrow_back" size="sm" />
          <span>Back to Cockpit</span>
        </Link>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 active:scale-95 transition-transform"
        >
          <Icon name="print" size="sm" />
          <span>Print Counter Standee (PDF)</span>
        </button>
      </div>

      {/* The Printable A4 Standee Tent Card */}
      <div
        id="standee-card"
        className="w-full max-w-md bg-white border-4 border-emerald-600 rounded-3xl p-8 shadow-2xl text-center space-y-6 print:border-4 print:shadow-none print:m-0 print:w-full print:max-w-none"
      >
        {/* Brand Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-300 px-4 py-1.5 rounded-full text-emerald-800 text-xs font-extrabold uppercase tracking-widest">
            ⚡ 10-Minute Delivery Partner
          </div>
          <h1 className="font-headline font-black text-3xl sm:text-4xl text-slate-900 tracking-tight pt-2">
            {shopName}
          </h1>
          <p className="text-xs text-slate-500 font-semibold tracking-wide">
            Bank More, Dhanbad · PIN {pincode}
          </p>
        </div>

        {/* Big High-Contrast QR Code */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">
          {/* QR Code image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="Paaska Dukaan QR"
            width={240}
            height={240}
            className="rounded-xl shadow-sm"
          />
          <span className="text-[11px] font-bold text-slate-500 pt-2 tracking-wide">
            SCAN WITH CAMERA OR PAYTM / GPAY
          </span>
        </div>

        {/* 3 Clear Consumer Steps in Devanagari */}
        <div className="space-y-3 text-left bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
            <div>
              <p className="text-xs font-bold text-slate-900">Phone Camera se QR Scan karein</p>
              <p className="text-[11px] text-slate-600">Bina kisi app download ke turant dukaan khul jayegi.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
            <div>
              <p className="text-xs font-bold text-slate-900">Bolkar ya likhkar samaan chunein</p>
              <p className="text-[11px] text-slate-600">Hindi parchi bolkar add karein (Doodh, Aalu, Ration).</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
            <div>
              <p className="text-xs font-bold text-slate-900">10 Minute mein ghar baithe payein</p>
              <p className="text-[11px] text-slate-600">Dukaan boy seedha aapke darwaze par samaan layega.</p>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span className="font-bold text-slate-700">Powered by Paaska</span>
          <span>Dukaan Helpline: +91 {shopPhone}</span>
        </div>
      </div>
    </div>
  );
}
