"use client";

import { useMemo, useState } from "react";
import DataTable, { Column, RowAction } from "@/components/ui/DataTable";
import { trpc } from "@/lib/trpc/client";
import type { User as MeUser } from "@/server/trpc/schemas/user";

// 👇 importa tipos (ajusta el path de AppRouter al tuyo)
import type { TRPCClientErrorLike } from "@trpc/react-query";
import type { AppRouter } from "@/server/trpc"; // o "@/server/trpc/index" / "@/server/trpc/router"

// --- type guard SIN any ---
function isTrpcError(e: unknown): e is TRPCClientErrorLike<AppRouter> {
  if (typeof e !== "object" || e === null) return false;
  const obj = e as Record<string, unknown>;
  if (!("data" in obj)) return false;
  const data = obj.data as unknown;
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return typeof d.code === "string"; // p.ej. "FORBIDDEN"
}

function initials(name?: string | null, email?: string) {
  const base = (name && name.trim()) || email || "";
  const parts = base.split(" ").filter(Boolean);
  const take = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return take.toUpperCase() || (email?.[0]?.toUpperCase() ?? "?");
}

export default function UsersPage() {
  const { data: users, isLoading, error, isError } =
    trpc.admin.listUsers.useQuery<MeUser[]>();

  // ❌ sin any, ✅ con type guard
  const forbidden = isError && isTrpcError(error) && error.data?.code === "FORBIDDEN";

  const { data: roles } = trpc.admin.listRoles.useQuery(undefined, {
    enabled: !forbidden,
  });

  const utils = trpc.useUtils();
  const setUserRole = trpc.admin.setUserRole.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });
  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  const [search, setSearch] = useState("");

  const columns = useMemo<Column<MeUser>[]>(
    () => [
      {
        header: "User",
        className: "min-w-[240px]",
        searchValue: (u) =>
          `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""} ${u.email}`.trim(),
        cell: (u) => {
          const fullName =
            [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") ||
            u.email.split("@")[0];
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 flex items-center justify-center text-xs font-semibold">
                {initials(fullName, u.email)}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{fullName}</div>
                <div className="text-gray-500 text-xs">{u.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        header: "Role",
        width: "180px",
        searchValue: (u) => u.roles.map((r) => r.role.name).join(","),
        cell: (u) => {
          const current = u.roles[0]?.role?.name ?? "—";
          return (
            <select
              className="rounded-md border border-gray-200 dark:border-gray-700 bg-transparent px-2 py-1 text-sm"
              defaultValue={current}
              onChange={(e) => {
                const roleName = e.target.value;
                const roleId = roles?.find((r) => r.name === roleName)?.id;
                if (!roleId) return;
                setUserRole.mutate({ userId: u.id, roleId });
              }}
            >
              <option disabled>—</option>
              {roles?.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        header: "Created",
        width: "160px",
        searchValue: (u) => new Date(u.createdAt).toISOString(),
        cell: (u) => (
          <span className="text-gray-600 dark:text-gray-400">
            {new Date(u.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [roles, setUserRole]
  );

  const actions = useMemo<RowAction<MeUser>[]>(
    () => [
      {
        label: "Edit",
        tone: "primary",
        onClick: (u) => {
          alert(`Edit user ${u.email}`);
        },
      },
      {
        label: "Delete",
        tone: "danger",
        onClick: (u) => {
          if (confirm(`Delete ${u.email}?`)) {
            deleteUser.mutate({ userId: u.id });
          }
        },
      },
    ],
    [deleteUser]
  );

  const filtered = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const name = `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""}`.toLowerCase();
      const emails = u.email.toLowerCase();
      const roleNames = u.roles.map((r) => r.role.name.toLowerCase()).join(",");
      return name.includes(q) || emails.includes(q) || roleNames.includes(q);
    });
  }, [users, search]);

  const content = forbidden ? (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
      No tienes permisos para ver esta sección.
    </div>
  ) : (
    <DataTable<MeUser>
      title="Users"
      data={filtered}
      columns={columns}
      actions={actions}
      loading={isLoading}
      enableSearch
      searchPlaceholder="Search name, email, role..."
      onSearchChange={setSearch}
      emptyState={<span>No users found</span>}
    />
  );

  return <div className="space-y-4">{content}</div>;
}
