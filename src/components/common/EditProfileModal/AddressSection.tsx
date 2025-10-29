import type { FormData } from "./EditProfileModal.types";
import { FormSection } from "./FormSection";

type AddressSectionProps = {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const inputClassName =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white";

const labelClassName =
  "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300";

export function AddressSection({ formData, onChange }: AddressSectionProps) {
  return (
    <FormSection title="Dirección">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="country" className={labelClassName}>
            País
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={onChange}
            className={inputClassName}
            placeholder="España"
          />
        </div>
        <div>
          <label htmlFor="state" className={labelClassName}>
            Provincia/Estado
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={onChange}
            className={inputClassName}
            placeholder="Madrid"
          />
        </div>
        <div>
          <label htmlFor="city" className={labelClassName}>
            Ciudad
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={onChange}
            className={inputClassName}
            placeholder="Madrid"
          />
        </div>
        <div>
          <label htmlFor="postalCode" className={labelClassName}>
            Código Postal
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={onChange}
            className={inputClassName}
            placeholder="28001"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="taxId" className={labelClassName}>
            NIF/CIF
          </label>
          <input
            type="text"
            id="taxId"
            name="taxId"
            value={formData.taxId}
            onChange={onChange}
            className={inputClassName}
            placeholder="12345678A"
          />
        </div>
      </div>
    </FormSection>
  );
}
