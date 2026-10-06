import { ToolsCatalog } from "@/components/admin/tools-catalog";
import { requireAdmin } from "@/lib/auth";
import { listTools } from "@/lib/data";

export default async function AdminToolsPage() {
  await requireAdmin();
  const tools = await listTools();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Tool catalog
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage named tools used on uploads and subscriptions. Delete is blocked
          when a tool is referenced by invoices or subscriptions.
        </p>
      </div>
      <ToolsCatalog tools={tools} />
    </div>
  );
}
