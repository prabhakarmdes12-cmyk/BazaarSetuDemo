'use client';

import ChitiBazaarLogo from '@/components/ChitiBazaarLogo';

export type LandingAudience = 'shopper' | 'merchant';

interface LandingHeaderProps {
  audience: LandingAudience;
  onAudienceChange: (audience: LandingAudience) => void;
  onOpenDownload: () => void;
}

/**
 * Flagship header: Paaska leaf logo, live locality badge, the
 * Shopper/Dukaan audience switcher, and the right-hand [📲 Get App]
 * which opens the PWA Download Modal.
 */
export default function LandingHeader({ audience, onAudienceChange, onOpenDownload }: LandingHeaderProps) {
  return (
    <header className="land-glass sticky top-0 z-40 !rounded-none !border-x-0 !border-t-0">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <ChitiBazaarLogo size={38} variant="full" className="hidden sm:flex" />
        <ChitiBazaarLogo size={34} variant="mark" className="sm:hidden" />

        {/* Live locality badge */}
        <span className="land-pill max-w-[46vw] !text-[11px] sm:!text-[12px]">
          <span className="land-dot shrink-0" aria-hidden />
          <span className="truncate">📍 Bank More, Dhanbad (826001) · 10-Min Delivery Active</span>
        </span>

        <div className="flex items-center gap-2">
          {/* Audience switcher */}
          <div className="land-card hidden items-center gap-1 !rounded-full !border-[rgba(255,255,255,0.1)] p-1 md:flex">
            <button
              type="button"
              onClick={() => onAudienceChange('shopper')}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                audience === 'shopper' ? 'land-btn-leaf !p-0 !py-1.5 !rounded-full' : 'text-[rgba(248,250,252,0.6)] hover:text-white'
              }`}
            >
              🛒 For Shoppers
            </button>
            <button
              type="button"
              onClick={() => onAudienceChange('merchant')}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                audience === 'merchant' ? 'land-btn-leaf !p-0 !py-1.5 !rounded-full' : 'text-[rgba(248,250,252,0.6)] hover:text-white'
              }`}
            >
              🏪 For Dukaan Owners
            </button>
          </div>

          <button type="button" onClick={onOpenDownload} className="land-btn land-btn-leaf !px-4 !py-2.5 text-[13px]">
            <span aria-hidden>📲</span> Get App
          </button>
        </div>
      </div>

      {/* Mobile audience switcher */}
      <div className="border-t border-[rgba(255,255,255,0.06)] px-4 py-2 md:hidden">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => onAudienceChange('shopper')}
            className={`land-chip flex-1 justify-center !py-2 leading-tight ${
              audience === 'shopper' ? '!border-[rgba(34,197,94,0.55)] !bg-[rgba(34,197,94,0.14)]' : ''
            }`}
          >
            🛒 For Shoppers
          </button>
          <button
            type="button"
            onClick={() => onAudienceChange('merchant')}
            className={`land-chip flex-1 justify-center !py-2 leading-tight ${
              audience === 'merchant' ? '!border-[rgba(34,197,94,0.55)] !bg-[rgba(34,197,94,0.14)]' : ''
            }`}
          >
            🏪 For Dukaan Owners
          </button>
        </div>
      </div>
    </header>
  );
}
