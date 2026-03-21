"use client";

import { useEffect, useState, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Upload, X } from "lucide-react";

interface BusinessProfile {
  id: string;
  name: string;
  address: string;
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
}

export default function SettingsPage() {
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings");
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
      setError("Logo file must be under 500KB");
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
        <PageHeader title="Settings" description="Manage your business profile" />
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" description="Manage your business profile" />
        <div className="text-muted-foreground">Failed to load settings.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your business profile" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => updateField("address", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatId">VAT ID</Label>
              <Input
                id="vatId"
                value={profile.vatId || ""}
                onChange={(e) => updateField("vatId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
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
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Logo</Label>
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
                    {profile.logoUrl ? "Change Logo" : "Upload Logo"}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG, or SVG. Max 500KB.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
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
                Used for invoice header bar, headings, and accents.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={profile.bankName || ""}
                onChange={(e) => updateField("bankName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankIban">Bank IBAN</Label>
              <Input
                id="bankIban"
                value={profile.bankIban || ""}
                onChange={(e) => updateField("bankIban", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankBic">Bank BIC</Label>
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
            <CardTitle>Invoice Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select
                id="defaultCurrency"
                value={profile.defaultCurrency}
                onChange={(e) => updateField("defaultCurrency", e.target.value)}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input
                id="invoicePrefix"
                value={profile.invoicePrefix}
                onChange={(e) => updateField("invoicePrefix", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultPaymentTermDays">Default Payment Term Days</Label>
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
                Small Business Exemption (Kleinunternehmerregelung)
              </Label>
            </div>

            {profile.smallBusinessExemption && (
              <div className="space-y-2">
                <Label htmlFor="exemptionNote">Exemption Note</Label>
                <Textarea
                  id="exemptionNote"
                  value={profile.exemptionNote || ""}
                  onChange={(e) => updateField("exemptionNote", e.target.value)}
                  placeholder="e.g. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {success && (
          <div className="rounded-md bg-green-50 border border-green-200 p-4 text-green-800 text-sm">
            Settings saved successfully.
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
