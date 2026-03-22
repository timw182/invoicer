"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface Category { id: string; name: string; type: string; }
interface Account { id: string; name: string; }

export default function NewExpensePage() {
  const t = useTranslations("expenses");
  const tc = useTranslations("common");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [taxRate, setTaxRate] = useState("17");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories?type=expense").then((r) => r.json()),
      fetch("/api/accounts").then((r) => r.json()),
    ]).then(([cats, accs]) => {
      setCategories(cats);
      setAccounts(accs);
    });
  }, []);

  const netAmount = parseFloat(amount) || 0;
  const taxAmt = Math.round(netAmount * (parseFloat(taxRate) / 100) * 100) / 100;
  const totalAmount = Math.round((netAmount + taxAmt) * 100) / 100;

  function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { alert(t("receiptTooLarge")); return; }
    const reader = new FileReader();
    reader.onload = () => setReceiptUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount) return;
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "expense",
          description,
          amount: totalAmount,
          taxAmount: taxAmt,
          taxRate: parseFloat(taxRate) || 0,
          date,
          categoryId: categoryId || null,
          accountId: accountId || null,
          receiptUrl,
          notes: notes || null,
        }),
      });
      if (res.ok) router.push("/expenses");
      else {
        const data = await res.json();
        alert(data.error || "Failed to create expense");
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("addExpense")} />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader><CardTitle>{t("expenseDetails")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{tc("description")}</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("whatExpenseFor")} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("netAmount")}</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" step="0.01" min="0" required />
              </div>
              <div className="space-y-2">
                <Label>{t("taxRatePercent")}</Label>
                <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="19" step="0.01" min="0" />
              </div>
              <div className="space-y-2">
                <Label>{t("totalInclTax")}</Label>
                <Input value={totalAmount.toFixed(2)} disabled className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{tc("date")}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">{tc("select")}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("bankAccount")}</Label>
                <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  <option value="">{tc("select")}</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("receipt")}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {receiptUrl ? (
                <div className="relative">
                  <img src={receiptUrl} alt="Receipt" className="h-24 w-auto rounded border object-contain" />
                  <button type="button" onClick={() => { setReceiptUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex h-24 w-32 items-center justify-center rounded border-2 border-dashed border-muted-foreground/25">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" id="receipt-upload" />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  {receiptUrl ? t("change") : t("uploadReceipt")}
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">{t("imageMax1MB")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{tc("notes")}</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>{loading ? tc("saving") : t("addExpense")}</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/expenses")}>{tc("cancel")}</Button>
        </div>
      </form>
    </div>
  );
}
