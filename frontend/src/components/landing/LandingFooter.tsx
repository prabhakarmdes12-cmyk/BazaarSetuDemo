import ChitiBazaarLogo from '@/components/ChitiBazaarLogo';

/**
 * Flagship footer — Powered by Chiti Technologies badge plus the four
 * canonical links: Customer App, Merchant Cockpit, Sahayata, Privacy Policy
 * (DPDP compliant).
 */
export default function LandingFooter() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] bg-[#070d1f] py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <ChitiBazaarLogo size={36} variant="full" />
          <p className="mt-3 text-[13px] leading-relaxed text-[rgba(248,250,252,0.55)]">
            Dhanbad ki apni quick-commerce bazaar — taaza doodh, sabzi aur ration, 10 minute mein, aapke nazdeeki
            kirana dukaanon se.
          </p>
          <p className="land-mono mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[rgba(248,250,252,0.45)]">
            Powered by Chiti Technologies · Unified Design System v3
          </p>
        </div>

        <nav className="grid grid-cols-2 gap-x-12 gap-y-3 text-[13.5px]" aria-label="Footer">
          <div className="flex flex-col gap-3">
            <a href="/customer" className="text-[rgba(248,250,252,0.75)] transition-colors hover:text-[#22C55E]">
              🛒 Customer App
            </a>
            <a href="/vendor" className="text-[rgba(248,250,252,0.75)] transition-colors hover:text-[#22C55E]">
              🏪 Merchant Cockpit
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <a href="/customer" className="text-[rgba(248,250,252,0.75)] transition-colors hover:text-[#22C55E]">
              ☎️ Sahayata / Support
            </a>
            <a href="/privacy" className="text-[rgba(248,250,252,0.75)] transition-colors hover:text-[#22C55E]">
              🔒 Privacy Policy (DPDP)
            </a>
          </div>
        </nav>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-[rgba(255,255,255,0.06)] px-4 pt-5 sm:px-6">
        <p className="text-[11.5px] text-[rgba(248,250,252,0.4)]">
          © {new Date().getFullYear()} Paaska · Dhanbad, Jharkhand 826001 · Aapke data ka intezaam DPDP Act 2023
          ke mutabik.
        </p>
      </div>
    </footer>
  );
}
