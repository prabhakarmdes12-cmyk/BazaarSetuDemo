import { useState } from 'react';

interface Props {
  onSubmit: (name: string, locality: string) => void;
}

export default function UserInfoStep({ onSubmit }: Props) {
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('');

  const handleSubmit = () => {
    if (name.trim() && locality.trim()) {
      onSubmit(name.trim(), locality.trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#8f4e00] to-[#ff9933]">
      <div className="animate-slide-up w-full max-w-xs">
        <h1 className="font-headline text-3xl font-extrabold text-white text-center mb-2">
          Chiti Bazaar
        </h1>
        <p className="text-white/80 font-body text-base text-center mb-2">
          Apni Dukaan, Apni Pehchaan
        </p>

        <h2 className="font-headline text-xl font-bold text-white text-center mb-2">
          Aap ki jaankari dein
        </h2>
        <p className="text-white/70 font-body text-sm text-center mb-8">
          Enter your details
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Naam / Name"
          className="w-full bg-white text-on-surface font-body text-base py-4 px-5 rounded-2xl
                     border-0 shadow-editorial-lg mb-4
                     placeholder:text-on-surface-variant/50
                     focus:ring-2 focus:ring-white focus:outline-none"
        />

        <input
          type="text"
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
          placeholder="Ilaaka / Locality (Area, City)"
          className="w-full bg-white text-on-surface font-body text-base py-4 px-5 rounded-2xl
                     border-0 shadow-editorial-lg mb-6
                     placeholder:text-on-surface-variant/50
                     focus:ring-2 focus:ring-white focus:outline-none"
        />

        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !locality.trim()}
          className="w-full bg-white text-primary font-semibold py-4 px-6 rounded-2xl shadow-editorial-lg
                     active:scale-95 transition-all duration-200
                     hover:shadow-saffron hover:scale-[1.02]
                     disabled:opacity-50 disabled:active:scale-100 disabled:hover:scale-100
                     font-body text-lg"
        >
          Aage Badhein / Next
        </button>
      </div>
    </div>
  );
}
