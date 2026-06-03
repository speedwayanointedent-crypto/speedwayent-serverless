export const WHATSAPP_NUMBER = "233242762437";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export function buildWhatsAppLink(message?: string) {
  if (!message) return WHATSAPP_LINK;
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;
}
