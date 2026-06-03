"use client";

import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/whatsapp";

export const WhatsAppFloating: React.FC = () => (
  <a
    href={WHATSAPP_LINK}
    target="_blank"
    rel="noreferrer"
    className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600"
    aria-label="Chat on WhatsApp"
    title="Chat on WhatsApp"
  >
    <MessageCircle className="h-5 w-5" />
  </a>
);
