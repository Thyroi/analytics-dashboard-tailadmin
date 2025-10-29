import type { FormData } from "./EditProfileModal.types";
import { FormSection } from "./FormSection";

type SocialMediaSectionProps = {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const inputClassName =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white";

const labelClassName =
  "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300";

export function SocialMediaSection({
  formData,
  onChange,
}: SocialMediaSectionProps) {
  return (
    <FormSection title="Redes Sociales">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="linkedin" className={labelClassName}>
            LinkedIn
          </label>
          <input
            type="url"
            id="linkedin"
            name="linkedin"
            value={formData.linkedin}
            onChange={onChange}
            className={inputClassName}
            placeholder="https://linkedin.com/in/usuario"
          />
        </div>
        <div>
          <label htmlFor="facebook" className={labelClassName}>
            Facebook
          </label>
          <input
            type="url"
            id="facebook"
            name="facebook"
            value={formData.facebook}
            onChange={onChange}
            className={inputClassName}
            placeholder="https://facebook.com/usuario"
          />
        </div>
        <div>
          <label htmlFor="instagram" className={labelClassName}>
            Instagram
          </label>
          <input
            type="url"
            id="instagram"
            name="instagram"
            value={formData.instagram}
            onChange={onChange}
            className={inputClassName}
            placeholder="https://instagram.com/usuario"
          />
        </div>
        <div>
          <label htmlFor="x" className={labelClassName}>
            X (Twitter)
          </label>
          <input
            type="url"
            id="x"
            name="x"
            value={formData.x}
            onChange={onChange}
            className={inputClassName}
            placeholder="https://x.com/usuario"
          />
        </div>
      </div>
    </FormSection>
  );
}
