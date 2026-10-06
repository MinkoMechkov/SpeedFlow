"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tool } from "@/lib/types";

export function ToolsCatalog({ tools }: { tools: Tool[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [vendor, setVendor] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editVendor, setEditVendor] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createTool(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, vendor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      toast.success("Tool added");
      setName("");
      setVendor("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(tool: Tool) {
    setEditingId(tool.id);
    setEditName(tool.name);
    setEditVendor(tool.vendor);
  }

  async function saveEdit(toolId: string) {
    setBusyId(toolId);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, vendor: editVendor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      toast.success("Tool updated");
      setEditingId(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function removeTool(toolId: string) {
    if (!confirm("Delete this tool? This fails if it is in use.")) return;
    setBusyId(toolId);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toast.success("Tool deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={createTool}
        className="grid gap-3 rounded-xl border border-border/80 bg-card/60 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="tool-name">Name</Label>
          <Input
            id="tool-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cursor"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tool-vendor">Vendor</Label>
          <Input
            id="tool-vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Anysphere"
          />
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? "Adding…" : "Add tool"}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="w-[220px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  No tools yet.
                </TableCell>
              </TableRow>
            ) : (
              tools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell>
                    {editingId === tool.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      <span className="font-medium">{tool.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === tool.id ? (
                      <Input
                        value={editVendor}
                        onChange={(e) => setEditVendor(e.target.value)}
                      />
                    ) : (
                      tool.vendor
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {editingId === tool.id ? (
                        <>
                          <Button
                            size="sm"
                            disabled={busyId === tool.id}
                            onClick={() => saveEdit(tool.id)}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => startEdit(tool)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === tool.id}
                            onClick={() => removeTool(tool.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
