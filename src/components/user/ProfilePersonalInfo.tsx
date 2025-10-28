import Field from "./Field";
import type { Me } from "./types";

type ProfilePersonalInfoProps = {
  profile: Me["profile"];
  email: string | null;
};

export default function ProfilePersonalInfo({
  profile,
  email,
}: ProfilePersonalInfoProps) {
  return (
    <div className="card">
      <div className="card-header rounded-t-lg bg-huelva-primary">
        <h3 className="card-title font-semibold text-white">
          Información personal
        </h3>
      </div>
      <div className="card-body p-6">
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="First Name" value={profile?.firstName ?? undefined} />
          <Field label="Last Name" value={profile?.lastName ?? undefined} />
          <Field label="Email address" value={email ?? undefined} />
          <Field label="Phone" value={profile?.phone ?? undefined} />
          <Field label="Bio" value={profile?.bio ?? undefined} full />
        </dl>
      </div>
    </div>
  );
}
