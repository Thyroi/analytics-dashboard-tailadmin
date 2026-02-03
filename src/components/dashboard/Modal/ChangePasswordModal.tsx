"use client";

import Modal from "@/components/common/Modal";
import { useToast } from "@/hooks/useToast";
import { trpc } from "@/lib/trpc/client";
import { useEffect, useState } from "react";

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen]);

  const changePassword = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Contraseña actualizada correctamente");
      onClose();
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar contraseña"
      size="sm"
    >
      <div className="space-y-4">
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

        {!passwordsMatch && confirmPassword && (
          <p className="text-xs text-red-600">Las contraseñas no coinciden.</p>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={changePassword.isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() =>
              changePassword.mutate({ currentPassword, newPassword })
            }
            disabled={!isReady}
            className="inline-flex items-center rounded-lg bg-huelva-primary px-4 py-2 text-sm font-medium text-white hover:bg-huelva-dark disabled:opacity-50"
          >
            {changePassword.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
