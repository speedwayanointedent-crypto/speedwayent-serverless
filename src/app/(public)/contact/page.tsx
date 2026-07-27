"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Loader2,
  Send,
  Clock,
  CheckCircle,
  HeadphonesIcon,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Globe,
} from "lucide-react";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { apiGet, apiPost, getApiErrorMessage } from "@/lib/api";

type Settings = {
  business_name?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  address?: string | null;
  city?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  x_url?: string | null;
  tiktok_url?: string | null;
  linkedin_url?: string | null;
  whatsapp_url?: string | null;
  map_embed_url?: string | null;
  hero_subtitle?: string | null;
  response_promise?: string | null;
  business_hours?: { mon_fri?: string | null; saturday?: string | null; sunday?: string | null } | null;
};

const FALLBACK: Required<Settings> = {
  business_name: "Speedway Anointed Ent",
  support_email: "info@speedway.com",
  support_phone: "+233 55 090 5060",
  address: "Abossey-Okai, Main Street",
  city: "Accra, Ghana",
  facebook_url: "",
  instagram_url: "",
  x_url: "",
  tiktok_url: "",
  linkedin_url: "",
  whatsapp_url: "",
  map_embed_url: "",
  hero_subtitle: "Have questions about parts, fitment, or orders? Our team is ready to assist you.",
  response_promise: "We'll reply within 24 hours",
  business_hours: { mon_fri: "8:00 AM - 6:00 PM", saturday: "9:00 AM - 4:00 PM", sunday: "Closed" },
};

export default function ContactPage() {
  const [settings, setSettings] = useState<Settings>(FALLBACK);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    let mounted = true;
    apiGet<Settings>("/api/settings")
      .then((res) => {
        if (!mounted) return;
        if (res && typeof res === "object") setSettings({ ...FALLBACK, ...res });
      })
      .catch(() => {
        if (mounted) setSettings(FALLBACK);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const s = { ...FALLBACK, ...settings };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiPost("/api/contact", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject || null,
        message: formData.message,
      });
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      label: "Phone",
      value: s.support_phone,
      description: s.business_hours?.mon_fri || "",
      href: s.support_phone ? `tel:${s.support_phone.replace(/[^\d+]/g, "")}` : undefined,
    },
    {
      icon: Mail,
      label: "Email",
      value: s.support_email,
      description: s.response_promise || FALLBACK.response_promise,
      href: s.support_email ? `mailto:${s.support_email}` : undefined,
    },
    {
      icon: MapPin,
      label: "Visit Us",
      value: s.address,
      description: s.city,
      href: s.map_embed_url || undefined,
    },
  ];

  const socials = [
    { icon: Facebook, href: s.facebook_url, label: "Facebook" },
    { icon: Instagram, href: s.instagram_url, label: "Instagram" },
    { icon: Twitter, href: s.x_url, label: "X" },
    { icon: Linkedin, href: s.linkedin_url, label: "LinkedIn" },
    { icon: Globe, href: s.tiktok_url, label: "TikTok" },
  ].filter((x) => x.href);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:pt-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <MessageCircle className="w-4 h-4" />
            Get in Touch
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            We're Here to Help
          </h1>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            {s.hero_subtitle}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Link href="/shop" className="btn-primary">
            Browse Parts
          </Link>
          <WhatsAppButton
            label="Chat on WhatsApp"
            className="h-11"
            href={s.whatsapp_url || undefined}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] max-w-6xl mx-auto">
          <Card className="p-6 sm:p-8" padding="none">
            <div className="p-6 sm:p-8 border-b border-border">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Send us a Message</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                {s.response_promise || FALLBACK.response_promise}.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 sm:p-8 text-center py-12">
                <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Thank you for reaching out to {s.business_name}. {s.response_promise || FALLBACK.response_promise}.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+233 55 090 5060"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <Select
                    label="Subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    options={[
                      { value: "", label: "Select a subject" },
                      { value: "parts", label: "Part Inquiry" },
                      { value: "fitment", label: "Fitment Help" },
                      { value: "order", label: "Order Status" },
                      { value: "return", label: "Returns & Refunds" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </div>

                <Textarea
                  label="Message"
                  placeholder="Tell us about the part you need or how we can help..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  className="w-full h-12 text-base"
                  icon={<Send className="w-5 h-5" />}
                  iconPosition="right"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </Button>

                <p className="text-center text-xs text-slate-400">
                  By submitting, you agree to our privacy policy and terms of service.
                </p>
              </form>
            )}
          </Card>

          <div className="space-y-5">
            {contactInfo.map((item, index) => {
              const inner = (
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1 break-words">{item.value}</p>
                    {item.description && (
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              );
              return (
                <Card
                  key={item.label}
                  hover
                  className="p-5 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {item.href ? (
                    <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="block">
                      {inner}
                    </a>
                  ) : (
                    inner
                  )}
                </Card>
              );
            })}

            {s.map_embed_url && (
              <Card className="overflow-hidden">
                <iframe
                  src={s.map_embed_url}
                  title="Business location"
                  className="w-full h-56 border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Card>
            )}

            <Card className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white border-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <HeadphonesIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">Need Immediate Help?</p>
                  <p className="text-sm text-white/70">Average response: Under 10 mins</p>
                </div>
              </div>
              <p className="text-sm text-white/80 mb-4">
                For quickest assistance with parts lookup, fitment verification, or order status, chat with us on WhatsApp.
              </p>
              <WhatsAppButton
                label="Chat on WhatsApp"
                className="w-full h-11 bg-white text-primary hover:bg-white/90"
                href={s.whatsapp_url || undefined}
              />
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Business Hours</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Monday - Friday</span>
                  <span className="font-medium text-right">{s.business_hours?.mon_fri || "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Saturday</span>
                  <span className="font-medium text-right">{s.business_hours?.saturday || "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Sunday</span>
                  <span className="font-medium text-slate-400 text-right">{s.business_hours?.sunday || "—"}</span>
                </div>
              </div>
            </Card>

            {socials.length > 0 && (
              <Card className="p-5">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Follow us</p>
                <div className="flex flex-wrap gap-2">
                  {socials.map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href as string}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                      aria-label={label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
