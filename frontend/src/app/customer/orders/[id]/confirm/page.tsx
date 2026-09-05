'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Icon, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types';
import { api } from '@/lib/api';
import { buildOrderShareLink } from '@/lib/whatsapp';

export default function OrderConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = params.id as string;

  useEffect(() => {
    if (!token) {
      window.location.assign('/login');
      return;
    }
    if (orderId) {
      api.get<{ success: boolean; data: Order }>(`/api/orders/${orderId}`, token)
        .then((res) => { if (res.success) setOrder(res.data); })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="shimmer w-32 h-32 rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen flex flex-col items-center">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 shadow-top-bar">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/customer')}
            className="text-on-surface-variant hover:bg-primary-container p-2 rounded-full transition-colors active:scale-95"
          >
            <Icon name="arrow_back" />
          </button>
          <div className="flex flex-col">
            <span className="font-headline font-extrabold text-primary italic leading-none">Chiti Bazaar</span>
            <span className="font-inter text-[11px] font-medium uppercase tracking-wider text-on-surface-variant italic mt-0.5">
              Apni local dukaan, ab online
            </span>
          </div>
        </div>
        <Icon name="shopping_basket" className="text-on-surface-variant" />
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 pt-24 pb-32 max-w-md w-full">
        {/* Visual Success */}
        <div className="relative w-full max-w-sm mb-12">
          <div className="absolute -top-8 -left-4 w-32 h-32 bg-primary-fixed opacity-40 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -right-4 w-40 h-40 bg-secondary-fixed opacity-20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-64 h-64 rounded-xl bg-surface-container-low flex items-center justify-center overflow-hidden mb-8 shadow-editorial-lg">
              <Image
                fill
                sizes="256px"
                className="object-cover mix-blend-multiply opacity-90"
                alt="Happy Indian shopkeeper"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQIR3STloBTvrM6-uiLiAHe8LYle7yq67XExgef2Zh9R8lOyjMm7u_X1_5NSkZhVCQpui6Jxq04ZQEuUHtTXiIqUVCJV7PuxrY1U9YUV888a9wO1Az_jcvt_TYzakCcinYOIIciNNqADI7vYJJEqCJcOs300COztT6cZuMgotpIsUrmhH70N6b7UNd6VfcMCzLpCloq0kxWsdA-kcFhw64bQSQYjQsZ_Nowyouh4Fnad7obC_ADU01d_e0IoEA1rPnw6q1d8HhqTM"
              />
            </div>
            {/* Success badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-20">
              <div className="bg-secondary p-4 rounded-full shadow-lg scale-110">
                <Icon name="check_circle" size="xl" className="text-white" filled />
              </div>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center max-w-md w-full">
          <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mb-2">
            Order confirm ho gaya
          </h1>
          <p className="text-on-surface-variant font-medium text-lg mb-8">
            Dukaan aapka order prepare kar rahi hai
          </p>

          {/* Order ID chip */}
          <div className="inline-flex items-center gap-2 bg-surface-container-highest px-4 py-2 rounded-full mb-12">
            <Icon name="tag" className="text-primary" />
            <span className="font-label font-bold text-on-surface text-sm">
              Order ID: #{order?.id?.slice(-6)?.toUpperCase() || orderId?.slice(-6)?.toUpperCase()}
            </span>
          </div>

          {/* Store details card */}
          <div className="bg-surface-container-low rounded-xl p-6 text-left mb-12 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-surface-container-lowest shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
              <Icon name="storefront" size="xl" className="text-on-surface-variant" />
            </div>
            <div className="flex-grow">
              <span className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-1 block">Preparing at</span>
              <h3 className="font-headline font-bold text-on-surface leading-tight">
                {order?.shopName || 'Local Shop'}
              </h3>
              <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-1">
                <Icon name="location_on" size="sm" />
                Your local marketplace
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push(`/customer/orders/${orderId}`)}
            className="w-full editorial-gradient py-5 rounded-xl shadow-top-bar active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-white"
          >
            <Icon name="local_shipping" filled className="text-white" />
            <span className="font-headline font-bold text-lg">Order track karein</span>
          </button>

          <button
            onClick={() => {
              const publicToken = order?.publicToken || '';
              const statusUrl = `${window.location.origin}/order-status?token=${publicToken}`;
              window.open(
                buildOrderShareLink(order?.shopName || 'Local Shop', orderId, order?.totalAmount || 0, statusUrl),
                '_blank',
              );
            }}
            disabled={!order?.publicToken}
            className="mt-3 w-full py-4 rounded-xl bg-[#25D366] text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 font-headline font-bold disabled:opacity-40"
          >
            <Icon name="chat" filled className="text-white" />
            WhatsApp par share karein
          </button>

          <button
            onClick={() => router.push('/customer')}
            className="mt-6 w-full py-4 text-on-surface-variant font-headline font-bold hover:bg-surface-container-low transition-colors rounded-xl"
          >
            Bazaar wapas chalo
          </button>
        </div>
      </main>
    </div>
  );
}
