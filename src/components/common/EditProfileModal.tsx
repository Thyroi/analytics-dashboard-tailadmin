"use client";

import { useToast } from "@/hooks/useToast";
import { trpc } from "@/lib/trpc/client";
import type { AppRouter } from "@/server/trpc/";
import type { inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import Modal from "./Modal";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Me = NonNullable<RouterOutputs["user"]["me"]>;

type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: Me;
};

type FormData = {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  taxId: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  x: string;
};

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
}: EditProfileModalProps) {
  const utils = trpc.useUtils();
  const toast = useToast();

  const updateMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      // Invalidar la caché para refrescar los datos
      utils.user.me.invalidate();
      toast.success("Perfil actualizado correctamente");
      onClose();
    },
    onError: (error) => {
      toast.error(`Error al actualizar el perfil: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState<FormData>(() => {
    const social =
      typeof user.profile?.social === "object" && user.profile?.social !== null
        ? user.profile.social
        : {};

    return {
      firstName: user.profile?.firstName ?? "",
      lastName: user.profile?.lastName ?? "",
      phone: user.profile?.phone ?? "",
      bio: user.profile?.bio ?? "",
      country: user.profile?.country ?? "",
      state: user.profile?.state ?? "",
      city: user.profile?.city ?? "",
      postalCode: user.profile?.postalCode ?? "",
      taxId: user.profile?.taxId ?? "",
      linkedin: (social as Record<string, string>).linkedin ?? "",
      facebook: (social as Record<string, string>).facebook ?? "",
      instagram: (social as Record<string, string>).instagram ?? "",
      x: (social as Record<string, string>).x ?? "",
    };
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Preparar el objeto social
    const social = {
      linkedin: formData.linkedin || null,
      facebook: formData.facebook || null,
      instagram: formData.instagram || null,
      x: formData.x || null,
    };

    // Enviar la actualización
    updateMutation.mutate({
      firstName: formData.firstName || null,
      lastName: formData.lastName || null,
      phone: formData.phone || null,
      bio: formData.bio || null,
      country: formData.country || null,
      state: formData.state || null,
      city: formData.city || null,
      postalCode: formData.postalCode || null,
      taxId: formData.taxId || null,
      social,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información personal */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Información Personal
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nombre
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="Juan"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Apellido
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="Pérez"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="+34 123 456 789"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Biografía
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="Cuéntanos sobre ti..."
              />
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Dirección
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="country"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                País
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="España"
              />
            </div>
            <div>
              <label
                htmlFor="state"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Provincia/Estado
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="Madrid"
              />
            </div>
            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Ciudad
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="Madrid"
              />
            </div>
            <div>
              <label
                htmlFor="postalCode"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Código Postal
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="28001"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="taxId"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                NIF/CIF
              </label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="12345678A"
              />
            </div>
          </div>
        </div>

        {/* Redes sociales */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Redes Sociales
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="linkedin"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                LinkedIn
              </label>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="https://linkedin.com/in/usuario"
              />
            </div>
            <div>
              <label
                htmlFor="facebook"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Facebook
              </label>
              <input
                type="url"
                id="facebook"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="https://facebook.com/usuario"
              />
            </div>
            <div>
              <label
                htmlFor="instagram"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Instagram
              </label>
              <input
                type="url"
                id="instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="https://instagram.com/usuario"
              />
            </div>
            <div>
              <label
                htmlFor="x"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                X (Twitter)
              </label>
              <input
                type="url"
                id="x"
                name="x"
                value={formData.x}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder="https://x.com/usuario"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
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
      </form>
    </Modal>
  );
}
