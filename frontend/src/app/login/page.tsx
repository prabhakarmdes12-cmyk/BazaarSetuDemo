'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Icon } from '@/components/ui';
import ChitiBazaarLogo from '@/components/ChitiBazaarLogo';
import { mergeGuestCart, guestCartCount } from '@/lib/guestCart';
import { ApiError } from '@/lib/api';
import { track } from '@/lib/analytics';

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp, register } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor'>('customer');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phone.length < 10) { setError('Please enter a valid 10-digit number'); return; }
    setLoading(true); setError('');
    try {
      const res = await sendOtp(phone);
      if (res.success) { if (res.otp) setGeneratedOtp(res.otp); setStep('otp'); }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to send OTP'); }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) { setError('Please enter the OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await verifyOtp(phone, otp);
      if (res.success) {
        track({ type: 'login', role: res.data.user.role });
        const hadGuestCart = guestCartCount() > 0;
        if (hadGuestCart) await mergeGuestCart(res.data.token);
        router.push(
          res.data.user.role === 'vendor' ? '/vendor'
          : hadGuestCart ? '/customer/cart' : '/customer'
        );
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setStep('register');
      } else {
        setError(err instanceof Error ? err.message : 'Verification failed');
      }
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!acceptedPrivacy) { setError('Account banane ke liye Privacy Policy accept karein'); return; }
    setLoading(true); setError('');
    try {
      const ref = new URLSearchParams(window.location.search).get('ref') || undefined;
      const res = await register(phone, name, role, ref, acceptedPrivacy);
      if (res.success) {
        track({ type: 'register', role });
        const hadGuestCart = guestCartCount() > 0;
        if (hadGuestCart) await mergeGuestCart(res.data.token);
        router.push(role === 'vendor' ? '/vendor' : hadGuestCart ? '/customer/cart' : '/customer');
      }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Registration failed'); }
    setLoading(false);
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col items-center selection:bg-primary-container selection:text-on-primary-container">
      <header className="w-full max-w-md px-8 pt-12 pb-8 flex flex-col items-center">
        <div className="flex flex-col items-center space-y-2">
          <ChitiBazaarLogo size={44} />
          <span className="text-sm font-headline italic font-medium text-on-surface-variant tracking-wide">&apos;Apni local dukaan, ab online&apos;</span>
        </div>
      </header>

      <main className="w-full max-w-md px-8 flex-grow flex flex-col justify-center">
        {step === 'phone' && (
          <div className="space-y-8">
            <div className="relative w-full mb-12 overflow-hidden rounded-xl bg-surface-container-low aspect-[16/9]">
              <Image fill sizes="(max-width: 768px) 100vw, 448px" alt="Vibrant Indian street market scene" className="object-cover opacity-90 scale-105" src="/hero-shop.jpg" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
            </div>
            <div className="space-y-2 text-left">
              <h1 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">Shuru karein</h1>
              <p className="text-on-surface-variant font-medium text-lg">Apna mobile number daalein</p>
            </div>
            <div className="space-y-6">
              <div className="group">
                <label className="block font-label text-sm font-semibold text-on-surface-variant mb-2 ml-1">Mobile number</label>
                <div className="flex items-center space-x-3 bg-surface-container-low rounded-xl px-4 py-4 ring-1 ring-transparent focus-within:ring-primary/30 transition-all duration-300">
                  <div className="flex items-center space-x-2 border-r border-outline-variant/30 pr-3">
                    <span className="text-base font-bold text-on-surface">+91</span>
                    <Icon name="expand_more" className="text-on-surface-variant text-lg" />
                  </div>
                  <input
                    className="bg-transparent border-none focus:ring-0 p-0 w-full text-lg font-semibold placeholder:text-outline/50 placeholder:font-normal tracking-wider"
                    maxLength={10} placeholder="Mobile number" type="tel"
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
              </div>
              {error && <p className="text-error text-sm">{error}</p>}
              <button
                onClick={handleSendOtp} disabled={loading || phone.length < 10}
                className="w-full py-4 rounded-xl leaf-gradient text-on-primary font-headline font-bold text-lg shadow-brand-glow active:scale-[0.98] transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Bhej rahe hain...' : 'OTP bhejein'}</span>
                <Icon name="arrow_forward" className="font-bold" />
              </button>
            </div>
            <div className="pt-8 flex items-center space-x-4">
              <div className="h-[1px] flex-grow bg-surface-container-highest" />
              <span className="text-sm font-medium text-outline">Ya fir inse judiye</span>
              <div className="h-[1px] flex-grow bg-surface-container-highest" />
            </div>
            <div className="flex justify-center space-x-6">
              <button className="w-14 h-14 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center hover:bg-surface-container-high transition-colors active:scale-90">
                <Icon name="mail" className="text-on-surface-variant" />
              </button>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-8">
            <div className="space-y-2 text-left">
              <h1 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">Verify karein</h1>
              <p className="text-on-surface-variant font-medium text-lg">+91 {phone} par OTP bheja gaya</p>
              {generatedOtp && (
                <p className="text-xs text-primary mt-1 bg-primary-fixed px-2 py-1 rounded inline-block">
                  Dev OTP: {generatedOtp}
                </p>
              )}
            </div>
            <div className="space-y-6">
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface-variant mb-2 ml-1">OTP daalein</label>
                <input
                  type="text" placeholder="1234" maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-4 text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-outline/50"
                />
              </div>
              {error && <p className="text-error text-sm">{error}</p>}
              <button
                onClick={handleVerifyOtp} disabled={loading || otp.length < 4}
                className="w-full py-4 rounded-xl leaf-gradient text-on-primary font-headline font-bold text-lg shadow-brand-glow active:scale-[0.98] transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Check kar rahe hain...' : 'Verify karein'}
              </button>
              <button onClick={() => setStep('phone')} className="w-full text-center text-sm text-outline hover:text-primary transition-colors">
                Number badlein
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 pt-4">
              <Icon name="shield" size="sm" className="text-secondary" filled />
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Secure Verification</span>
            </div>
          </div>
        )}

        {step === 'register' && (
          <div className="space-y-8">
            <div className="space-y-2 text-left">
              <h1 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">Register karein</h1>
              <p className="text-on-surface-variant font-medium text-lg">Apna account banayein</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface-variant mb-2 ml-1">Aapka naam</label>
                <input
                  type="text" placeholder="Ramesh Kumar"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-primary/30 text-on-surface placeholder:text-outline/50 text-lg"
                />
              </div>
              <div>
                <label className="block font-label text-sm font-semibold text-on-surface-variant mb-2 ml-1">Main hoon</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRole('customer')}
                    className={`p-4 rounded-xl border-2 text-center transition-all active:scale-95 ${
                      role === 'customer' ? 'border-primary bg-primary-fixed text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
                    }`}
                  >
                    <Icon name="shopping_cart" size="lg" className="block mx-auto mb-1" />
                    <span className="text-sm font-bold">Customer</span>
                  </button>
                  <button
                    onClick={() => setRole('vendor')}
                    className={`p-4 rounded-xl border-2 text-center transition-all active:scale-95 ${
                      role === 'vendor' ? 'border-primary bg-primary-fixed text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
                    }`}
                  >
                    <Icon name="storefront" size="lg" className="block mx-auto mb-1" />
                    <span className="text-sm font-bold">Dukaan</span>
                  </button>
                </div>
              </div>
              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-lowest cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => { setAcceptedPrivacy(e.target.checked); setError(''); }}
                  className="mt-0.5 w-5 h-5 accent-primary"
                />
                <span className="text-sm text-on-surface-variant leading-relaxed">
                  Main apni jaankari ka istemal samajhkar, Chiti Bazaar ki{' '}
                  <a href="/privacy" className="text-primary font-semibold underline">Privacy Policy</a> aur{' '}
                  <a href="/terms" className="text-primary font-semibold underline">Terms &amp; Conditions</a> seekar
                  accept karta/karti hoon.
                </span>
              </label>
              {error && <p className="text-error text-sm">{error}</p>}
              <button
                onClick={handleRegister} disabled={loading || !name.trim() || !acceptedPrivacy}
                className="w-full py-4 rounded-xl leaf-gradient text-on-primary font-headline font-bold text-lg shadow-brand-glow active:scale-[0.98] transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Bana rahe hain...' : 'Account banayein'}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-md px-8 py-10 text-center">
        <p className="text-xs font-label leading-relaxed text-outline/80 px-4">
          Continue karke aap hamare <a href="/terms" className="text-outline underline">Terms &amp; Conditions</a> aur{' '}
          <a href="/privacy" className="text-outline underline">Privacy Policy</a> ko accept karte hain.
        </p>
      </footer>
    </div>
  );
}
