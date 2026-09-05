import { Role, roles } from '../config/questions';

interface Props {
  onSelect: (roleId: string) => void;
}

export default function RoleSelect({ onSelect }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#8f4e00] to-[#ff9933]">
      <div className="animate-slide-up text-center">
        <h1 className="font-headline text-4xl font-extrabold text-white mb-2">
          Chiti Bazaar
        </h1>
        <p className="text-white/80 font-body text-base mb-2">
          Validation Form / Jaanch Prashnaavali
        </p>
        <p className="text-white/60 font-body text-sm mb-10">
          Apni Dukaan, Apni Pehchaan
        </p>
        <h2 className="font-headline text-2xl font-bold text-white mb-2">
          Aap ka role chunein
        </h2>
        <p className="text-white/70 font-body text-sm mb-8">
          Select your role
        </p>

        <div className="flex flex-col items-center gap-4">
          {roles.map((r: Role) => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="bg-white text-on-surface font-semibold py-4 px-8 rounded-2xl shadow-editorial-lg
                         active:scale-95 transition-all duration-200
                         hover:shadow-saffron hover:scale-[1.02]
                         font-body text-lg w-64"
            >
              <span className="text-primary">{r.label}</span>
              <span className="text-on-surface-variant text-sm ml-2">({r.labelEn})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
