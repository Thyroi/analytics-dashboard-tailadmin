import type { FormData, Me } from "./EditProfileModal.types";

/**
 * Initialize form data from user profile
 */
export function initializeFormData(user: Me): FormData {
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
}

/**
 * Transform form data to mutation payload
 */
export function transformToMutationPayload(formData: FormData) {
  return {
    firstName: formData.firstName || null,
    lastName: formData.lastName || null,
    phone: formData.phone || null,
    bio: formData.bio || null,
    country: formData.country || null,
    state: formData.state || null,
    city: formData.city || null,
    postalCode: formData.postalCode || null,
    taxId: formData.taxId || null,
    social: {
      linkedin: formData.linkedin || null,
      facebook: formData.facebook || null,
      instagram: formData.instagram || null,
      x: formData.x || null,
    },
  };
}
