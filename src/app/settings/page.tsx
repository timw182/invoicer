"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Upload, X, Mail } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

interface BusinessProfile {
  id: string;
  name: string;
  address: string;
  country: string;
  vatId: string | null;
  email: string | null;
  phone: string | null;
  bankName: string | null;
  bankIban: string | null;
  bankBic: string | null;
  logoUrl: string | null;
  accentColor: string;
  defaultCurrency: string;
  invoicePrefix: string;
  defaultPaymentTermDays: number;
  smallBusinessExemption: boolean;
  exemptionNote: string | null;
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpFrom: string | null;
  smtpSecure: boolean;
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          address: profile.address,
          country: profile.country,
          vatId: profile.vatId || undefined,
          email: profile.email || undefined,
          phone: profile.phone || undefined,
          bankName: profile.bankName || undefined,
          bankIban: profile.bankIban || undefined,
          bankBic: profile.bankBic || undefined,
          logoUrl: profile.logoUrl || null,
          accentColor: profile.accentColor,
          defaultCurrency: profile.defaultCurrency,
          invoicePrefix: profile.invoicePrefix,
          defaultPaymentTermDays: profile.defaultPaymentTermDays,
          smallBusinessExemption: profile.smallBusinessExemption,
          exemptionNote: profile.exemptionNote || undefined,
          smtpHost: profile.smtpHost || undefined,
          smtpPort: profile.smtpPort,
          smtpUser: profile.smtpUser || undefined,
          smtpPass: profile.smtpPass || undefined,
          smtpFrom: profile.smtpFrom || undefined,
          smtpSecure: profile.smtpSecure,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || t("failedToSave"));
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(t("failedToSave"));
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof BusinessProfile, value: string | number | boolean | null) {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError(t("logoTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField("logoUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <div className="text-muted-foreground">{tc("loading")}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
        <div className="text-muted-foreground">{t("failedToLoad")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("companyInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("companyName")}</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{tc("address")}</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => updateField("address", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{tc("country")}</Label>
              <Select
                id="country"
                value={profile.country}
                onChange={(e) => updateField("country", e.target.value)}
              >
                <option value="DE">{t("countries.DE")}</option>
                <option value="AT">{t("countries.AT")}</option>
                <option value="CH">{t("countries.CH")}</option>
                <option value="NL">{t("countries.NL")}</option>
                <option value="FR">{t("countries.FR")}</option>
                <option value="BE">{t("countries.BE")}</option>
                <option value="IT">{t("countries.IT")}</option>
                <option value="ES">{t("countries.ES")}</option>
                <option value="PL">{t("countries.PL")}</option>
                <option value="CZ">{t("countries.CZ")}</option>
                <option value="DK">{t("countries.DK")}</option>
                <option value="SE">{t("countries.SE")}</option>
                <option value="FI">{t("countries.FI")}</option>
                <option value="PT">{t("countries.PT")}</option>
                <option value="IE">{t("countries.IE")}</option>
                <option value="LU">{t("countries.LU")}</option>
                <option value="GR">{t("countries.GR")}</option>
                <option value="GB">{t("countries.GB")}</option>
                <option value="US">{t("countries.US")}</option>
                <option value="NO">{t("countries.NO")}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatId">{t("vatId")}</Label>
              <Input
                id="vatId"
                value={profile.vatId || ""}
                onChange={(e) => updateField("vatId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{tc("email")}</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{tc("phone")}</Label>
              <Input
                id="phone"
                value={profile.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("branding")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("companyLogo")}</Label>
              <div className="flex items-center gap-4">
                {profile.logoUrl ? (
                  <div className="relative">
                    <img
                      src={profile.logoUrl}
                      alt="Company logo"
                      className="h-16 w-auto max-w-[200px] rounded border object-contain p-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateField("logoUrl", null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-32 items-center justify-center rounded border-2 border-dashed border-muted-foreground/25 text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profile.logoUrl ? t("changeLogo") : t("uploadLogo")}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("logoHint")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">{t("accentColor")}</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="accentColor"
                  value={profile.accentColor}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border p-1"
                />
                <Input
                  value={profile.accentColor}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  placeholder="#1e40af"
                  className="w-32"
                />
                <div
                  className="h-10 flex-1 rounded border"
                  style={{ backgroundColor: profile.accentColor }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("accentColorHint")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("bankDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">{t("bankName")}</Label>
              <Input
                id="bankName"
                value={profile.bankName || ""}
                onChange={(e) => updateField("bankName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankIban">{t("bankIban")}</Label>
              <Input
                id="bankIban"
                value={profile.bankIban || ""}
                onChange={(e) => updateField("bankIban", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankBic">{t("bankBic")}</Label>
              <Input
                id="bankBic"
                value={profile.bankBic || ""}
                onChange={(e) => updateField("bankBic", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("invoiceDefaults")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">{t("defaultCurrency")}</Label>
              <Select
                id="defaultCurrency"
                value={profile.defaultCurrency}
                onChange={(e) => updateField("defaultCurrency", e.target.value)}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">{t("invoicePrefix")}</Label>
              <Input
                id="invoicePrefix"
                value={profile.invoicePrefix}
                onChange={(e) => updateField("invoicePrefix", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultPaymentTermDays">{t("defaultPaymentTermDays")}</Label>
              <Input
                id="defaultPaymentTermDays"
                type="number"
                value={profile.defaultPaymentTermDays}
                onChange={(e) =>
                  updateField("defaultPaymentTermDays", parseInt(e.target.value) || 0)
                }
              />
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <input
                id="smallBusinessExemption"
                type="checkbox"
                checked={profile.smallBusinessExemption}
                onChange={(e) =>
                  updateField("smallBusinessExemption", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="smallBusinessExemption">
                {t("smallBusinessExemption")}
              </Label>
            </div>

            {profile.smallBusinessExemption && (
              <div className="space-y-2">
                <Label htmlFor="exemptionNote">{t("exemptionNote")}</Label>
                <Textarea
                  id="exemptionNote"
                  value={profile.exemptionNote || ""}
                  onChange={(e) => updateField("exemptionNote", e.target.value)}
                  placeholder={t("exemptionNotePlaceholder")}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t("emailSmtp")}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("emailSmtpDescription")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">{t("smtpHost")}</Label>
                <Input
                  id="smtpHost"
                  value={profile.smtpHost || ""}
                  onChange={(e) => updateField("smtpHost", e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">{t("smtpPort")}</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={profile.smtpPort}
                  onChange={(e) => updateField("smtpPort", parseInt(e.target.value) || 587)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpUser">{t("username")}</Label>
                <Input
                  id="smtpUser"
                  value={profile.smtpUser || ""}
                  onChange={(e) => updateField("smtpUser", e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPass">{t("smtpPassword")}</Label>
                <Input
                  id="smtpPass"
                  type="password"
                  value={profile.smtpPass || ""}
                  onChange={(e) => updateField("smtpPass", e.target.value)}
                  placeholder={t("smtpPasswordPlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpFrom">{t("fromAddress")}</Label>
              <Input
                id="smtpFrom"
                type="email"
                value={profile.smtpFrom || ""}
                onChange={(e) => updateField("smtpFrom", e.target.value)}
                placeholder={t("fromAddressPlaceholder")}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="smtpSecure"
                type="checkbox"
                checked={profile.smtpSecure}
                onChange={(e) => updateField("smtpSecure", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="smtpSecure">
                {t("sslTls")}
              </Label>
            </div>
          </CardContent>
        </Card>

        {success && (
          <div className="rounded-md bg-green-50 border border-green-200 p-4 text-green-800 text-sm">
            {t("savedSuccessfully")}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? tc("saving") : t("saveSettings")}
        </Button>
      </form>
    </div>
  );
}
