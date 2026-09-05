'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  href?: string;
  onClick?: () => void;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout, deleteAccount, isLoading } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !token) window.location.assign('/login');
  }, [token, isLoading]);

  const handleLogout = () => { logout(); router.push('/login'); };

  const handleDeleteAccount = async () => {
    setDeleting(true); setError('');
    try {
      await deleteAccount();
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account delete karne mein dikkat aayi');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const menuItems: MenuItem[] = [
    { icon: 'shopping_bag', title: 'Mere Orders', subtitle: 'Check status of your deliveries', href: '/customer/orders' },
    { icon: 'card_giftcard', title: 'Dosto ko bulao', subtitle: 'Referral code share karein aur reward paayein', href: '/customer/referral' },
    { icon: 'location_on', title: 'Bachaya hua pata (Saved Addresses)', subtitle: 'Manage your delivery locations' },
    { icon: 'account_balance_wallet', title: 'Mera Khata (Digital Ledger/Balance)', subtitle: 'Apni dukaan ka khata dekhein' },
    { icon: 'help_outline', title: 'Madad aur Support (Help)', subtitle: '24/7 customer assistance' },
    { icon: 'info', title: 'Chiti Bazaar ke baare mein', subtitle: 'Version 2.4.0' },
    { icon: 'privacy_tip', title: 'Privacy Policy', subtitle: 'Aapka data kaise handle hota hai', href: '/privacy' },
  ];

  return (
    <div className="bg-background text-on-surface font-body antialiased min-h-screen pb-28">
      <nav className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md shadow-top-bar">
        <div className="flex items-center px-6 h-16 w-full max-w-screen-xl mx-auto">
          <button onClick={() => router.back()} aria-label="Go back" className="mr-4 text-primary active:scale-95 transition-transform duration-200">
            <Icon name="arrow_back" />
          </button>
          <h1 className="font-headline font-bold text-xl tracking-tight text-primary">Mera Profile</h1>
        </div>
      </nav>

      <main className="pt-24 px-6 max-w-screen-md mx-auto">
        <section className="relative mb-12">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-container-lowest shadow-card bg-primary-fixed flex items-center justify-center">
                <Icon name="person" size="xl" className="text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-primary-container text-white p-1.5 rounded-full border-2 border-surface shadow-sm">
                <Icon name="verified" size="sm" filled />
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight leading-tight">Namaste, {user?.name || 'User'}</h2>
              <p className="font-label text-on-surface-variant text-base flex items-center gap-1.5 mt-1">
                <Icon name="call" size="sm" />
                {user?.phone || 'XXXXXXXXXX'}
              </p>
              <div className="mt-3 inline-flex items-center px-3 py-1 bg-secondary-container/30 text-secondary font-semibold text-xs rounded-full">
                <Icon name="star" size="sm" filled className="mr-1" />
                Premium Member
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low rounded-[2rem] p-4 mb-8">
          <div className="space-y-3">
            {menuItems.map((item) => {
              const Tag = item.href ? 'a' : 'button';
              return (
              <Tag
                key={item.icon}
                href={item.href}
                onClick={!item.href ? item.onClick : undefined}
                className={`flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl hover:bg-primary-fixed/30 active:scale-[0.98] transition-all duration-200 group cursor-pointer w-full text-left ${item.href ? 'no-underline' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-white transition-colors">
                    <Icon name={item.icon} />
                  </div>
                  <div>
                    <span className="font-headline font-bold text-on-surface text-lg block">{item.title}</span>
                    <span className="font-body text-xs text-on-surface-variant">{item.subtitle}</span>
                  </div>
                </div>
                <Icon name="chevron_right" className="text-outline-variant" />
              </Tag>
            );
            })}
          </div>
        </section>

        <div className="text-center mb-12">
          <p className="font-headline font-bold text-primary italic text-sm tracking-wide">
            &apos;Apni local dukaan, ab online&apos;
          </p>
        </div>

        <div className="mb-12">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-error-container text-on-error-container font-headline font-bold text-lg rounded-2xl active:scale-95 transition-transform duration-200 shadow-sm"
          >
            <Icon name="logout" />
            Logout
          </button>
        </div>

        <div className="mb-12">
          {error && <p className="text-error text-sm mb-3">{error}</p>}
          {confirmDelete ? (
            <div className="rounded-2xl border-2 border-error/30 p-4 space-y-4">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Kya aap sach mein apna account aur saara data hamesha ke liye delete karna chahte hain?
                Ye <span className="font-semibold text-error">wapas nahi ho sakta</span>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount} disabled={deleting}
                  className="flex-1 py-3 bg-error text-on-error font-headline font-bold rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
                >
                  {deleting ? 'Delete ho raha hai...' : 'Haan, delete karein'}
                </button>
                <button
                  onClick={() => { setConfirmDelete(false); setError(''); }}
                  className="flex-1 py-3 bg-surface-container-lowest font-headline font-bold text-on-surface rounded-xl active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-surface-container-low text-error font-headline font-bold text-lg rounded-2xl active:scale-95 transition-transform duration-200 shadow-sm"
            >
              <Icon name="delete_forever" />
              Delete Account
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
