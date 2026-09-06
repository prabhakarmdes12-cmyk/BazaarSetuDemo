'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function QuickMerchantSignup() {
  const router = useRouter();
  const { sendOtp } = useAuth();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState('826001');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setError('Kripya dukaan ka naam enter karein');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Kripya 10-digit mobile number dalein');
      return;
    }
    if (pincode.length !== 6) {
      setError('Kripya 6-digit Pincode dalein');
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
        setError('OTP bhejne mein samasya aayi.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Kripya 4-digit OTP dalein');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Direct registration with shopName and pincode
      const res = await api.post<{ success: boolean; data: { token: string; user: { id: string; role: string } } }>(
        '/api/auth/register',
        {
          phone,
          name: shopName.trim(),
          role: 'vendor',
          shopName: shopName.trim(),
          pincode: pincode.trim(),
          acceptPrivacy: true,
        }
      );

      if (res.success && res.data) {
        localStorage.setItem('chitibazaar_token', res.data.token);
        localStorage.setItem('chitibazaar_user', JSON.stringify(res.data.user));
        localStorage.setItem('chitibazaar_role', 'vendor');
        router.push('/vendor/standee');
      }
    } catch (err: unknown) {
      // If already registered, attempt login verification
      try {
        const verifyRes = await api.post<{ success: boolean; data: { token: string; user: { id: string; role: string } } }>(
          '/api/auth/verify-otp',
          { phone, otp }
        );
        if (verifyRes.success && verifyRes.data) {
          localStorage.setItem('chitibazaar_token', verifyRes.data.token);
          localStorage.setItem('chitibazaar_user', JSON.stringify(verifyRes.data.user));
          localStorage.setItem('chitibazaar_role', 'vendor');
          router.push('/vendor/standee');
          return;
        }
      } catch {
        setError(err instanceof Error ? err.message : 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-surface-container-low border border-primary/25 rounded-3xl p-6 shadow-xl space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <h3 className="font-headline font-bold text-lg text-on-surface">60-Second Kirana Onboarding</h3>
        </div>
        <p className="text-xs text-on-surface-variant">
          Zero Commission · Direct UPI to Soundbox · Instant Free Counter QR Standee
        </p>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2 text-xs text-error">
          <Icon name="error" size="sm" filled />
          <span>{error}</span>
        </div>
      )}

      {demoOtp && step === 'otp' && (
        <div className="p-2.5 bg-secondary-container/40 border border-secondary/25 rounded-xl flex justify-between items-center text-xs text-on-secondary-container">
          <span>Demo OTP: <strong>{demoOtp}</strong></span>
          <button
            type="button"
            onClick={() => setOtp(demoOtp)}
            className="px-2 py-1 bg-secondary text-on-secondary rounded font-bold hover:opacity-90"
          >
            Auto-fill
          </button>
        </div>
      )}

      {step === 'details' ? (
        <form onSubmit={handleSendOtp} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Dukaan Ka Naam</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Jaise: Bighi Brothers Mart"
              className="w-full px-3.5 py-2.5 border border-outline-variant/30 rounded-xl bg-surface-container-lowest text-on-surface outline-none focus:border-primary text-sm font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">Mobile Number</label>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 border border-outline-variant/30 rounded-xl bg-surface-container-lowest text-on-surface outline-none focus:border-primary text-sm font-medium"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant">Pincode</label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="826001"
                className="w-full px-3.5 py-2.5 border border-outline-variant/30 rounded-xl bg-surface-container-lowest text-on-surface outline-none focus:border-primary text-sm font-medium"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl leaf-gradient text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Apni Dukaan Shuru Karein (Get OTP)'}
            <Icon name="arrow_forward" size="sm" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyAndRegister} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-on-surface-variant">Enter 4-Digit OTP for +91 {phone}</label>
            <input
              type="text"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-[0.5em] font-headline text-2xl font-bold py-2.5 border border-outline-variant/30 rounded-xl bg-surface-container-lowest text-on-surface outline-none focus:border-primary"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 4}
            className="w-full py-3.5 rounded-xl leaf-gradient text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Activating Shop...' : 'Activate Dukaan & Print Standee'}
            <Icon name="check" size="sm" />
          </button>
        </form>
      )}

      <div className="pt-2 border-t border-outline-variant/15 flex justify-between items-center text-[11px] text-on-surface-variant">
        <span>Bank IFSC & KYC first payout par zaroori hoga</span>
        <span className="text-primary font-bold">100% Free</span>
      </div>
    </div>
  );
}
