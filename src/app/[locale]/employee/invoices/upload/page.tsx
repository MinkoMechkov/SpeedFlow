import { UploadForm } from "@/components/employee/upload-form";
import { requireSession } from "@/lib/auth";
import { listTools } from "@/lib/data";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function UploadInvoicePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Employee");

  await requireSession();
  const tools = await listTools();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {t("uploadTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("uploadSubtitle")}</p>
      </div>
      <div className="rounded-xl border border-border/80 bg-card/60 p-5">
        <UploadForm initialTools={tools} />
      </div>
    </div>
  );
}
