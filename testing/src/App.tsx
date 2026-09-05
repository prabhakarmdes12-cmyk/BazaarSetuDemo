import { useState } from 'react';
import { questions } from './config/questions';
import { calculateScore } from './utils/scoring';
import RoleSelect from './components/RoleSelect';
import UserInfoStep from './components/UserInfoStep';
import QuestionStep from './components/QuestionStep';
import ResultScreen from './components/ResultScreen';

type Screen = 'role' | 'userinfo' | 'questions' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('role');
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [locality, setLocality] = useState('');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestions = role ? questions[role] : [];

  const handleRoleSelect = (roleId: string) => {
    setRole(roleId);
    setStep(0);
    setAnswers({});
    setScreen('userinfo');
  };

  const handleUserInfoSubmit = (userName: string, userLocality: string) => {
    setName(userName);
    setLocality(userLocality);
    setScreen('questions');
  };

  const handleAnswer = (value: string) => {
    const qId = currentQuestions[step].id;
    const newAnswers = { ...answers, [qId]: value };
    setAnswers(newAnswers);

    if (step + 1 < currentQuestions.length) {
      setStep(step + 1);
    } else {
      setScreen('result');
    }
  };

  const handleRestart = () => {
    setRole(null);
    setName('');
    setLocality('');
    setStep(0);
    setAnswers({});
    setScreen('role');
  };

  if (screen === 'role') {
    return <RoleSelect onSelect={handleRoleSelect} />;
  }

  if (screen === 'userinfo') {
    return <UserInfoStep onSubmit={handleUserInfoSubmit} />;
  }

  if (screen === 'result' && role) {
    const { score, level, emoji } = calculateScore(answers);
    return (
      <ResultScreen
        role={role}
        name={name}
        locality={locality}
        answers={answers}
        score={score}
        level={level}
        emoji={emoji}
        onRestart={handleRestart}
      />
    );
  }

  if (screen === 'questions' && role) {
    return (
      <QuestionStep
        question={currentQuestions[step]}
        step={step}
        total={currentQuestions.length}
        onAnswer={handleAnswer}
      />
    );
  }

  return <RoleSelect onSelect={handleRoleSelect} />;
}
