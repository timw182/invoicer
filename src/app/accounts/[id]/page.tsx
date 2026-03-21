import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

interface AccountDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = await params;

  const account = await prisma.bankAccount.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
        take: 100,
        include: { category: true },
      },
    },
  });

  if (!account) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        description={[account.bankName, account.iban].filter(Boolean).join(" — ") || undefined}
        action={
          <div className="flex items-center gap-2">
            {account.isDefault && <Badge variant="secondary">Default</Badge>}
            <Badge variant="outline" className="text-lg font-bold tabular-nums">
              {formatCurrency(account.balance, account.currency)}
            </Badge>
          </div>
        }
      />

      <Card>
        <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
        <CardContent>
          {account.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No transactions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Description</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Category</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {account.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(tx.date)}</TableCell>
                    <TableCell className="text-sm font-medium">{tx.description}</TableCell>
                    <TableCell>
                      {tx.category ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tx.category.color || "#6b7280" }} />
                          <span className="text-xs text-muted-foreground">{tx.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className={`text-sm text-right tabular-nums font-medium ${tx.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                      {tx.type === "income" ? "+" : "−"}{formatCurrency(tx.amount, account.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
