import Link from 'next/link';

const sections = [
  {
    title: '1. Aapke liye ekdum saaf baat',
    body: 'BazaarSetu aapke phone number, naam, address, orders, khata (udhaar) aur payment jaani jaankari ko sirf dukaan aur app ke kaam ke liye istemal karta hai.',
  },
  {
    title: '2. Kaunsi jaankari collect hoti hai',
    body: 'Registration ke samay: mobile number, naam, role (customer/dukaan). Orders: khareedi ke details. Udhaar: ledger entries. Payout: bank account details (encrypted). Referral: code aur referred phone.',
  },
  {
    title: '3. Consent (sahamati)',
    body: 'Registration se pehle aapko Privacy Policy aur Terms accept karni hoti hai. Bina consent ke account nahi banta.',
  },
  {
    title: '4. Data ka istemal',
    body: 'Data sirf services dene ke liye use hota hai — orders, udhaar, payment link, notifications, support. Marketing ke liye bina permission ke data share nahi kiya jata.',
  },
  {
    title: '5. Security',
    body: 'Bank account details AES-256-GCM encryption se store hoti hain. OTP se login secure hai. Koi bhi sensitive data plain text mein nahi rakha jata.',
  },
  {
    title: '6. Data deletion (Right to Erasure)',
    body: 'Aap apna account aur saara data Profile → Delete Account se permanently delete kar sakte hain. Deletion ke baad aapka phone number dobara register ho sakta hai.',
  },
  {
    title: '7. Aapke rights (DPDP ke under)',
    body: 'Aapko access, correction aur deletion ke rights hain. Koi bhi sawaal ho toh support se contact karein.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col items-center">
      <header className="w-full max-w-2xl px-8 pt-10 pb-6">
        <Link href="/" className="text-primary font-headline font-bold text-2xl italic tracking-tight">
          BazaarSetu
        </Link>
        <h1 className="font-headline font-extrabold text-3xl tracking-tight mt-4">Privacy Policy</h1>
        <p className="text-on-surface-variant mt-1">Effective date: August 2026</p>
      </header>
      <main className="w-full max-w-2xl px-8 pb-16 space-y-8">
        <div className="rounded-2xl bg-surface-container-lowest p-5 text-sm leading-relaxed text-on-surface-variant">
          Ye policy DPDP (Digital Personal Data Protection) ke principles par based hai —
          transparent, purpose-limited aur user-controlled data processing.
        </div>
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-headline font-bold text-lg text-on-surface">{s.title}</h2>
            <p className="text-on-surface-variant leading-relaxed mt-1">{s.body}</p>
          </section>
        ))}
        <Link href="/terms" className="block text-primary font-semibold underline">
          Terms &amp; Conditions dekhein
        </Link>
      </main>
    </div>
  );
}
