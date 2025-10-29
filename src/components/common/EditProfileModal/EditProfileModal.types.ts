import type { AppRouter } from "@/server/trpc/";
import type { inferRouterOutputs } from "@trpc/server";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type Me = NonNullable<RouterOutputs["user"]["me"]>;

export type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: Me;
};

export type FormData = {
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

export type FormSectionProps = {
  title: string;
  children: React.ReactNode;
};

export type FormActionsProps = {
  onCancel: () => void;
  isPending: boolean;
};
