"use client";

import { useState } from "react";
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

export function UploadForm({ tools }: { tools: Tool[] }) {
  const router = useRouter();
  const [toolId, setToolId] = useState(tools[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!toolId || !file) {
      toast.error("Select a tool and invoice file");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.set("toolId", toolId);
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
        <Select value={toolId} onValueChange={(v) => setToolId(v ?? "")}>
          <SelectTrigger id="tool" className="w-full">
            <SelectValue placeholder="Select tool" />
          </SelectTrigger>
          <SelectContent>
            {tools.map((tool) => (
              <SelectItem key={tool.id} value={tool.id}>
                {tool.name} · {tool.vendor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Invoice is always attached to your account — you cannot upload for
          someone else.
        </p>
      </div>
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
