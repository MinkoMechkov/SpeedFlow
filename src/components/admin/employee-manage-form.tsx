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
import type { Employee, UserRole } from "@/lib/types";

export function EmployeeManageForm({ employee }: { employee: Employee }) {
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
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      toast.success("Employee updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
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
        <h2 className="text-lg font-medium">Manage access</h2>
        <p className="text-sm text-muted-foreground">
          Only admins can set role to admin. New self-registrations always start
          as employee.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="emp-name">Name</Label>
          <Input
            id="emp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emp-dept">Department</Label>
          <Input
            id="emp-dept"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select
            value={role}
            onValueChange={(v) => setRole((v ?? "employee") as UserRole)}
            items={{ employee: "Employee", admin: "Admin" }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Active</Label>
          <Select
            value={active ? "yes" : "no"}
            onValueChange={(v) => setActive(v === "yes")}
            items={{ yes: "Active", no: "Inactive" }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Active</SelectItem>
              <SelectItem value="no">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={loading} className="cursor-pointer">
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
