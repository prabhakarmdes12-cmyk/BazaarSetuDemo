// Helper to generate a pre-formatted WhatsApp order manifest and deep link

export interface WhatsAppOrderItem {
  name: string;
  quantity: number;
  price: number;
  unit?: string;
}

export function generateWhatsAppOrderUrl(
  shopPhone: string,
  shopName: string,
  items: WhatsAppOrderItem[],
  address?: string,
  customerName?: string
): string {
  const cleanPhone = shopPhone.replace(/\D/g, '') || '9876543210';
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let message = `Namaste ${shopName}!\n\nMain Paaska se yeh order mangwana chahta hoon:\n`;
  items.forEach((item, index) => {
    message += `${index + 1}. ${item.name} x ${item.quantity} (${item.unit || 'pack'}) - ₹${item.price * item.quantity}\n`;
  });
  message += `\nTotal Amount: ₹${total}\n`;
  if (address) {
    message += `Delivery Pata: ${address}\n`;
  }
  if (customerName) {
    message += `Customer: ${customerName}\n`;
  }
  message += `\n⚡ Kripya order confirm karke bhej dijiye.`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/91${cleanPhone}?text=${encoded}`;
}
