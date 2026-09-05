'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { ORDER_STEPS, OrderStatus } from '@/types';
import { api } from '@/lib/api';

interface PublicOrder {
  id: string;
  shopName: string;
  shopPhone: string;
  upiId: string;
  totalAmount: number;
  status: OrderStatus;
  items: { productName: string; quantity: number; price: number }[];
  timeline: { status: OrderStatus; label: string; at: string }[];
  createdAt: string;
}

function getStepIndex(status: OrderStatus): number {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

export default function PublicOrderStatusPage() {
  const router = useRouter();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setError('Order token missing');
      setLoading(false);
      return;
    }
    api.get<{ success: boolean; data?: PublicOrder; message?: string }>(`/api/orders/public/${token}`)
      .then((res) => {
        if (res.success && res.data) setOrder(res.data);
        else setError(res.message || 'Order nahi mila');
      })
      .catch(() => setError('Order nahi mila'))
      .finally(() => setLoading(false));
  }, []);

  const currentStep = order ? getStepIndex(order.status) : -1;
  const isRejected = order?.status === 'rejected';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center space-y-4">
        <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center">
          <Icon name="search_off" size="xl" className="text-on-surface-variant" />
        </div>
        <h1 className="font-headline font-bold text-on-surface text-xl">Order nahi mila</h1>
        <p className="text-on-surface-variant">Ye link galat hai ya order delete ho chuka hai.</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 leaf-gradient text-on-primary font-headline font-bold px-8 py-3 rounded-xl active:scale-95 transition-all"
        >
          Chiti Bazaar par jayein
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pb-16">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar flex justify-between items-center px-6 py-4">
        <span className="font-headline font-extrabold text-primary italic leading-none">Chiti Bazaar</span>
        <span className="font-inter text-[10px] font-medium uppercase tracking-wider text-on-surface-variant italic">
          Apni local dukaan, ab online
        </span>
      </header>

      <main className="pt-24 px-6 max-w-xl mx-auto space-y-6">
        <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-6">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="inline-flex w-fit px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label text-[10px] font-bold tracking-widest uppercase">
              Order ID: #{order.id.slice(-6).toUpperCase()}
            </span>
            <h2 className="font-headline text-2xl font-bold text-on-surface leading-tight mt-2">{order.shopName}</h2>
            {isRejected ? (
              <p className="text-error font-medium">Order cancel ho gaya</p>
            ) : (
              <p className="text-on-surface-variant font-body">
                {currentStep >= 0 ? ORDER_STEPS[currentStep]?.labelHi : 'Status checking...'}
              </p>
            )}
          </div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10">
            <Icon name="storefront" className="text-[120px]" filled />
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div className="relative flex flex-col gap-8">
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-surface-container-highest" />
            {!isRejected && currentStep >= 0 && (
              <div
                className="absolute left-4 top-4 w-0.5 bg-gradient-to-b from-primary to-primary-container"
                style={{ height: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` }}
              />
            )}

            {ORDER_STEPS.map((step, index) => {
              const isCompleted = !isRejected && index < currentStep;
              const isActive = !isRejected && index === currentStep;
              const isFuture = isRejected || index > currentStep;

              return (
                <div key={step.key} className="flex gap-6 items-start relative">
                  <div
                    className={`z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? 'leaf-gradient text-white'
                        : isActive
                          ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary/20'
                          : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {isCompleted ? (
                      <Icon name="check" size="sm" className="text-white font-bold" />
                    ) : (
                      <Icon name={step.icon} size="sm" />
                    )}
                  </div>
                  <div className={`flex flex-col ${isFuture ? 'opacity-60' : ''}`}>
                    <h3 className={`font-headline font-bold ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                      {step.label}
                    </h3>
                    <p className="text-sm text-on-surface-variant">{step.labelHi}</p>
                    {isActive && (
                      <span className="mt-2 text-[10px] font-bold text-secondary uppercase tracking-tighter">
                        Current Status
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {isRejected && (
              <div className="flex gap-6 items-start relative">
                <div className="z-10 w-8 h-8 rounded-full bg-error flex items-center justify-center shrink-0">
                  <Icon name="close" size="sm" className="text-white" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-headline font-bold text-error">Cancelled</h3>
                  <p className="text-sm text-on-surface-variant">Order cancel ho gaya</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/15">
          <h4 className="font-headline font-bold text-on-surface mb-4">Order Summary</h4>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">
                  {item.productName} x{item.quantity}
                </span>
                <span className="font-bold text-on-surface">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-4 mt-4 border-t border-dashed border-outline-variant/30 flex justify-between items-center">
              <span className="font-headline font-bold text-on-surface">Total Bill</span>
              <span className="font-headline font-extrabold text-primary text-xl tracking-tight">
                ₹{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        <section className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-on-surface-variant italic font-medium">&apos;Apni local dukaan, ab online&apos;</p>
          <button
            onClick={() => router.push('/')}
            className="text-primary font-label text-xs uppercase tracking-widest flex items-center gap-1"
          >
            <Icon name="storefront" size="sm" />
            Chiti Bazaar
          </button>
        </section>
      </main>
    </div>
  );
}
