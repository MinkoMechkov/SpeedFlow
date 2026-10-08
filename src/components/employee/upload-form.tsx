"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
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
import { UploadIllustration } from "@/components/employee/upload-illustration";
import type { Tool } from "@/lib/types";

const CUSTOM_TOOL = "__custom__";

type Step = "tool" | "upload" | "analyze";

function UploadSteps({
  current,
  custom,
}: {
  current: Step;
  custom: boolean;
}) {
  const t = useTranslations("Employee");
  const steps = custom
    ? ([
        { id: "tool" as const, label: t("stepTool") },
        { id: "upload" as const, label: t("stepUpload") },
        { id: "analyze" as const, label: t("stepAnalyze") },
      ] as const)
    : ([
        { id: "upload" as const, label: t("stepUpload") },
        { id: "analyze" as const, label: t("stepAnalyze") },
      ] as const);
  const currentIdx = steps.findIndex((s) => s.id === current);

  return (
    <ol className="space-y-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={step.id} className="flex items-center gap-2.5">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={
                done
                  ? "text-muted-foreground line-through"
                  : active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
              }
            >
              {step.label}
              {active ? "…" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function UploadForm({ initialTools }: { initialTools: Tool[] }) {
  const t = useTranslations("Employee");
  const tCommon = useTranslations("Common");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [tools, setTools] = useState(initialTools);
  const [toolId, setToolId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customVendor, setCustomVendor] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step | null>(null);

  const isCustom = toolId === CUSTOM_TOOL;

  const selectItems = useMemo(
    () => [
      ...tools.map((tool) => ({
        value: tool.id,
        label: `${tool.name} (${tool.vendor})`,
      })),
      { value: CUSTOM_TOOL, label: t("addCustomTool") },
    ],
    [tools, t],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error(t("selectFile"));
      return;
    }

    setLoading(true);
    let analyzeTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      let resolvedToolId = toolId;

      if (isCustom) {
        const name = customName.trim();
        if (!name) {
          toast.error(t("enterToolName"));
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
        if (!res.ok) throw new Error(data.error ?? t("createToolFailed"));
        const tool = data.tool as Tool;
        setTools((prev) =>
          prev.some((x) => x.id === tool.id) ? prev : [...prev, tool],
        );
        resolvedToolId = tool.id;
        setToolId(tool.id);
      }

      if (!resolvedToolId || resolvedToolId === CUSTOM_TOOL) {
        toast.error(t("selectToolError"));
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
      if (!res.ok) throw new Error(data.error ?? tErrors("uploadFailed"));
      toast.success(t("uploadSuccess"));
      router.push("/employee/invoices");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tErrors("uploadFailed"),
      );
      setLoading(false);
      setStep(null);
    } finally {
      clearTimeout(analyzeTimer);
    }
  }

  const buttonLabel =
    loading && step
      ? step === "tool"
        ? t("btnSavingTool")
        : step === "upload"
          ? t("btnUploading")
          : t("btnAnalyzing")
      : t("uploadAnalyze");

  return (
    <form onSubmit={onSubmit} className="w-full space-y-5">
      <div className="space-y-2">
        <Label htmlFor="tool">{tCommon("tool")}</Label>
        <Select
          value={toolId}
          onValueChange={(v) => setToolId(v ?? "")}
          items={selectItems}
        >
          <SelectTrigger id="tool" className="w-full">
            <SelectValue placeholder={t("selectTool")} />
          </SelectTrigger>
          <SelectContent>
            {tools.map((tool) => (
              <SelectItem key={tool.id} value={tool.id}>
                {tool.name} ({tool.vendor})
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_TOOL}>{t("addCustomTool")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("toolHint")}</p>
      </div>

      {isCustom ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="custom-name">{t("toolName")}</Label>
            <Input
              id="custom-name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="ChatGPT"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-vendor">{tCommon("vendor")}</Label>
            <Input
              id="custom-vendor"
              value={customVendor}
              onChange={(e) => setCustomVendor(e.target.value)}
              placeholder="OpenAI"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="file">{t("invoiceFile")}</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {loading && step ? (
        <div className="space-y-3">
          <UploadIllustration step={step} />
          <UploadSteps current={step} custom={isCustom} />
        </div>
      ) : null}
      <Button type="submit" size="lg" loading={loading}>
        {buttonLabel}
      </Button>
    </form>
  );
}
