"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  name: string;
  email: string | null;
  country: string;
  taxId: string | null;
}

interface ClientTableProps {
  clients: Client[];
}

export function ClientTable({ clients }: ClientTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = clients.filter((client) => {
    const term = search.toLowerCase();
    return (
      client.name.toLowerCase().includes(term) ||
      (client.email?.toLowerCase().includes(term) ?? false) ||
      client.country.toLowerCase().includes(term) ||
      (client.taxId?.toLowerCase().includes(term) ?? false)
    );
  });

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete client");
      }
      router.refresh();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Tax ID</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No clients found.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <Link
                    href={`/clients/${client.id}`}
                    className="font-medium hover:underline"
                  >
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>{client.email ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{client.country}</Badge>
                </TableCell>
                <TableCell>{client.taxId ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/clients/${client.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(client.id, client.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
