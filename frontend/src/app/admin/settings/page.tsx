'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

interface SettingCategory {
  icon: string;
  label: string;
  description: string;
  tags?: string[];
  toggle?: boolean;
  toggleLabel?: string;
}

const SETTING_CATEGORIES: SettingCategory[] = [
  {
    icon: 'person',
    label: 'Mera Profile',
    description: 'Personal info and app preferences.',
    tags: ['EMAIL', 'NOTIFS'],
  },
  {
    icon: 'settings_applications',
    label: 'Platform Settings',
    description: 'System-wide toggles and modes.',
    toggle: true,
    toggleLabel: 'Signup Open',
  },
  {
    icon: 'lock',
    label: 'Security',
    description: 'Admin PIN and 2-Factor Auth.',
  },
  {
    icon: 'support_agent',
    label: 'Support & Feedback',
    description: 'Merchant queries and app reviews.',
  },
];

const LEGAL_ITEMS = [
  { icon: 'policy', label: 'Privacy Policy' },
  { icon: 'gavel', label: 'Terms of Service' },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { token, user, logout, isLoading: authLoading } = useAuth();
  const [signupOpen, setSignupOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) { window.location.assign('/login'); }
  }, [token, authLoading]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-top-bar flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary-container transition-colors active:scale-95 text-primary"
          >
            <Icon name="arrow_back" />
          </button>
          <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface">Settings</h1>
        </div>
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary-container transition-colors active:scale-95 text-primary">
          <Icon name="more_vert" />
        </button>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8 pb-32">
        {/* Admin Profile Header */}
        <section className="relative overflow-hidden p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 shadow-sm">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl" />
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center ring-4 ring-primary-container/20 overflow-hidden">
                <Icon name="person" size="xl" className="text-on-surface-variant" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full border-2 border-white flex items-center justify-center">
                <Icon name="verified" size="sm" filled className="text-white text-[12px]" />
              </div>
            </div>
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface">{user?.name || 'Admin'}</h2>
              <p className="text-primary font-semibold text-sm tracking-wide flex items-center gap-1.5">
                <Icon name="shield_person" size="sm" />
                Super Admin
              </p>
              <p className="text-on-surface-variant/60 text-xs mt-1 italic tracking-tight">Apni local dukaan, ab online</p>
            </div>
          </div>
        </section>

        {/* Settings Categories: Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SETTING_CATEGORIES.map((cat) => (
            <div key={cat.label} className="group p-6 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-primary-container/20 rounded-xl text-primary">
                  <Icon name={cat.icon} filled />
                </div>
                <Icon name="chevron_right" className="text-outline group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface">{cat.label}</h3>
              <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">{cat.description}</p>
              {cat.tags && (
                <div className="mt-4 flex gap-2">
                  {cat.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-surface-container-highest rounded-lg text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {cat.toggle && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setSignupOpen(!signupOpen)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${signupOpen ? 'bg-secondary' : 'bg-surface-container-highest'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-surface-container-lowest rounded-full shadow-md transition-all ${signupOpen ? 'left-7' : 'left-1'}`} />
                  </button>
                  <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">{signupOpen ? cat.toggleLabel : 'Signup Closed'}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* App ki Settings */}
        <div className="bg-surface-container-low rounded-2xl p-2">
          <h4 className="px-4 py-3 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-[0.15em]">App ki Settings</h4>
          {LEGAL_ITEMS.map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <div className="h-px bg-outline-variant/10 mx-4" />}
              <div className="flex items-center justify-between p-4 hover:bg-surface-container-high rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Icon name={item.icon} className="text-on-surface-variant" />
                  <span className="text-on-surface font-medium">{item.label}</span>
                </div>
                <Icon name="open_in_new" size="sm" className="text-outline-variant" />
              </div>
            </React.Fragment>
          ))}
          <div className="h-px bg-outline-variant/10 mx-4" />
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Icon name="info" className="text-on-surface-variant" />
              <span className="text-on-surface font-medium">App Version</span>
            </div>
            <span className="text-xs font-bold text-outline">v1.0.0</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 px-6 rounded-2xl bg-surface-container-highest border-2 border-transparent hover:border-error/20 flex items-center justify-center gap-3 text-error font-bold transition-all active:scale-95"
        >
          <Icon name="logout" />
          Logout Platform
        </button>
      </main>
    </div>
  );
}
