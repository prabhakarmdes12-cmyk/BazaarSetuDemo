'use client';

import { useMemo, useState } from 'react';
import { qrEncode, qrToSvgPath } from '@/lib/qr';

/**
 * Merchant Counter QR Standee preview.
 *
 * An interactive acrylic standee mockup: type a shop name and watch the
 * counter QR (the exact payload printed on the free standee) re-encode live
 * in the house QR encoder — the same one that powers the PWA install QR.
 */
const BASE = 'paaska.app/s/';

function StandeeQr({ slug, className = '' }: { slug: string; className?: string }) {
  const matrix = useMemo(() => {
    try {
      return qrEncode(`${BASE}${slug}`);
    } catch {
      return null;
    }
  }, [slug]);

  if (!matrix) return <div className={`${className} rounded-lg bg-[#0B132B]`} />;
  const path = qrToSvgPath(matrix);
  return (
    <svg
      viewBox={`0 0 ${matrix.size} ${matrix.size}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Counter QR for ${slug}`}
    >
      <path d={path} fill="#0B132B" />
    </svg>
  );
}

export default function StandeePreview() {
  const [shop, setShop] = useState('Sharma Kirana Store');
  const [tilt, setTilt] = useState(false);

  const slug = useMemo(() => {
    const base = shop
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || 'apni-dukkan';
  }, [shop]);

  return (
    <section className="relative border-t border-[rgba(255,255,255,0.06)] py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div className="land-rise">
          <p className="land-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#22C55E]">
            Free Counter QR Standee
          </p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">
            Dukaan ke counter par <span className="leaf-text-gradient">apna QR</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[rgba(248,250,252,0.7)]">
            Har dukaan ko ek acrylic standee bhejenge — customer scan kare, aapki dukaan khule. Na koi app install
            karna, na koi login. QR ke peeche aapka hi menu, aapki hi dukaan.
          </p>

          <div className="mt-6 flex max-w-md flex-col gap-3">
            <label htmlFor="standee-shop" className="text-[12px] font-semibold text-[rgba(248,250,252,0.6)]">
              Apni dukaan ka naam likh kar dekhein
            </label>
            <input
              id="standee-shop"
              type="text"
              className="land-input"
              placeholder="Sharma Kirana Store"
              value={shop}
              onChange={(e) => setShop(e.target.value)}
              maxLength={40}
            />
            <p className="land-mono text-[11px] text-[rgba(248,250,252,0.6)]">
              {BASE}
              {slug}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTilt((t) => !t)}
            className="land-btn land-btn-ghost mt-6 !px-5 !py-3 text-[13px]"
          >
            {tilt ? '⤵️ Standee seedha karein' : '🔁 Standee ghuma kar dekhein'}
          </button>
        </div>

        {/* Acrylic standee mockup — standing on the real counter */}
        <div className="land-rise land-rise-2 flex justify-center">
          <div className="relative w-full max-w-md sm:max-w-lg">
            {/* Kirana counter photo backdrop */}
            <div className="relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.1)] shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/landing/kirana-counter.jpg"
                alt="Kirana dukaan ka counter — jars, masale aur QR standee ki jagah"
                className="h-[400px] w-full object-cover sm:h-[460px]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,13,31,0.66)] via-[rgba(7,13,31,0.2)] to-[rgba(7,13,31,0.45)]" aria-hidden />
            </div>

          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
            style={{
              transform: tilt ? 'perspective(900px) rotateY(-18deg) rotateX(6deg)' : 'perspective(900px) rotateY(0deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="land-sheen relative w-64 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.16)] bg-gradient-to-b from-[rgba(248,250,252,0.94)] to-[rgba(226,232,240,0.85)] p-5 shadow-[0_30px_80px_rgba(2,6,23,0.6)] sm:w-72">
              {/* Acrylic top bar */}
              <div className="mb-3 flex items-center justify-between">
                <span className="land-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#0B132B]">
                  Paaska
                </span>
                <span className="rounded-full bg-[#16A34A] px-2 py-0.5 text-[8.5px] font-bold text-white">
                  10-MIN
                </span>
              </div>

              {/* QR on white card */}
              <div className="mx-auto w-fit rounded-xl bg-white p-3 shadow-[0_8px_24px_rgba(11,19,43,0.18)]">
                <StandeeQr slug={slug} className="block h-auto w-40 sm:w-44" />
              </div>

              <p className="mt-4 truncate text-center text-[15px] font-extrabold text-[#0B132B]">{shop.trim() || 'Aapki Dukaan'}</p>
              <p className="land-mono mt-1 truncate text-center text-[10px] text-[rgba(11,19,43,0.55)]">{BASE}{slug}</p>

              <p className="mt-3 text-center text-[10.5px] font-semibold text-[#16A34A]">
                Scan karein · {shop.trim() || 'Aapki dukaan'} par order karein
              </p>
            </div>

            {/* Acrylic base */}
            <div className="mx-auto h-3 w-40 rounded-b-lg bg-gradient-to-b from-[rgba(255,255,255,0.25)] to-[rgba(255,255,255,0.05)]" />
            <div className="mx-auto h-1.5 w-52 rounded-full bg-[rgba(255,255,255,0.12)]" />
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
