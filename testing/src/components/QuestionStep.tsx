import { Question } from '../config/questions';

interface Props {
  question: Question;
  step: number;
  total: number;
  onAnswer: (value: string) => void;
}

export default function QuestionStep({ question, step, total, onAnswer }: Props) {
  const progress = ((step + 1) / total) * 100;

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-br from-[#8f4e00] to-[#ff9933]">
      <div className="animate-fade-in">
        <div className="w-full bg-white/30 h-2 rounded-full mb-8 mt-4">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2 className="text-white font-headline text-lg font-bold mb-8 leading-relaxed text-center">
          {question.q}
        </h2>

        <div className="flex flex-col items-center gap-3">
          {question.options.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              className="bg-white text-on-surface font-semibold py-4 px-8 rounded-2xl shadow-editorial-lg
                         active:scale-95 transition-all duration-200
                         hover:shadow-saffron hover:scale-[1.02]
                         font-body text-base w-64"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <p className="text-white/80 text-center font-body text-sm mt-6">
        Sawaal {step + 1} / {total} &middot; Step {step + 1} / {total}
      </p>
    </div>
  );
}
