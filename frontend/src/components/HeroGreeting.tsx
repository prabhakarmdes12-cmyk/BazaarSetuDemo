'use client';

import { Icon } from '@/components/ui';

interface HeroGreetingProps {
  name?: string;
  subtitle?: string;
}

export default function HeroGreeting({
  name,
  subtitle = 'Welcome back to your digital courtyard.',
}: HeroGreetingProps) {
  return (
    <section className="pt-8 pb-6">
      <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
        Namaste{name ? `, ${name}` : ''} <Icon name="waving_hand" size="lg" />
      </h1>
      <p className="text-on-surface-variant font-medium">{subtitle}</p>
    </section>
  );
}
