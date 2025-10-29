"use client";

import Modal from "../Modal";
import { AddressSection } from "./AddressSection";
import type { EditProfileModalProps } from "./EditProfileModal.types";
import { FormActions } from "./FormActions";
import { PersonalInfoSection } from "./PersonalInfoSection";
import { SocialMediaSection } from "./SocialMediaSection";
import { useProfileForm } from "./useProfileForm";

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
}: EditProfileModalProps) {
  const { formData, handleChange, handleSubmit, isPending } = useProfileForm(
    user,
    onClose
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <PersonalInfoSection formData={formData} onChange={handleChange} />
        <AddressSection formData={formData} onChange={handleChange} />
        <SocialMediaSection formData={formData} onChange={handleChange} />
        <FormActions onCancel={onClose} isPending={isPending} />
      </form>
    </Modal>
  );
}
