import jsPDF from 'jspdf';
import { questionLabels } from '../config/questions';

const brandBrown: [number, number, number] = [143, 78, 0];
const brandOrange: [number, number, number] = [255, 153, 51];
const darkText: [number, number, number] = [26, 28, 28];
const mutedText: [number, number, number] = [100, 100, 100];

function buildPDF(
  role: string,
  name: string,
  locality: string,
  answers: Record<string, string>,
  level: string,
  score: number,
): jsPDF {
  const doc = new jsPDF();
  const now = new Date().toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  doc.setFillColor(...brandBrown);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFillColor(...brandOrange);
  doc.rect(0, 40, 210, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('Chiti Bazaar', 105, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Apni Dukaan, Apni Pehchaan', 105, 28, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(255, 200, 150);
  doc.text('Validation Report', 105, 36, { align: 'center' });

  let y = 54;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...mutedText);
  doc.text(`Generated: ${now}`, 20, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkText);
  doc.text('Participant Details / Bhagidari ki Jaankari', 20, y);
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandBrown);
  doc.text('Name / Naam:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  doc.text(name, 75, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandBrown);
  doc.text('Locality / Ilaaka:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  doc.text(locality, 75, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...brandBrown);
  doc.text('Role / Bhumika:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkText);
  doc.text(role.charAt(0).toUpperCase() + role.slice(1), 75, y);
  y += 14;

  doc.setDrawColor(...brandOrange);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...darkText);
  doc.text('Validation Results / Parinaam', 20, y);
  y += 12;

  Object.entries(answers).forEach(([key, value]) => {
    const label = questionLabels[key] || key;
    const lines = doc.splitTextToSize(label, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...brandBrown);
    doc.text(lines, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    doc.text(value, 130, y);
    y += Math.max(lines.length * 5, 8);
  });

  y += 6;
  doc.setDrawColor(...brandOrange);
  doc.line(20, y, 190, y);
  y += 12;

  doc.setFillColor(255, 243, 199);
  doc.roundedRect(20, y - 4, 170, 18, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...brandBrown);
  doc.text(`Score / Ank: ${level} (${score} points)`, 105, y + 8, { align: 'center' });

  doc.setFillColor(...brandBrown);
  doc.rect(0, 272, 210, 26, 'F');

  doc.setFillColor(...brandOrange);
  doc.rect(0, 269, 210, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('Chiti Bazaar', 105, 280, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 200, 150);
  doc.text('Connecting local shops with the digital world', 105, 287, { align: 'center' });
  doc.text('Vocal for Local \u2022 Made in Bharat', 105, 292, { align: 'center' });

  return doc;
}

export function downloadPDF(
  role: string,
  name: string,
  locality: string,
  answers: Record<string, string>,
  level: string,
  score: number,
): void {
  const doc = buildPDF(role, name, locality, answers, level, score);
  doc.save('chitibazaar-validation-report.pdf');
}

export function generatePDFBlob(
  role: string,
  name: string,
  locality: string,
  answers: Record<string, string>,
  level: string,
  score: number,
): Blob {
  const doc = buildPDF(role, name, locality, answers, level, score);
  return doc.output('blob');
}
