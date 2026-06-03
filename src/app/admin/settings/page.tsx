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
} from "lucide-react";
import { apiGet, apiPut, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

type SettingsForm = {
  business_name: string;
  support_email: string;
  support_phone: string;
  address: string;
  facebook_url: string;
  instagram_url: string;
  x_url: string;
  tiktok_url: string;
  linkedin_url: string;
  whatsapp_url: string;
};

export default function AdminSettingsPage() {
  const [form, setForm] = React.useState<SettingsForm>({
    business_name: "",
    support_email: "",
    support_phone: "",
    address: "",
    facebook_url: "",
    instagram_url: "",
    x_url: "",
    tiktok_url: "",
    linkedin_url: "",
    whatsapp_url: "",
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const { push } = useToast();

  React.useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const res = await apiGet<any>("/settings");
        if (!isMounted) return;
        setForm((prev) => ({
          ...prev,
          business_name: res?.business_name || "",
          support_email: res?.support_email || "",
          support_phone: res?.support_phone || "",
          address: res?.address || "",
          facebook_url: res?.facebook_url || "",
          instagram_url: res?.instagram_url || "",
          x_url: res?.x_url || "",
          tiktok_url: res?.tiktok_url || "",
          linkedin_url: res?.linkedin_url || "",
          whatsapp_url: res?.whatsapp_url || "",
        }));
      } catch (err) {
        if (isMounted) {
          push(getApiErrorMessage(err), "error");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [push]);

  const updateField = (field: keyof SettingsForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const saveSettings = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await apiPut<any>("/settings", form);
      setForm((prev) => ({
        ...prev,
        ...res,
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
        subtitle="Configure business details and notifications."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)]">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-foreground">Business profile</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <input
                placeholder="Business name"
                className="w-full bg-transparent outline-none"
                value={form.business_name}
                onChange={updateField("business_name")}
                disabled={loading || saving}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <input
                placeholder="Support email"
                className="w-full bg-transparent outline-none"
                value={form.support_email}
                onChange={updateField("support_email")}
                disabled={loading || saving}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <input
                placeholder="Support phone"
                className="w-full bg-transparent outline-none"
                value={form.support_phone}
                onChange={updateField("support_phone")}
                disabled={loading || saving}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <input
                placeholder="Business address"
                className="w-full bg-transparent outline-none"
                value={form.address}
                onChange={updateField("address")}
                disabled={loading || saving}
              />
            </div>
          </div>
          <h3 className="mt-6 text-sm font-semibold text-foreground">Social media</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Facebook className="h-4 w-4" />
              <input
                placeholder="Facebook URL"
                className="w-full bg-transparent outline-none"
                value={form.facebook_url}
                onChange={updateField("facebook_url")}
                disabled={loading || saving}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Instagram className="h-4 w-4" />
              <input
                placeholder="Instagram URL"
                className="w-full bg-transparent outline-none"
                value={form.instagram_url}
                onChange={updateField("instagram_url")}
                disabled={loading || saving}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Twitter className="h-4 w-4" />
              <input
                placeholder="X (Twitter) URL"
                className="w-full bg-transparent outline-none"
                value={form.x_url}
                onChange={updateField("x_url")}
                disabled={loading || saving}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Linkedin className="h-4 w-4" />
              <input
                placeholder="LinkedIn URL"
                className="w-full bg-transparent outline-none"
                value={form.linkedin_url}
                onChange={updateField("linkedin_url")}
                disabled={loading || saving}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <input
                placeholder="TikTok URL"
                className="w-full bg-transparent outline-none"
                value={form.tiktok_url}
                onChange={updateField("tiktok_url")}
                disabled={loading || saving}
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <input
                placeholder="WhatsApp URL"
                className="w-full bg-transparent outline-none"
                value={form.whatsapp_url}
                onChange={updateField("whatsapp_url")}
                disabled={loading || saving}
              />
            </div>
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
            Integrations and API keys can be configured in your environment
            variables.
          </div>
        </div>
      </div>
    </div>
  );
}
