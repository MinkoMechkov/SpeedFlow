import { ToolsCatalog } from "@/components/admin/tools-catalog";
import { requireAdmin } from "@/lib/auth";
import { listTools } from "@/lib/data";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminToolsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Admin");

  await requireAdmin();
  const tools = await listTools();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          {t("toolsTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("toolsPageSubtitle")}</p>
      </div>
      <ToolsCatalog tools={tools} />
    </div>
  );
}
