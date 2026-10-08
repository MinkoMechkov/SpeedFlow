"use client";

import { useTranslations } from "next-intl";
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
import { useRouter } from "@/i18n/navigation";
import type { Tool } from "@/lib/types";

export function ToolsCatalog({ tools }: { tools: Tool[] }) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const tErrors = useTranslations("Errors");
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
      if (!res.ok) throw new Error(data.error ?? tErrors("createFailed"));
      toast.success(t("toolAdded"));
      setName("");
      setVendor("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tErrors("createFailed"),
      );
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
      if (!res.ok) throw new Error(data.error ?? tErrors("updateFailed"));
      toast.success(t("toolUpdated"));
      setEditingId(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tErrors("updateFailed"),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function removeTool(toolId: string) {
    if (!confirm(t("deleteConfirm"))) return;
    setBusyId(toolId);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? tErrors("deleteFailed"));
      toast.success(t("toolDeleted"));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tErrors("deleteFailed"),
      );
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
          <Label htmlFor="tool-name">{tCommon("name")}</Label>
          <Input
            id="tool-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cursor"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tool-vendor">{tCommon("vendor")}</Label>
          <Input
            id="tool-vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Anysphere"
          />
        </div>
        <Button type="submit" loading={creating}>
          {creating ? t("adding") : t("addTool")}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("name")}</TableHead>
              <TableHead>{tCommon("vendor")}</TableHead>
              <TableHead className="w-[220px]">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  {t("noTools")}
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
                            loading={busyId === tool.id}
                            onClick={() => saveEdit(tool.id)}
                          >
                            {tCommon("save")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            {tCommon("cancel")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => startEdit(tool)}
                          >
                            {tCommon("edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            loading={busyId === tool.id}
                            onClick={() => removeTool(tool.id)}
                          >
                            {tCommon("delete")}
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
