"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string | null;
  _count?: { transactions: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("expense");
  const [newColor, setNewColor] = useState("#6b7280");
  const [adding, setAdding] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, type: newType, color: newColor }),
      });
      if (res.ok) {
        setNewName("");
        fetchCategories();
      }
    } catch (e) { console.error(e); }
    finally { setAdding(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) fetchCategories();
      else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (e) { console.error(e); }
  }

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  function CategoryList({ items }: { items: Category[] }) {
    if (items.length === 0) return <p className="text-sm text-muted-foreground py-4">No categories yet.</p>;
    return (
      <div className="space-y-2">
        {items.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color || "#6b7280" }} />
              <span className="text-sm font-medium">{cat.name}</span>
              {cat._count && (
                <Badge variant="secondary" className="text-xs">
                  {cat._count.transactions} txns
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(cat.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Manage income and expense categories" />

      <Card>
        <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" />
            </div>
            <div className="w-36 space-y-1">
              <Label>Type</Label>
              <Select value={newType} onChange={(e) => setNewType(e.target.value)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
            </div>
            <div className="w-20 space-y-1">
              <Label>Color</Label>
              <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-10 w-full cursor-pointer rounded border p-1" />
            </div>
            <Button onClick={handleAdd} disabled={adding || !newName.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="expense">
        <TabsList>
          <TabsTrigger value="expense">Expense ({expenseCategories.length})</TabsTrigger>
          <TabsTrigger value="income">Income ({incomeCategories.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="expense">
          <Card><CardContent className="pt-6"><CategoryList items={expenseCategories} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="income">
          <Card><CardContent className="pt-6"><CategoryList items={incomeCategories} /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
