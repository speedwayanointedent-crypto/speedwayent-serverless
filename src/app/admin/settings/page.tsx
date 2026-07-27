"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Globe,
  Clock,
  MapPinned,
  Sparkles,
} from "lucide-react";
import { apiGet, apiPut, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

type BusinessHours = {
  mon_fri: string;
  saturday: string;
  sunday: string;
};

type SettingsForm = {
  business_name: string;
  support_email: string;
  support_phone: string;
  address: string;
  city: string;
  facebook_url: string;
  instagram_url: string;
  x_url: string;
  tiktok_url: string;
  linkedin_url: string;
  whatsapp_url: string;
  map_embed_url: string;
  hero_subtitle: string;
  response_promise: string;
  business_hours: BusinessHours;
};

const EMPTY_FORM: SettingsForm = {
  business_name: "",
  support_email: "",
  support_phone: "",
  address: "",
  city: "",
  facebook_url: "",
  instagram_url: "",
  x_url: "",
  tiktok_url: "",
  linkedin_url: "",
  whatsapp_url: "",
  map_embed_url: "",
  hero_subtitle: "",
  response_promise: "",
  business_hours: { mon_fri: "", saturday: "", sunday: "" },
};

function Field({
  icon: Icon,
  placeholder,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      <input
        type={type}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

function TextArea({
  icon: Icon,
  placeholder,
  value,
  onChange,
  disabled,
  rows = 2,
}: {
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <div className="flex gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4 mt-1.5 shrink-0" />
      <textarea
        placeholder={placeholder}
        className="w-full bg-transparent outline-none resize-y min-h-[60px]"
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [form, setForm] = React.useState<SettingsForm>(EMPTY_FORM);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const { push } = useToast();

  React.useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const res = await apiGet<any>("/settings");
        if (!isMounted) return;
        setForm({
          business_name: res?.business_name || "",
          support_email: res?.support_email || "",
          support_phone: res?.support_phone || "",
          address: res?.address || "",
          city: res?.city || "",
          facebook_url: res?.facebook_url || "",
          instagram_url: res?.instagram_url || "",
          x_url: res?.x_url || "",
          tiktok_url: res?.tiktok_url || "",
          linkedin_url: res?.linkedin_url || "",
          whatsapp_url: res?.whatsapp_url || "",
          map_embed_url: res?.map_embed_url || "",
          hero_subtitle: res?.hero_subtitle || "",
          response_promise: res?.response_promise || "",
          business_hours: {
            mon_fri: res?.business_hours?.mon_fri || "",
            saturday: res?.business_hours?.saturday || "",
            sunday: res?.business_hours?.sunday || "",
          },
        });
      } catch (err) {
        if (isMounted) push(getApiErrorMessage(err), "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [push]);

  const updateField = (field: keyof SettingsForm) => (v: string) => {
    setForm((prev) => ({ ...prev, [field]: v }));
  };

  const updateHours = (field: keyof BusinessHours) => (v: string) => {
    setForm((prev) => ({
      ...prev,
      business_hours: { ...prev.business_hours, [field]: v },
    }));
  };

  const saveSettings = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await apiPut<any>("/settings", form);
      setForm((prev) => ({
        ...prev,
        business_name: res?.business_name ?? prev.business_name,
        support_email: res?.support_email ?? prev.support_email,
        support_phone: res?.support_phone ?? prev.support_phone,
        address: res?.address ?? prev.address,
        city: res?.city ?? prev.city,
        facebook_url: res?.facebook_url ?? prev.facebook_url,
        instagram_url: res?.instagram_url ?? prev.instagram_url,
        x_url: res?.x_url ?? prev.x_url,
        tiktok_url: res?.tiktok_url ?? prev.tiktok_url,
        linkedin_url: res?.linkedin_url ?? prev.linkedin_url,
        whatsapp_url: res?.whatsapp_url ?? prev.whatsapp_url,
        map_embed_url: res?.map_embed_url ?? prev.map_embed_url,
        hero_subtitle: res?.hero_subtitle ?? prev.hero_subtitle,
        response_promise: res?.response_promise ?? prev.response_promise,
        business_hours: {
          mon_fri: res?.business_hours?.mon_fri ?? prev.business_hours.mon_fri,
          saturday: res?.business_hours?.saturday ?? prev.business_hours.saturday,
          sunday: res?.business_hours?.sunday ?? prev.business_hours.sunday,
        },
      }));
      push("Settings saved", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Settings"
        subtitle="Configure business details, social links, business hours, and contact page content."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)]">
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-foreground">Business profile</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Shown on the public contact page, navbar, and invoice emails.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                icon={Building2}
                placeholder="Business name"
                value={form.business_name}
                onChange={updateField("business_name")}
                disabled={loading || saving}
              />
              <Field
                icon={Mail}
                placeholder="Support email (e.g. info@speedway.com)"
                value={form.support_email}
                onChange={updateField("support_email")}
                disabled={loading || saving}
                type="email"
              />
              <Field
                icon={Phone}
                placeholder="Support phone (e.g. +233 55 090 5060)"
                value={form.support_phone}
                onChange={updateField("support_phone")}
                disabled={loading || saving}
                type="tel"
              />
              <Field
                icon={MapPin}
                placeholder="Street address (e.g. Abossey-Okai, Main Street)"
                value={form.address}
                onChange={updateField("address")}
                disabled={loading || saving}
              />
              <Field
                icon={MapPinned}
                placeholder="City / Region (e.g. Accra, Ghana)"
                value={form.city}
                onChange={updateField("city")}
                disabled={loading || saving}
              />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-foreground">Business hours</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Displayed in the contact page sidebar.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field
                icon={Clock}
                placeholder="Mon - Fri (e.g. 8:00 AM - 6:00 PM)"
                value={form.business_hours.mon_fri}
                onChange={updateHours("mon_fri")}
                disabled={loading || saving}
              />
              <Field
                icon={Clock}
                placeholder="Saturday (e.g. 9:00 AM - 4:00 PM)"
                value={form.business_hours.saturday}
                onChange={updateHours("saturday")}
                disabled={loading || saving}
              />
              <Field
                icon={Clock}
                placeholder="Sunday (e.g. Closed)"
                value={form.business_hours.sunday}
                onChange={updateHours("sunday")}
                disabled={loading || saving}
              />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-foreground">Contact page messaging</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Optional custom copy shown on the public contact page hero & sidebar.
            </p>
            <div className="mt-4 grid gap-3">
              <TextArea
                icon={Sparkles}
                placeholder="Hero subtitle (e.g. Have questions about parts, fitment, or orders?)"
                value={form.hero_subtitle}
                onChange={updateField("hero_subtitle")}
                disabled={loading || saving}
                rows={2}
              />
              <TextArea
                icon={Sparkles}
                placeholder="Response promise (e.g. We typically reply within 24 hours)"
                value={form.response_promise}
                onChange={updateField("response_promise")}
                disabled={loading || saving}
                rows={2}
              />
              <Field
                icon={MapPinned}
                placeholder="Google Maps embed URL (Share → Embed a map → copy the src= URL)"
                value={form.map_embed_url}
                onChange={updateField("map_embed_url")}
                disabled={loading || saving}
                type="url"
              />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-foreground">Social media</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field
                icon={Facebook}
                placeholder="Facebook URL"
                value={form.facebook_url}
                onChange={updateField("facebook_url")}
                disabled={loading || saving}
                type="url"
              />
              <Field
                icon={Instagram}
                placeholder="Instagram URL"
                value={form.instagram_url}
                onChange={updateField("instagram_url")}
                disabled={loading || saving}
                type="url"
              />
              <Field
                icon={Twitter}
                placeholder="X (Twitter) URL"
                value={form.x_url}
                onChange={updateField("x_url")}
                disabled={loading || saving}
                type="url"
              />
              <Field
                icon={Linkedin}
                placeholder="LinkedIn URL"
                value={form.linkedin_url}
                onChange={updateField("linkedin_url")}
                disabled={loading || saving}
                type="url"
              />
              <Field
                icon={Globe}
                placeholder="TikTok URL"
                value={form.tiktok_url}
                onChange={updateField("tiktok_url")}
                disabled={loading || saving}
                type="url"
              />
              <Field
                icon={Globe}
                placeholder="WhatsApp link (e.g. https://wa.me/233550905060)"
                value={form.whatsapp_url}
                onChange={updateField("whatsapp_url")}
                disabled={loading || saving}
                type="url"
              />
            </div>
            <StickyActionBar className="mt-6">
              <button
                className="btn-primary h-10 text-sm"
                type="button"
                onClick={saveSettings}
                disabled={saving}
                aria-busy={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </StickyActionBar>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Low stock alerts",
                "New order notifications",
                "Weekly performance summary",
              ].map((item) => (
                <label
                  key={item}
                  className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2"
                >
                  <span>{item}</span>
                  <input type="checkbox" className="h-4 w-4" defaultChecked />
                </label>
              ))}
            </div>
          </div>
          <div className="card p-5 text-sm text-muted-foreground">
            Integrations and API keys can be configured in your environment variables.
            <div className="mt-3 space-y-1 text-xs">
              <div>MONGODB_URI · MONGODB_DB</div>
              <div>JWT_SECRET</div>
              <div>CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET</div>
              <div>GMAIL_USER · GOOGLE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN</div>
              <div>OWNER_EMAIL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
