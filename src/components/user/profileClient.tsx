"use client";

import EditProfileModal from "@/components/common/EditProfileModal";
import { trpc } from "@/lib/trpc/client";
import { useMemo, useState } from "react";
import ProfileAddress from "./ProfileAddress";
import ProfileHeader from "./ProfileHeader";
import ProfilePersonalInfo from "./ProfilePersonalInfo";
import ProfileSkeleton from "./ProfileSkeleton";
import ProfileSocialNetworks from "./ProfileSocialNetworks";
import { hasAnySocial, parseSocial, type Me } from "./types";

export default function ProfileClient() {
  const { data, isLoading, error } = trpc.user.me.useQuery(undefined, {
    staleTime: 30_000,
  });

  if (isLoading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-sm text-red-600">
            No se pudo cargar tu perfil: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-between">
          <div>
            <h2 className="card-title">No has iniciado sesión</h2>
            <p className="card-subtitle">
              Inicia sesión para ver y editar tu perfil.
            </p>
          </div>
          <a
            href="/auth/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  return <ProfileView me={data} />;
}

function ProfileView({ me }: { me: Me }) {
  const { email, profile } = me;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const socials = useMemo(
    () => parseSocial(profile?.social),
    [profile?.social]
  );

  return (
    <>
      <div className="space-y-6">
        <ProfileHeader me={me} onEditClick={() => setIsEditModalOpen(true)} />
        <ProfilePersonalInfo profile={profile} email={email} />
        <ProfileAddress profile={profile} />
        {hasAnySocial(socials) && <ProfileSocialNetworks socials={socials} />}
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={me}
      />
    </>
  );
}
