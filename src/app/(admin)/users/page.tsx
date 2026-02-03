"use client";

import DataTable, { Column, RowAction } from "@/components/common/DataTable";
import DeleteUserModal from "@/components/dashboard/Modal/DeleteUserModal";
import EditUserRoleModal from "@/components/dashboard/Modal/EditUserRoleModal";
import { trpc } from "@/lib/trpc/client";
import type { User as MeUser } from "@/server/trpc/schemas/user";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";

// 👇 importa tipos (ajusta el path de AppRouter al tuyo)
import type { AppRouter } from "@/server/trpc"; // o "@/server/trpc/index" / "@/server/trpc/router"
import type { TRPCClientErrorLike } from "@trpc/react-query";

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

function getUserName(user: MeUser) {
  return (
    [user.profile?.firstName, user.profile?.lastName]
      .filter(Boolean)
      .join(" ") || user.email.split("@")[0]
  );
}

function roleChipClasses(roleName?: string | null) {
  const name = (roleName ?? "").toLowerCase();
  if (name.includes("admin")) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";
  }
  if (name.includes("manager")) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (name.includes("editor")) {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300";
  }
  if (name.includes("viewer") || name.includes("read")) {
    return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300";
}

export default function UsersPage() {
  const {
    data: users,
    isLoading,
    error,
    isError,
  } = trpc.admin.listUsers.useQuery<MeUser[]>();

  // ❌ sin any, ✅ con type guard
  const forbidden =
    isError && isTrpcError(error) && error.data?.code === "FORBIDDEN";

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
  const [editUser, setEditUser] = useState<MeUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MeUser | null>(null);

  const columns = useMemo<Column<MeUser>[]>(
    () => [
      {
        header: "User",
        className: "min-w-[240px]",
        searchValue: (u) => getUserName(u),
        cell: (u) => {
          const fullName = getUserName(u);
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 flex items-center justify-center text-xs font-semibold">
                {initials(fullName, u.email)}
              </div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {fullName}
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
          const roleName = u.roles[0]?.role?.name ?? "—";
          return (
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${roleChipClasses(
                roleName,
              )}`}
            >
              {roleName}
            </span>
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
    [],
  );

  const actions = useMemo<RowAction<MeUser>[]>(
    () => [
      {
        label: "Edit",
        tone: "primary",
        iconOnly: true,
        icon: <PencilSquareIcon className="h-4 w-4" />,
        onClick: (u) => setEditUser(u),
      },
      {
        label: "Delete",
        tone: "danger",
        iconOnly: true,
        icon: <TrashIcon className="h-4 w-4" />,
        onClick: (u) => setDeleteTarget(u),
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const name = getUserName(u).toLowerCase();
      const roleNames = u.roles.map((r) => r.role.name.toLowerCase()).join(",");
      return name.includes(q) || roleNames.includes(q);
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
      searchPlaceholder="Search name or role..."
      onSearchChange={setSearch}
      emptyState={<span>No users found</span>}
    />
  );

  const editUserLabel = editUser ? getUserName(editUser) : "";
  const deleteUserLabel = deleteTarget ? getUserName(deleteTarget) : "";

  return (
    <div className="space-y-4">
      {content}
      <EditUserRoleModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        userLabel={editUserLabel}
        roles={roles}
        initialRoleId={editUser?.roles[0]?.role?.id ?? null}
        isPending={setUserRole.isPending}
        onSave={(roleId) => {
          if (!editUser) return;
          setUserRole.mutate(
            { userId: editUser.id, roleId },
            { onSuccess: () => setEditUser(null) },
          );
        }}
      />
      <DeleteUserModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        userLabel={deleteUserLabel}
        isPending={deleteUser.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteUser.mutate(
            { userId: deleteTarget.id },
            { onSuccess: () => setDeleteTarget(null) },
          );
        }}
      />
    </div>
  );
}
