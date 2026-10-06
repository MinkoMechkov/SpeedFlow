"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tool } from "@/lib/types";

const CUSTOM_TOOL = "__custom__";

function toolLabel(tool: Tool) {
  return `${tool.name} · ${tool.vendor}`;
}

export function UploadForm({ tools: initialTools }: { tools: Tool[] }) {
  const router = useRouter();
  const [tools, setTools] = useState(initialTools);
  const [toolId, setToolId] = useState(initialTools[0]?.id ?? "");
  const [customName, setCustomName] = useState("");
  const [customVendor, setCustomVendor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const isCustom = toolId === CUSTOM_TOOL;

  const selectItems = useMemo(() => {
    const items: Record<string, string> = {
      [CUSTOM_TOOL]: "Add custom tool…",
    };
    for (const tool of tools) {
      items[tool.id] = toolLabel(tool);
    }
    return items;
  }, [tools]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Select an invoice file");
      return;
    }

    setLoading(true);
    try {
      let resolvedToolId = toolId;

      if (isCustom) {
        const name = customName.trim();
        if (!name) {
          toast.error("Enter a tool name");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            vendor: customVendor.trim() || name,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to create tool");
        const tool = data.tool as Tool;
        setTools((prev) =>
          prev.some((t) => t.id === tool.id) ? prev : [...prev, tool],
        );
        resolvedToolId = tool.id;
        setToolId(tool.id);
      }

      if (!resolvedToolId || resolvedToolId === CUSTOM_TOOL) {
        toast.error("Select a tool");
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.set("toolId", resolvedToolId);
      form.set("file", file);
      const res = await fetch("/api/invoices/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      toast.success("Invoice uploaded and queued for review");
      router.push("/employee/invoices");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="tool">Tool</Label>
        <Select
          value={toolId}
          onValueChange={(v) => setToolId(v ?? "")}
          items={selectItems}
        >
          <SelectTrigger id="tool" className="w-full">
            <SelectValue placeholder="Select tool" />
          </SelectTrigger>
          <SelectContent>
            {tools.map((tool) => (
              <SelectItem key={tool.id} value={tool.id}>
                {toolLabel(tool)}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_TOOL}>Add custom tool…</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Invoice is always attached to your account — you cannot upload for
          someone else.
        </p>
      </div>

      {isCustom ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="custom-name">Tool name</Label>
            <Input
              id="custom-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. ChatGPT"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-vendor">Vendor</Label>
            <Input
              id="custom-vendor"
              value={customVendor}
              onChange={(e) => setCustomVendor(e.target.value)}
              placeholder="e.g. OpenAI"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="file">Invoice file</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Analyzing…" : "Upload & analyze"}
      </Button>
    </form>
  );
}
