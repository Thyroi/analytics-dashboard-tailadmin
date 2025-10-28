import Field from "./Field";
import type { Me } from "./types";

type ProfileAddressProps = {
  profile: Me["profile"];
};

export default function ProfileAddress({ profile }: ProfileAddressProps) {
  return (
    <div className="card">
      <div className="card-header rounded-t-lg bg-huelva-primary">
        <h3 className="card-title font-semibold text-white">Address</h3>
      </div>
      <div className="card-body p-6">
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="Country" value={profile?.country ?? undefined} />
          <Field
            label="City/State"
            value={
              [profile?.city, profile?.state].filter(Boolean).join(", ") ||
              undefined
            }
          />
          <Field label="Postal Code" value={profile?.postalCode ?? undefined} />
          <Field label="TAX ID" value={profile?.taxId ?? undefined} />
        </dl>
      </div>
    </div>
  );
}
