"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { Plus, Landmark } from "lucide-react";

interface BankAccount {
  id: string;
  name: string;
  bankName: string | null;
  iban: string | null;
  balance: number;
  currency: string;
  isDefault: boolean;
  _count: { transactions: number };
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) setAccounts(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Accounts"
        description="Track your business accounts"
        action={
          <Link href="/accounts/new">
            <Button><Plus className="h-4 w-4 mr-2" /> Add Account</Button>
          </Link>
        }
      />

      {accounts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Balance</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card><CardContent className="p-5"><div className="h-32 animate-pulse rounded bg-muted" /></CardContent></Card>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-3 mb-3"><Landmark className="h-6 w-6 text-muted-foreground" /></div>
            <p className="text-sm font-medium text-muted-foreground">No bank accounts yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add an account to start tracking balances</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <Card key={acc.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push(`/accounts/${acc.id}`)}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{acc.name}</h3>
                      {acc.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                    {acc.bankName && <p className="text-sm text-muted-foreground mt-0.5">{acc.bankName}</p>}
                    {acc.iban && <p className="text-xs font-mono text-muted-foreground mt-1">{acc.iban}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold tabular-nums ${acc.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(acc.balance, acc.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{acc._count.transactions} transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
