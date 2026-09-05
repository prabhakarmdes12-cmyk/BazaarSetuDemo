// WhatsApp delivery layer. Real WABA provider (Twilio/MSG91) is not wired yet —
// every send returns a wa.me deep link that opens WhatsApp with a pre-filled
// message, which works end-to-end on any phone today.

export function buildWhatsAppLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
}

export function sendWhatsAppText(phone: string, text: string): { link: string; sentViaProvider: boolean } {
  return { link: buildWhatsAppLink(phone, text), sentViaProvider: false };
}

export function buildReminderMessage(shopName: string, customerName: string, balance: number): string {
  return `Namaste ${customerName}, ${shopName} se aapka baki ${balance} rupaye hai. Kripya jaldi pay kar dein. Dhanyavaad!`;
}

export function buildOrderMessage(shopName: string, amount: number, statusLink: string): string {
  return `Aapka ${shopName} se ${amount} rupaye ka order aa gaya hai. Status dekhein: ${statusLink}`;
}
