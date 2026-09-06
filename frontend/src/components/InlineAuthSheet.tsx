'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { mergeGuestCart } from '@/lib/guestCart';
import { User } from '@/types';

interface InlineAuthSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
}

export default function InlineAuthSheet({ open, onClose, onSuccess }: InlineAuthSheetProps) {
  const { sendOtp, verifyOtp, register } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  if (!open) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Kripya 10-digit mobile number enter karein');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await sendOtp(cleanPhone);
      if (res.success) {
        if (res.otp) setDemoOtp(res.otp);
        setStep('otp');
      } else {
        setError('OTP bhejne mein samasya aayi. Kripya punah prayas karein.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OTP request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Kripya 4-digit OTP enter karein');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(phone, otp);
      if (res.success && res.data) {
        await mergeGuestCart(res.data.token);
        onSuccess(res.data.user, res.data.token);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('register')) {
        setStep('register');
      } else {
        setError(msg || 'Galat OTP! Kripya sahi OTP dalein.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Kripya apna naam likhein');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await register(phone, name.trim(), 'customer', undefined, true);
      if (res.success && res.data) {
        await mergeGuestCart(res.data.token);
        onSuccess(res.data.user, res.data.token);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-t-3xl p-6 shadow-2xl space-y-5 animate-slide-up">
        <div className="flex justify-between items-center border-b border-outline-variant/15 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full leaf-gradient flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-on-surface">
                {step === 'phone' ? 'Phone Number Enter Karein' : step === 'otp' ? 'OTP Verify Karein' : 'Aapka Naam'}
              </h3>
              <p className="text-xs text-on-surface-variant">1-Tap Instant Checkout · Zero Drop-off</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant">
            <Icon name="close" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2 text-xs text-error">
            <Icon name="error" size="sm" filled />
            <span>{error}</span>
          </div>
        )}

        {demoOtp && step === 'otp' && (
          <div className="p-2.5 bg-secondary-container/40 border border-secondary/25 rounded-xl flex justify-between items-center text-xs text-on-secondary-container">
            <span>Pilot Demo OTP: <strong>{demoOtp}</strong></span>
            <button
              type="button"
              onClick={() => setOtp(demoOtp)}
              className="px-2 py-1 bg-secondary text-on-secondary rounded font-bold hover:opacity-90"
            >
              Auto-fill
            </button>
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="flex items-center gap-2 border border-outline-variant/30 rounded-xl px-3.5 py-3 bg-surface-container-low focus-within:border-primary transition-colors">
                <span className="text-sm font-bold text-on-surface-variant">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full bg-transparent font-headline text-base text-on-surface outline-none tracking-wide"
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full py-3.5 rounded-xl leaf-gradient text-white font-bold text-base shadow-md disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              {loading ? 'Bhej rahe hain...' : 'OTP Payein'}
              <Icon name="arrow_forward" size="sm" />
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Enter 4-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Change +91 {phone}
                </button>
              </div>
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center tracking-[0.5em] font-headline text-2xl font-bold py-3 border border-outline-variant/30 rounded-xl bg-surface-container-low text-on-surface outline-none focus:border-primary"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full py-3.5 rounded-xl leaf-gradient text-white font-bold text-base shadow-md disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              {loading ? 'Verify ho raha hai...' : 'Verify & Complete Order'}
              <Icon name="check" size="sm" />
            </button>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Aapka Shubh Naam
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jaise: Rahul Sharma"
                className="w-full px-4 py-3 border border-outline-variant/30 rounded-xl bg-surface-container-low text-on-surface outline-none focus:border-primary text-base"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-3.5 rounded-xl leaf-gradient text-white font-bold text-base shadow-md disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              {loading ? 'Saving...' : 'Shuru Karein'}
              <Icon name="check" size="sm" />
            </button>
          </form>
        )}

        <div className="text-center text-[11px] text-on-surface-variant/70">
          Continuing agrees to Paaska Terms & Privacy Policy · DPDP Compliant
        </div>
      </div>
    </div>
  );
}
