export function calculateScore(answers: Record<string, string>): { score: number; level: string; emoji: string } {
  let score = 0;
  Object.values(answers).forEach((a) => {
    if (a === 'Yes' || a === 'Dono' || a === 'Daily') score += 2;
    if (a === 'Maybe' || a === 'Weekly') score += 1;
  });

  if (score > 8) return { score, level: 'HIGH', emoji: '🚀' };
  if (score > 4) return { score, level: 'MEDIUM', emoji: '⚠️' };
  return { score, level: 'LOW', emoji: '❌' };
}
