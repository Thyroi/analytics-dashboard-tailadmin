"use client";

import { useToast } from "@/hooks/useToast";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";

export default function ProfilePasswordUpdate() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePassword = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => {
      toast.error(err.message || "No se pudo actualizar la contraseña");
    },
  });

  const passwordsMatch = newPassword === confirmPassword;
  const isReady =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    passwordsMatch &&
    !changePassword.isPending;

  return (
    <div className="card">
      <div className="card-body space-y-4">
        <div>
          <h3 className="card-title">Actualizar contraseña</h3>
          <p className="card-subtitle">
            Ingresa tu contraseña actual y una nueva (mínimo 8 caracteres).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contraseña actual
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nueva contraseña
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirmar nueva contraseña
            <input
              type="password"
              className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
            />
          </label>
        </div>

        {!passwordsMatch && confirmPassword && (
          <p className="text-xs text-red-600">Las contraseñas no coinciden.</p>
        )}

        <div className="flex justify-end">
          <button
            onClick={() =>
              changePassword.mutate({
                currentPassword,
                newPassword,
              })
            }
            disabled={!isReady}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {changePassword.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
