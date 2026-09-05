import Link from 'next/link';

const sections = [
  {
    title: '1. Service',
    body: 'BazaarSetu ek local marketplace hai jo customers aur dukaano ko jodta hai — orders, udhaar (khata), payments aur chat ke liye.',
  },
  {
    title: '2. Accounts aur OTP',
    body: 'Login mobile OTP se hota hai. Aap apne number ka dhyan rakhne ke zimmedaar hain. Account ke istemal ki saari zimmewaari aapki hai.',
  },
  {
    title: '3. Dukaan (Vendor) terms',
    body: 'Vendor shop ki saari jaankari, prices, availability aur delivery khud manage karta hai. Payment settlement Razorpay aur linked bank account ke through hota hai.',
  },
  {
    title: '4. Udhaar (Khata)',
    body: 'Udhaar ek doosre par bharosa ka business hai. Vendor credit limit set kar sakta hai. Pay link ke through payment online bhi ho sakti hai.',
  },
  {
    title: '5. Fees',
    body: 'Abhi BazaarSetu customers aur vendors se koi platform fee nahi leta. Aage koi fee aaye toh pehle inform kiya jayega.',
  },
  {
    title: '6. Account deletion',
    body: 'Aap kabhi bhi Profile → Delete Account se apna account hata sakte hain. Isse saara personal data permanently delete ho jata hai.',
  },
  {
    title: '7. Disclaimer',
    body: 'BazaarSetu ek technology platform hai. Products ki quality, delivery aur service ki zimmedari vendor ki hai.',
  },
];

export default function TermsPage() {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col items-center">
      <header className="w-full max-w-2xl px-8 pt-10 pb-6">
        <Link href="/" className="text-primary font-headline font-bold text-2xl italic tracking-tight">
          BazaarSetu
        </Link>
        <h1 className="font-headline font-extrabold text-3xl tracking-tight mt-4">Terms &amp; Conditions</h1>
        <p className="text-on-surface-variant mt-1">Effective date: August 2026</p>
      </header>
      <main className="w-full max-w-2xl px-8 pb-16 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-headline font-bold text-lg text-on-surface">{s.title}</h2>
            <p className="text-on-surface-variant leading-relaxed mt-1">{s.body}</p>
          </section>
        ))}
        <Link href="/privacy" className="block text-primary font-semibold underline">
          Privacy Policy dekhein
        </Link>
      </main>
    </div>
  );
}
