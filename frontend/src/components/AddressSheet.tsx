'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from './ui';
import {
  ADDRESS_LABELS,
  AddressLabel,
  DeliveryAddress,
  formatAddress,
  getAddresses,
  isServiceablePincode,
  removeAddress,
  saveAddress,
} from '@/lib/address';

interface AddressSheetProps {
  open: boolean;
  onClose: () => void;
  /** Fired with the chosen address once the user confirms. */
  onSelect: (address: DeliveryAddress) => void;
  selectedId?: string;
}

/**
 * Bottom-sheet address book: pick a saved address or add a new one.
 *
 * Bottom sheet rather than a full route so checkout is never navigated away
 * from — the cart stays mounted underneath and the user keeps their context.
 */
export default function AddressSheet({ open, onClose, onSelect, selectedId }: AddressSheetProps) {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [adding, setAdding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: 'Ghar' as AddressLabel,
    line1: '',
    line2: '',
    city: '',
    pincode: '',
    contactName: '',
    contactPhone: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
  });

  useEffect(() => {
    if (open) {
      const list = getAddresses();
      setAddresses(list);
      // Jump straight to the form when the book is empty — one less tap.
      setAdding(list.length === 0);
      setError(null);
    }
  }, [open]);

  // Lock background scroll while the sheet is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Is device par location available nahi hai');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        setError('Location nahi mil payi — address haath se bhar dein');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleSave = () => {
    if (!form.line1.trim()) return setError('Ghar / flat number likhein');
    if (!form.city.trim()) return setError('Sheher likhein');
    if (!isServiceablePincode(form.pincode)) return setError('6 ank ka sahi PIN code likhein');
    if (form.contactPhone && !/^[6-9]\d{9}$/.test(form.contactPhone)) {
      return setError('10 ank ka sahi mobile number likhein');
    }

    const saved = saveAddress({
      label: form.label,
      line1: form.line1.trim(),
      line2: form.line2.trim(),
      city: form.city.trim(),
      pincode: form.pincode.trim(),
      contactName: form.contactName.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      lat: form.lat,
      lng: form.lng,
      isDefault: addresses.length === 0,
    });
    setAddresses(getAddresses());
    setAdding(false);
    onSelect(saved);
    onClose();
  };

  const handleDelete = (id: string) => {
    removeAddress(id);
    const next = getAddresses();
    setAddresses(next);
    if (next.length === 0) setAdding(true);
  };

  const field =
    'w-full bg-surface-container-low border border-white/10 focus:border-primary/60 rounded-xl px-3.5 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none transition-colors';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Delivery address"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[61] max-h-[88vh] overflow-y-auto bg-surface-container rounded-t-3xl border-t border-white/10 shadow-elevated"
          >
            <div className="sticky top-0 bg-surface-container/95 backdrop-blur-md px-5 pt-3 pb-3 border-b border-white/5 z-10">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <h2 className="font-headline font-black text-lg text-on-surface">
                  {adding ? 'Naya address' : 'Delivery kahan karein?'}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Band karein"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition"
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>

            <div className="px-5 pb-8 pt-4 space-y-3">
              {!adding && (
                <>
                  {addresses.map((a) => {
                    const active = a.id === selectedId;
                    return (
                      <div
                        key={a.id}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition ${
                          active
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-white/5 bg-surface-container-low'
                        }`}
                      >
                        <button
                          onClick={() => {
                            onSelect(a);
                            onClose();
                          }}
                          className="flex-1 flex items-start gap-3 text-left min-w-0"
                        >
                          <span className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                            <Icon
                              name={ADDRESS_LABELS.find((l) => l.value === a.label)?.icon || 'location_on'}
                              size="sm"
                              filled
                              className="text-primary"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="font-bold text-sm text-on-surface font-headline">{a.label}</span>
                              {a.isDefault && (
                                <span className="text-[11px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </span>
                            <span className="block text-[13px] text-on-surface-variant leading-snug mt-0.5">
                              {formatAddress(a)}
                            </span>
                            {a.contactPhone && (
                              <span className="block text-[11px] text-on-surface-variant/70 mt-0.5">
                                {a.contactName ? `${a.contactName} · ` : ''}
                                {a.contactPhone}
                              </span>
                            )}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          aria-label={`${a.label} address hatayein`}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition shrink-0"
                        >
                          <Icon name="delete" size="sm" />
                        </button>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => setAdding(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-primary/40 text-primary font-bold text-sm hover:bg-primary/5 transition min-h-[44px]"
                  >
                    <Icon name="add_location_alt" size="sm" />
                    Naya address jodein
                  </button>
                </>
              )}

              {adding && (
                <div className="space-y-3">
                  {/* Label chips */}
                  <div className="flex gap-2">
                    {ADDRESS_LABELS.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => setForm((f) => ({ ...f, label: l.value }))}
                        className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-bold transition min-h-[44px] ${
                          form.label === l.value
                            ? 'border-primary/60 bg-primary/15 text-primary'
                            : 'border-white/5 bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        <Icon name={l.icon} size="sm" filled={form.label === l.value} />
                        {l.value}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={useMyLocation}
                    disabled={locating}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold text-[13px] disabled:opacity-60 transition min-h-[44px]"
                  >
                    <Icon name={locating ? 'progress_activity' : 'my_location'} size="sm" />
                    {locating ? 'Location dhoondh rahe hain…' : 'Meri location use karein'}
                  </button>
                  {form.lat != null && (
                    <p className="text-[11px] text-primary flex items-center gap-1">
                      <Icon name="check_circle" size="sm" filled />
                      Location mil gayi ({form.lat.toFixed(4)}, {form.lng?.toFixed(4)})
                    </p>
                  )}

                  <input
                    className={field}
                    placeholder="Ghar / flat / building no."
                    value={form.line1}
                    onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                  />
                  <input
                    className={field}
                    placeholder="Mohalla, landmark (jaise: Ashok Nagar, mandir ke paas)"
                    value={form.line2}
                    onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className={field}
                      placeholder="Sheher"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    />
                    <input
                      className={field}
                      placeholder="PIN code"
                      inputMode="numeric"
                      maxLength={6}
                      value={form.pincode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className={field}
                      placeholder="Naam (optional)"
                      value={form.contactName}
                      onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                    />
                    <input
                      className={field}
                      placeholder="Mobile (optional)"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.contactPhone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))
                      }
                    />
                  </div>

                  {error && (
                    <p className="text-[13px] text-error flex items-center gap-1.5" role="alert">
                      <Icon name="error" size="sm" filled />
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 pt-1">
                    {addresses.length > 0 && (
                      <button
                        onClick={() => {
                          setAdding(false);
                          setError(null);
                        }}
                        className="flex-1 py-3.5 rounded-xl border border-white/10 text-on-surface-variant font-bold text-sm min-h-[44px]"
                      >
                        Wapas
                      </button>
                    )}
                    <button
                      onClick={handleSave}
                      className="flex-[2] py-3.5 rounded-xl leaf-gradient text-white font-black text-sm shadow-brand-glow active:scale-[0.98] transition min-h-[44px]"
                    >
                      Address save karein
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
