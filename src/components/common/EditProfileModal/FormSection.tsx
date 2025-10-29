import type { FormSectionProps } from "./EditProfileModal.types";

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      {children}
    </div>
  );
}
