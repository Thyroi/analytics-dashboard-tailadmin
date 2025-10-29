import type { FormActionsProps } from "./EditProfileModal.types";

export function FormActions({ onCancel, isPending }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-white/10">
      <button
        type="button"
        onClick={onCancel}
        disabled={isPending}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Guardando...
          </>
        ) : (
          "Guardar Cambios"
        )}
      </button>
    </div>
  );
}
