"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Globe,
  ArrowUpRight,
  MapPin,
  Sparkles,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { WHATSAPP_LINK } from "@/lib/whatsapp";

type FooterSettings = {
  business_name?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  address?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  x_url?: string | null;
  tiktok_url?: string | null;
  linkedin_url?: string | null;
  whatsapp_url?: string | null;
};

const footerLinks = {
  shop: [
    { href: "/shop", label: "All Products" },
    { href: "/shop", label: "Engine Parts" },
    { href: "/shop", label: "Brake Systems" },
    { href: "/shop", label: "Suspension" },
    { href: "/shop", label: "Electrical" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/reviews", label: "Reviews" },
    { href: "/shop", label: "Catalog" },
  ],
  support: [
    { href: "/contact", label: "Help Center" },
    { href: "/orders", label: "Track Order" },
    { href: "/contact", label: "Returns" },
    { href: "/contact", label: "Fitment Guide" },
  ],
};

export const PublicFooterCTA: React.FC = () => {
  const [settings, setSettings] = useState<FooterSettings>({});

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res: any = await apiGet("/api/settings");
        if (isMounted) setSettings(res || {});
      } catch {
        if (isMounted) setSettings({});
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const supportPhone = settings.support_phone || "";
  const supportEmail = settings.support_email || "";
  const whatsappUrl = settings.whatsapp_url || WHATSAPP_LINK;
  const businessName = settings.business_name || "Speedway Anointed Ent";
  const address = settings.address || "Accra, Ghana";

  const socialLinks = [
    settings.facebook_url && { url: settings.facebook_url, icon: Facebook, label: "Facebook" },
    settings.instagram_url && { url: settings.instagram_url, icon: Instagram, label: "Instagram" },
    settings.x_url && { url: settings.x_url, icon: Twitter, label: "X" },
    settings.linkedin_url && { url: settings.linkedin_url, icon: Linkedin, label: "LinkedIn" },
    settings.tiktok_url && { url: settings.tiktok_url, icon: Globe, label: "TikTok" },
  ].filter(Boolean) as { url: string; icon: React.ElementType; label: string }[];

  return (
    <footer className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-2 sm:mb-3">
                Need help sourcing parts?
              </p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-snug font-display">
                Talk to a parts specialist today
              </h3>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-slate-400">
                Call, WhatsApp, or email us for fitment checks and bulk orders.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 flex-shrink-0">
              {supportPhone ? (
                <a
                  href={`tel:${supportPhone}`}
                  className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Call us
                </a>
              ) : null}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
              >
                WhatsApp
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              {supportEmail ? (
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-6 sm:pb-8">
        <div className="grid gap-8 sm:gap-10 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-sm shadow-primary/25">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="leading-none">
                <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{businessName}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Premium Auto Parts</div>
              </div>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-4">
              Your trusted source for genuine auto parts in Ghana. Quality guaranteed, fast delivery, expert support.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{address}</span>
            </div>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                {socialLinks.map(({ url, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">Support</h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            {supportPhone && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <a href={`tel:${supportPhone}`} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  <Phone className="w-3 h-3" />
                  {supportPhone}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; 2026 {businessName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 dark:text-slate-500">Built with precision in Ghana</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
