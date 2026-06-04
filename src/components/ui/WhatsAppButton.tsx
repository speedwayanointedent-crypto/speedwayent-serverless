"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type WhatsAppButtonProps = {
  label?: string;
  className?: string;
  message?: string;
  href?: string;
};

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  label = "Chat on WhatsApp",
  className = "",
  message,
  href,
}) => (
  <a
    href={href || buildWhatsAppLink(message)}
    target="_blank"
    rel="noreferrer"
    className={`btn-whatsapp ${className}`}
  >
    <MessageCircle className="mr-2 h-4 w-4" />
    {label}
  </a>
);
