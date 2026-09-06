'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { Order, ORDER_STEPS, OrderStatus } from '@/types';
import { api } from '@/lib/api';
import DukaanHotlineModal from '@/components/DukaanHotlineModal';
import { useChitiConnectCall } from '@/hooks/useChitiConnectCall';
import { track } from '@/lib/analytics';

function getStepIndex(status: OrderStatus): number {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [repeating, setRepeating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Missing item in pack');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const orderId = params.id as string;

  // ---- Chiti Connect hotline (masked, no PSTN number ever surfaces) ------
  const [hotlineOpen, setHotlineOpen] = useState(false);
  const [hotlineChatId, setHotlineChatId] = useState<string | null>(null);
  const [hotlineBusy, setHotlineBusy] = useState(false);
  const chitiCall = useChitiConnectCall({ token, chatId: hotlineChatId });

  const callMerchant = useCallback(async () => {
    if (!order || !token || hotlineBusy) return;
    setHotlineBusy(true);
    try {
      let chatId = hotlineChatId;
      if (!chatId) {
        const res = await api.post<{ success: boolean; data: { chatId: string } }>(
          '/api/chats',
          { shopId: order.shopId },
          token,
        );
        if (!res.success) throw new Error('chat unavailable');
        chatId = res.data.chatId;
        setHotlineChatId(chatId);
      }
      setHotlineOpen(true);
      track({ type: 'chiti_connect_call_start', shopId: order.shopId, surface: 'order_tracking' });
      void chitiCall.startCall();
    } catch (err) {
      console.error('Chiti Connect call failed to start:', err);
    } finally {
      setHotlineBusy(false);
    }
  }, [chitiCall, hotlineBusy, hotlineChatId, order, token]);

  const hangUpMerchant = useCallback(() => {
    track({
      type: 'chiti_connect_call_end',
      shopId: order?.shopId || 'unknown',
      durationSeconds: chitiCall.liveAt ? Math.round((Date.now() - chitiCall.liveAt.getTime()) / 1000) : 0,
      status: chitiCall.status,
    });
    void chitiCall.endCall(chitiCall.status === 'LIVE' ? 'ENDED' : 'NO_ANSWER');
  }, [chitiCall, order?.shopId]);

  // The hook only picks up a chat id on the next render, so re-arm once it lands.
  useEffect(() => {
    if (hotlineOpen && hotlineChatId && chitiCall.status === 'IDLE') {
      void chitiCall.startCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotlineChatId, hotlineOpen]);

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

    const handleRepeatOrder = async () => {
    if (!order || !token) return;
    setRepeating(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>(`/api/orders/repeat/${order.id}`, {}, token);
      if (res.success) {
        router.push('/customer/cart');
      }
    } catch (err) {
      console.error('Failed to repeat order:', err);
    }
    setRepeating(false);
  };

  const handleCancelOrder = async () => {
    if (!order || !token) return;
    if (!confirm('Kya aap sach mein yeh order cancel karna chahte hain?')) return;
    setCancelling(true);
    try {
      const res = await api.post<{ success: boolean; data: any }>(`/api/orders/${order.id}/cancel`, { reason: 'Customer ne cancel kiya' }, token);
      if (res.success) {
        setOrder({ ...order, status: 'rejected', cancelReason: 'Customer ne cancel kiya' });
      }
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
    setCancelling(false);
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !token) return;
    setDisputeSubmitting(true);
    try {
      const res = await api.post<{ success: boolean }>(`/api/orders/${order.id}/dispute`, {
        reason: disputeReason,
        details: disputeDetails,
      }, token);
      if (res.success) {
        setDisputeSuccess(true);
        setTimeout(() => {
          setDisputeOpen(false);
          setDisputeSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to report issue:', err);
    }
    setDisputeSubmitting(false);
  };

  const currentStep = order ? getStepIndex(order.status) : -1;
  const isRejected = order?.status === 'rejected';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pt-24 px-6">
        <div className="space-y-4">
          <div className="shimmer h-24 rounded-xl" />
          <div className="shimmer h-64 rounded-xl" />
          <div className="shimmer h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/customer')}
              className="text-primary dark:text-primary active:scale-95 transition-transform duration-200"
            >
              <Icon name="arrow_back" />
            </button>
            <div>
              <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface">Aapka order</h1>
              <p className="font-headline font-extrabold text-primary dark:text-primary italic text-xs">
                Apni local dukaan, ab online
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/customer')}
            className="text-primary dark:text-primary active:scale-95 transition-transform duration-200"
          >
            <Icon name="shopping_basket" />
          </button>
        </div>
      </header>

      <main className="mt-24 px-6 space-y-8 max-w-7xl mx-auto pb-32">
        {/* Order Header */}
        <section className="relative overflow-hidden rounded-xl bg-surface-container-low p-6">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="inline-flex w-fit px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label text-[11px] font-bold tracking-widest uppercase">
              Order ID: #{order?.id?.slice(-6)?.toUpperCase()}
            </span>
            <h2 className="font-headline text-2xl font-bold text-on-surface leading-tight mt-2">
              {order?.shopName || 'Local Shop'}
            </h2>
            {isRejected ? (
              <p className="text-error font-medium">Order cancel ho gaya</p>
            ) : (
              <p className="text-on-surface-variant font-body">
                {currentStep >= 0 ? ORDER_STEPS[currentStep]?.labelHi : 'Status checking...'}
              </p>
            )}
          </div>
          {/* Decorative */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10">
            <Icon name="storefront" className="text-[120px]" filled />
          </div>
        </section>

        {/* Stepper */}
        <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div className="relative flex flex-col gap-8">
            {/* Vertical line */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-surface-container-highest" />
            {!isRejected && currentStep >= 0 && (
              <div
                className="absolute left-4 top-4 w-0.5 editorial-gradient"
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
                        ? 'editorial-gradient text-white'
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
                      <span className="mt-2 text-[11px] font-bold text-secondary uppercase tracking-tighter">
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

        {/* Bento Grid: Merchant + Order Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Merchant Quick Info */}
          <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container flex items-center justify-center">
                <Icon name="storefront" size="xl" className="text-on-surface-variant" />
              </div>
              <div>
                <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest">Merchant</p>
                <h4 className="font-headline font-bold text-on-surface">{order?.shopName || 'Local Shop'}</h4>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={callMerchant}
                disabled={!order || hotlineBusy}
                aria-label="Call merchant via Chiti Connect"
                className="flex-1 leaf-gradient text-white font-label py-3 rounded-xl flex items-center justify-center gap-2 shadow-brand-glow active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                <Icon name="call" size="sm" />
                {hotlineBusy ? 'Connecting…' : 'Call'}
              </button>
              <button className="flex-1 bg-surface-container-highest text-on-surface font-label py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Icon name="location_on" size="sm" />
                Track
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/15">
            <h4 className="font-headline font-bold text-on-surface mb-4">Order Summary</h4>
            <div className="space-y-3">
              {order?.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">{item.productName} x{item.quantity}</span>
                  <span className="font-bold text-on-surface">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-dashed border-outline-variant/30 flex justify-between items-center">
                <span className="font-headline font-bold text-on-surface">Total Bill</span>
                <span className="font-headline font-extrabold text-primary text-xl tracking-tight">
                  ₹{order?.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Help Section */}
        <section className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-on-surface-variant italic font-medium">
            &apos;Apni local dukaan, ab online&apos;
          </p>
          <div className="flex items-center gap-2 text-primary font-label text-xs uppercase tracking-widest">
            <Icon name="support_agent" size="sm" />
            Need help?
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-surface-container-lowest/80 backdrop-blur-xl flex justify-around items-center px-4 pb-6 pt-3 z-50 rounded-t-3xl shadow-bottom-nav">
        <button onClick={() => router.push('/customer')} className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-5 py-2 hover:text-primary active:scale-90 transition-all duration-200">
          <Icon name="storefront" />
          <span className="font-inter text-[11px] font-medium uppercase tracking-wider">Bazaar</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-primary-container dark:bg-primary-container text-primary dark:text-primary-fixed rounded-2xl px-5 py-2 active:scale-90 transition-all duration-200">
          <Icon name="receipt_long" filled />
          <span className="font-inter text-[11px] font-medium uppercase tracking-wider">Orders</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-5 py-2 hover:text-primary active:scale-90 transition-all duration-200">
          <Icon name="chat" />
          <span className="font-inter text-[11px] font-medium uppercase tracking-wider">Chat</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant px-5 py-2 hover:text-primary active:scale-90 transition-all duration-200">
          <Icon name="support_agent" />
          <span className="font-inter text-[11px] font-medium uppercase tracking-wider">Help</span>
        </button>
      </nav>

      <DukaanHotlineModal
        open={hotlineOpen}
        onClose={() => setHotlineOpen(false)}
        status={chitiCall.status}
        callerName={user?.name || order?.customerName || 'Aap'}
        shopName={order?.shopName || 'Local Shop'}
        shopLocality={order?.deliveryPincode ? `Pincode ${order.deliveryPincode}` : undefined}
        liveAt={chitiCall.liveAt}
        isMuted={chitiCall.isMuted}
        isSpeakerOn={chitiCall.isSpeakerOn}
        transport={chitiCall.transport}
        localStream={chitiCall.localStream}
        remoteStream={chitiCall.remoteStream}
        onToggleMute={chitiCall.toggleMute}
        onToggleSpeaker={chitiCall.toggleSpeaker}
        onHangUp={hangUpMerchant}
      />
    </div>
  );
}
