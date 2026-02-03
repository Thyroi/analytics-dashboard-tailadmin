"use client";

import Modal from "@/components/common/Modal";

type DeleteUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userLabel: string;
  onConfirm: () => void;
  isPending?: boolean;
};

export default function DeleteUserModal({
  isOpen,
  onClose,
  userLabel,
  onConfirm,
  isPending = false,
}: DeleteUserModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar usuario" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿Deseas eliminar a{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {userLabel}
          </span>
          ?
        </p>

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
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
