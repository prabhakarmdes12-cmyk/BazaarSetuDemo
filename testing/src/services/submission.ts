export interface SubmissionData {
  role: string;
  name: string;
  locality: string;
  answers: Record<string, string>;
  score: number;
  level: string;
  timestamp: string;
}

export async function saveSubmission(data: SubmissionData): Promise<void> {
  console.log('[BazaarSetu] Submission saved (stub):', data);

  // TODO: Future integration options:
  // 1. POST to BazaarSetu backend API
  // 2. Write to Google Sheets via Apps Script or API
  // 3. Store in localStorage for offline collection

  // Example future implementation:
  // const response = await fetch('/api/validation', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
  // return response.json();
}
