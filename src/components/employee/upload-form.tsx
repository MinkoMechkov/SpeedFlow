"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
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

type StepId = "tool" | "upload" | "analyze";

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: "tool", label: "Saving custom tool" },
  { id: "upload", label: "Uploading file" },
  { id: "analyze", label: "Reading invoice with AI" },
];

const BUTTON_LABEL: Record<StepId, string> = {
  tool: "Saving tool…",
  upload: "Uploading…",
  analyze: "Analyzing invoice…",
};

function UploadSteps({ current, custom }: { current: StepId; custom: boolean }) {
  const steps = custom ? STEPS : STEPS.filter((s) => s.id !== "tool");
  const currentIndex = steps.findIndex((s) => s.id === current);
  return (
    <ol
      aria-live="polite"
      className="space-y-2 rounded-lg border border-border/70 bg-muted/40 p-4 text-sm"
    >
      {steps.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={s.id} className="flex items-center gap-2.5">
            {done ? (
              <CheckCircle2 className="size-4 text-[var(--brand-deep)]" aria-hidden />
            ) : active ? (
              <Loader2 className="size-4 animate-spin text-[var(--brand-deep)]" aria-hidden />
            ) : (
              <Circle className="size-4 text-muted-foreground/50" aria-hidden />
            )}
            <span className={active ? "font-medium" : done ? "" : "text-muted-foreground"}>
              {s.label}
            </span>
          </li>
        );
      })}
      {current === "analyze" ? (
        <li className="pl-6.5 text-xs text-muted-foreground">
          This usually takes a few seconds.
        </li>
      ) : null}
    </ol>
  );
}

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
  const [step, setStep] = useState<StepId | null>(null);

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
    let analyzeTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      let resolvedToolId = toolId;

      if (isCustom) {
        const name = customName.trim();
        if (!name) {
          toast.error("Enter a tool name");
          setLoading(false);
          return;
        }
        setStep("tool");
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
        setStep(null);
        return;
      }

      const form = new FormData();
      form.set("toolId", resolvedToolId);
      form.set("file", file);
      setStep("upload");
      analyzeTimer = setTimeout(() => setStep("analyze"), 1200);
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
      setLoading(false);
      setStep(null);
    } finally {
      clearTimeout(analyzeTimer);
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
      {loading && step ? <UploadSteps current={step} custom={isCustom} /> : null}
      <Button type="submit" size="lg" loading={loading}>
        {loading && step ? BUTTON_LABEL[step] : "Upload & analyze"}
      </Button>
    </form>
  );
}
