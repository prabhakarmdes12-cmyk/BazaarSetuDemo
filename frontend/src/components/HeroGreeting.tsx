'use client';

import { Icon } from '@/components/ui';

interface HeroGreetingProps {
  name?: string;
  subtitle?: string;
}

export default function HeroGreeting({
  name,
  subtitle = 'Fresh veggies & kirana in 10 mins from your trusted neighborhood dukaans.',
}: HeroGreetingProps) {
  return (
    <section className="pt-8 pb-6">
      <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline flex items-center gap-2">
        Namaste{name ? `, ${name}` : ''} <Icon name="waving_hand" size="lg" className="text-primary animate-leaf-sway" />
      </h1>
      <p className="text-on-surface-variant font-medium max-w-md">{subtitle}</p>
    </section>
  );
}
