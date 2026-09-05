import { WHATSAPP_NUMBER, questionLabels } from '../config/questions';
import { generatePDFBlob } from './pdf';

function buildSummaryMessage(
  role: string,
  level: string,
  score: number,
  answers: Record<string, string>,
  name: string,
  locality: string,
): string {
  const answersText = Object.entries(answers)
    .map(([k, v]) => {
      const label = questionLabels[k] || k;
      return `  ${label}: ${v}`;
    })
    .join('\n');

  return [
    '*BazaarSetu Validation Report*',
    '',
    `Name / Naam: ${name}`,
    `Locality / Ilaaka: ${locality}`,
    `Role / Bhumika: ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    `Score / Ank: ${level} (${score} points)`,
    '',
    'Answers / Jawaab:',
    answersText,
    '',
    'BazaarSetu - Apni Dukaan, Apni Pehchaan',
  ].join('\n');
}

export async function shareViaWhatsApp(
  role: string,
  level: string,
  score: number,
  answers: Record<string, string>,
  name: string,
  locality: string,
): Promise<void> {
  const pdfBlob = generatePDFBlob(role, name, locality, answers, level, score);
  const fileName = 'bazaarsetu-validation-report.pdf';
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  const message = buildSummaryMessage(role, level, score, answers, name, locality);

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: 'BazaarSetu Validation Report',
        text: message,
        files: [file],
      });
      return;
    } catch {
      // User cancelled or share failed — fall through to fallback
    }
  }

  // Fallback: download PDF + open WhatsApp Web
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = pdfUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(pdfUrl);

  const fallbackMessage = [
    message,
    '',
    '---',
    '*PDF report automatically downloaded. Please attach it to this chat.*',
  ].join('\n');

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fallbackMessage)}`;
  window.open(url, '_blank');
}
