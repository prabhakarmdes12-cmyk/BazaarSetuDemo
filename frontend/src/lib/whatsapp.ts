// WhatsApp share-link helpers (wa.me deep links — no provider SDK required).

export function buildWhatsAppLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
}

export function buildOrderShareLink(shopName: string, orderId: string, amount: number, statusUrl: string): string {
  const shortId = orderId.slice(-6).toUpperCase();
  const text =
    `Namaste! Maine ${shopName} se BazaarSetu par ${amount} rupaye ka order diya hai (Order #${shortId}).\n\n` +
    `Status yahan dekhein: ${statusUrl}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

export function buildInviteLink(phone: string, code: string, appUrl: string): string {
  return buildWhatsAppLink(
    phone,
    `Namaste! Main BazaarSetu par hoon — apni local dukaan se online samaan mangwaata hoon. Aap bhi judiye aur udhaar khata online rakhein. Mera referral code: ${code}. Join karein: ${appUrl}?ref=${code}`,
  );
}

export function buildUpiCollectLink(upiId: string, name: string, amount: number, note: string): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: String(amount),
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}
