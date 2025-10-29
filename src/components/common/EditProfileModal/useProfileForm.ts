import { useToast } from "@/hooks/useToast";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import type { FormData, Me } from "./EditProfileModal.types";
import { initializeFormData, transformToMutationPayload } from "./formUtils";

export function useProfileForm(user: Me, onClose: () => void) {
  const utils = trpc.useUtils();
  const toast = useToast();

  const updateMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
      toast.success("Perfil actualizado correctamente");
      onClose();
    },
    onError: (error) => {
      toast.error(`Error al actualizar el perfil: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState<FormData>(() =>
    initializeFormData(user)
  );

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
    const payload = transformToMutationPayload(formData);
    updateMutation.mutate(payload);
  };

  return {
    formData,
    handleChange,
    handleSubmit,
    isPending: updateMutation.isPending,
  };
}
