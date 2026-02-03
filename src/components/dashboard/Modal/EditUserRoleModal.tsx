"use client";

import Modal from "@/components/common/Modal";
import type { Role } from "@/server/trpc/schemas/user";
import { useEffect, useState } from "react";

type EditUserRoleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userLabel: string;
  roles?: Role[];
  initialRoleId?: number | null;
  onSave: (roleId: number) => void;
  isPending?: boolean;
};

export default function EditUserRoleModal({
  isOpen,
  onClose,
  userLabel,
  roles,
  initialRoleId = null,
  onSave,
  isPending = false,
}: EditUserRoleModalProps) {
  const [roleId, setRoleId] = useState<number | null>(initialRoleId);

  useEffect(() => {
    if (isOpen) {
      setRoleId(initialRoleId ?? null);
    }
  }, [isOpen, initialRoleId]);

  const isUnchanged = roleId === null || roleId === initialRoleId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar rol" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Cambiar rol para{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {userLabel}
          </span>
        </p>

        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Rol
          <select
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            value={roleId ?? ""}
            onChange={(e) => setRoleId(Number(e.target.value))}
          >
            <option value="" disabled>
              Selecciona un rol
            </option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-3 border-gray-200 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => roleId !== null && onSave(roleId)}
            disabled={isPending || isUnchanged}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
