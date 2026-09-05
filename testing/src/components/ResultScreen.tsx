import { downloadPDF } from '../utils/pdf';
import { shareViaWhatsApp } from '../utils/whatsapp';
import { saveSubmission } from '../services/submission';
import { questionLabels } from '../config/questions';

interface Props {
  role: string;
  name: string;
  locality: string;
  answers: Record<string, string>;
  score: number;
  level: string;
  emoji: string;
  onRestart: () => void;
}

export default function ResultScreen({ role, name, locality, answers, score, level, emoji, onRestart }: Props) {
  const handleWhatsApp = async () => {
    saveSubmission({
      role,
      name,
      locality,
      answers,
      score,
      level,
      timestamp: new Date().toISOString(),
    });
    await shareViaWhatsApp(role, level, score, answers, name, locality);
  };

  const handlePDF = () => {
    saveSubmission({
      role,
      name,
      locality,
      answers,
      score,
      level,
      timestamp: new Date().toISOString(),
    });
    downloadPDF(role, name, locality, answers, level, score);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#8f4e00] to-[#ff9933]">
      <div className="animate-slide-up w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-6xl mb-4">{emoji}</p>
          <h1 className="font-headline text-3xl font-extrabold text-white mb-2">
            Validation Complete! / Jaanch Poorn!
          </h1>
          <p className="text-white/80 font-body text-lg">
            {name} &middot; {locality}
          </p>
          <p className="text-white/60 font-body text-sm mt-1">
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-editorial-lg mb-6">
          <div className="text-center mb-4">
            <p className="font-headline text-4xl font-extrabold text-primary">
              {level}
            </p>
            <p className="text-on-surface-variant font-body text-sm">
              Score / Ank: {score} points
            </p>
          </div>

          <div className="border-t border-outline-variant pt-4">
            <p className="font-headline font-bold text-on-surface text-sm mb-3">Answers / Jawaab:</p>
            {Object.entries(answers).map(([key, value]) => {
              const label = questionLabels[key] || key;
              return (
                <div key={key} className="py-2 border-b border-outline-variant/50 last:border-0">
                  <p className="text-on-surface-variant font-body text-xs leading-relaxed">{label}</p>
                  <p className="text-on-surface font-semibold font-body text-sm mt-0.5">{value}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleWhatsApp}
            className="bg-[#25D366] text-white font-semibold py-4 px-8 rounded-2xl shadow-editorial-lg
                       active:scale-95 transition-all duration-200
                       hover:opacity-90
                       font-body text-base flex items-center justify-center gap-2 w-64"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp par bhejein / Share
          </button>

          <button
            onClick={handlePDF}
            className="bg-white text-on-surface font-semibold py-4 px-8 rounded-2xl shadow-editorial-lg
                       active:scale-95 transition-all duration-200
                       hover:bg-surface-container
                       font-body text-base w-64"
          >
            PDF Download karein
          </button>

          <button
            onClick={onRestart}
            className="bg-white/20 text-white font-semibold py-3 px-8 rounded-2xl
                       active:scale-95 transition-all duration-200
                       hover:bg-white/30
                       font-body text-sm w-64"
          >
            Phir se shuru karein / Start Again
          </button>
        </div>
      </div>
    </div>
  );
}
