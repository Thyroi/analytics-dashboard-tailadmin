import type { FormData } from "./EditProfileModal.types";
import { FormSection } from "./FormSection";

type PersonalInfoSectionProps = {
  formData: FormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
};

const inputClassName =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white";

const labelClassName =
  "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300";

export function PersonalInfoSection({
  formData,
  onChange,
}: PersonalInfoSectionProps) {
  return (
    <FormSection title="Información Personal">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClassName}>
            Nombre
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={onChange}
            className={inputClassName}
            placeholder="Juan"
          />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClassName}>
            Apellido
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={onChange}
            className={inputClassName}
            placeholder="Pérez"
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClassName}>
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            className={inputClassName}
            placeholder="+34 123 456 789"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bio" className={labelClassName}>
            Biografía
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={onChange}
            rows={3}
            className={inputClassName}
            placeholder="Cuéntanos sobre ti..."
          />
        </div>
      </div>
    </FormSection>
  );
}
