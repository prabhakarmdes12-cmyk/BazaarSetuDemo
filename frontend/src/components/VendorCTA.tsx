'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui';

interface VendorCTAProps {
  onSwitch?: () => void;
}

export default function VendorCTA({ onSwitch }: VendorCTAProps) {
  return (
    <section className="mt-16 bg-surface-container-low rounded-[2rem] p-10 flex flex-col md:flex-row items-center gap-10">
      <div className="flex-1 text-center md:text-left">
        <h3 className="text-3xl font-black mb-4 leading-tight font-headline">
          Kya aapki apni dukaan hai?
        </h3>
        <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
          Chiti Bazaar par aaj hi apni dukaan register karein aur online order lena shuru karein.
        </p>
        {onSwitch ? (
          <Button onClick={onSwitch}>Switch to Vendor</Button>
        ) : (
          <Link href="/vendor">
            <Button>Switch to Vendor</Button>
          </Link>
        )}
      </div>
      <div className="flex-1 w-full max-w-md">
        <div className="relative aspect-square rounded-[2rem] overflow-hidden rotate-3 shadow-2xl">
          <Image
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            alt="Happy indian shop owner holding a digital tablet"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPFqGe-tws6SOpVxcLvwsomnJQzWvVvPDvWapTWIF_kKJMlh3AduHdRc7JLenUeyAH_bLomRY9ftY-xna9jeMwrn-xjY4pWP7C7_7QfCh3WDVIcpg_Bmmc8LLleNuvoCxBZ9F4Ef42FaLlxzKCPwWaU0ZmWKVC9OI1DgQeEaGQNDqJE_XpU7mF8XOwNdyEWqXobTnSjmO27itpFkDmIdLJDBSD_httyc8qdKGEa78yavQaUQ3FGl4lwmxgA7mdhuwujECu0uOpAH8"
          />
        </div>
      </div>
    </section>
  );
}
