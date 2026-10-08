"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { useRouter } from "@/i18n/navigation";
import type { Employee, UserRole } from "@/lib/types";

export function EmployeeManageForm({ employee }: { employee: Employee }) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const tRole = useTranslations("Role");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [name, setName] = useState(employee.name);
  const [department, setDepartment] = useState(employee.department ?? "");
  const [role, setRole] = useState<UserRole>(employee.role);
  const [active, setActive] = useState(employee.active);
  const [loading, setLoading] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          department: department.trim() || null,
          role,
          active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? tErrors("updateFailed"));
      toast.success(t("employeeUpdated"));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tErrors("updateFailed"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSave}
      className="space-y-4 rounded-xl border border-border/80 bg-card/60 p-5"
    >
      <div>
        <h2 className="text-lg font-medium">{t("manageAccess")}</h2>
        <p className="text-sm text-muted-foreground">{t("manageAccessHint")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="emp-name">{tCommon("name")}</Label>
          <Input
            id="emp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emp-dept">{tCommon("department")}</Label>
          <Input
            id="emp-dept"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{tCommon("role")}</Label>
          <Select
            value={role}
            onValueChange={(v) => setRole((v ?? "employee") as UserRole)}
            items={{
              employee: tRole("employee"),
              admin: tRole("admin"),
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">{tRole("employee")}</SelectItem>
              <SelectItem value="admin">{tRole("admin")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{tCommon("active")}</Label>
          <Select
            value={active ? "yes" : "no"}
            onValueChange={(v) => setActive(v === "yes")}
            items={{
              yes: tCommon("active"),
              no: tCommon("inactive"),
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">{tCommon("active")}</SelectItem>
              <SelectItem value="no">{tCommon("inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" loading={loading} className="cursor-pointer">
        {loading ? tCommon("saving") : t("saveChanges")}
      </Button>
    </form>
  );
}
