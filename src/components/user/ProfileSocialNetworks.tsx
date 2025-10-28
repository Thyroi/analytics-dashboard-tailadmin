import Field from "./Field";
import type { Social } from "./types";

type ProfileSocialNetworksProps = {
  socials: Social | null;
};

export default function ProfileSocialNetworks({
  socials,
}: ProfileSocialNetworksProps) {
  return (
    <div className="card">
      <div className="card-header rounded-t-lg bg-huelva-primary">
        <h3 className="card-title font-semibold text-white">Redes sociales</h3>
      </div>
      <div className="card-body p-6">
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="LinkedIn" value={socials?.linkedin ?? undefined} />
          <Field label="Facebook" value={socials?.facebook ?? undefined} />
          <Field label="Instagram" value={socials?.instagram ?? undefined} />
          <Field label="X (Twitter)" value={socials?.x ?? undefined} />
        </dl>
      </div>
    </div>
  );
}
