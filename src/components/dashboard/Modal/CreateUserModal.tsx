"use client";

import Modal from "@/components/common/Modal";
import type { Role } from "@/server/trpc/schemas/user";
import { useEffect, useState } from "react";

export type CreateUserForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleId: number | "";
};

type CreateUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  roles?: Role[];
  onCreate: (input: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    password: string;
    roleId: number;
  }) => void;
  isPending?: boolean;
};

const emptyForm: CreateUserForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  roleId: "",
};

export default function CreateUserModal({
  isOpen,
  onClose,
  roles,
  onCreate,
  isPending = false,
}: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserForm>(emptyForm);

  useEffect(() => {
    if (isOpen) setForm(emptyForm);
  }, [isOpen]);

  const isValidEmail = form.email.trim().length > 3 && form.email.includes("@");
  const passwordsMatch = form.password === form.confirmPassword;
  const isReady =
    isValidEmail && !!form.password && passwordsMatch && form.roleId !== "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear usuario" size="sm">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre
            <input
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="Juan"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Apellido
            <input
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Salgado"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
            <input
              type="email"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@email.com"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rol
            <select
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={form.roleId}
              onChange={(e) =>
                setForm({ ...form, roleId: Number(e.target.value) })
              }
              required
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

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contraseña
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              required
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirmar contraseña
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
            />
          </label>

          {!passwordsMatch && form.confirmPassword && (
            <p className="text-xs text-red-600">
              Las contraseñas no coinciden.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-white/10">
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
            onClick={() => {
              if (!isReady || form.roleId === "") return;
              onCreate({
                firstName: form.firstName.trim() || null,
                lastName: form.lastName.trim() || null,
                email: form.email.trim(),
                password: form.password,
                roleId: form.roleId,
              });
            }}
            disabled={isPending || !isReady}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
