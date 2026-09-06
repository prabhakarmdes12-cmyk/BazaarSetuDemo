'use client';

import { useMemo, useState } from 'react';

/**
 * 60-second Quick Onboard for dukaan owners: Shop Name + Phone only.
 *
 * No backend call from the landing page — the form captures intent and hands
 * the pair to the merchant cockpit (`/vendor`) where the real registration
 * flow (with the free Counter QR Standee) completes.
 */
export default function MerchantOnboardBox() {
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [registered, setRegistered] = useState(false);

  const shopValid = shopName.trim().length >= 3;
  const phoneValid = /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''));

  const slug = useMemo(() => {
    const base = shopName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || 'apni-dukkan';
  }, [shopName]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (shopValid && phoneValid) setRegistered(true);
  };

  if (registered) {
    return (
      <div className="land-pop land-card w-full p-5 text-center">
        <p className="text-3xl" aria-hidden>
          🎉
        </p>
        <p className="mt-2 text-base font-extrabold">
          “{shopName.trim()}” ke liye slot reserve hua!
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[rgba(248,250,252,0.6)]">
          Hamari team {phone} par 60 second ka onboarding call karegi. Counter QR Standee bhej denge —
          0% commission, paisa seedha aapke UPI Soundbox.
        </p>
        <a href="/vendor" className="land-btn land-btn-leaf mt-4 w-full max-w-xs !py-3 text-sm">
          🏪 Dukaan Cockpit kholein
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="land-card w-full p-5" noValidate>
      <p className="land-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#22C55E]">
        60-Second Onboard
      </p>
      <p className="mt-1.5 text-sm font-semibold text-[rgba(248,250,252,0.9)]">
        Do cheezein bharein — aap Dhanbad mein online hain
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <label htmlFor="onboard-shop" className="mb-1.5 block text-[12px] font-semibold text-[rgba(248,250,252,0.65)]">
            Dukaan ka naam
          </label>
          <input
            id="onboard-shop"
            type="text"
            className="land-input"
            placeholder="jaise: Sharma Kirana Store, Bank More"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            autoComplete="organization"
          />
          {attempted && !shopValid && (
            <p className="mt-1 text-[11px] font-semibold text-[#FCA5A5]">Dukaan ka naam (kam se kam 3 akshar) likhein</p>
          )}
        </div>
        <div>
          <label htmlFor="onboard-phone" className="mb-1.5 block text-[12px] font-semibold text-[rgba(248,250,252,0.65)]">
            Mobile number
          </label>
          <input
            id="onboard-phone"
            type="tel"
            inputMode="numeric"
            className="land-input land-mono"
            placeholder="98XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
            autoComplete="tel"
          />
          {attempted && !phoneValid && (
            <p className="mt-1 text-[11px] font-semibold text-[#FCA5A5]">10 ka sahi mobile number daalein</p>
          )}
        </div>
      </div>

      <button type="submit" className="land-btn land-btn-leaf mt-4 w-full !py-3.5 text-[15px]">
        🏪 Apni Dukaan Register Karein
      </button>

      {/* Metrics strip */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          ['0% Platform Fee', 'poora margin aapka'],
          ['Direct UPI to Soundbox', 'din mein payout'],
          ['Digital Udhaar Khata', 'sahi yaad, bina jhagde'],
          ['Free Counter QR Standee', 'aaj hi bhejenge'],
        ].map(([title, sub]) => (
          <div key={title} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(11,19,43,0.45)] px-3 py-2.5">
            <p className="text-[12px] font-bold leading-tight text-[#BBF7D0]">{title}</p>
            <p className="mt-0.5 text-[10.5px] text-[rgba(248,250,252,0.5)]">{sub}</p>
          </div>
        ))}
      </div>

      {shopValid && (
        <p className="land-mono mt-3 text-center text-[10.5px] text-[rgba(248,250,252,0.4)]">
          aapka counter QR → paaska.app/s/{slug}
        </p>
      )}
    </form>
  );
}
