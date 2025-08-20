// server/trpc/schemas/user.ts
import { z } from "zod";

/** Social (urls o null) */
export const SocialSchema = z.object({
  linkedin: z.string().url().nullable().optional(),
  x: z.string().url().nullable().optional(),
  instagram: z.string().url().nullable().optional(),
  facebook: z.string().url().nullable().optional(),
});
export type Social = z.infer<typeof SocialSchema>;

/** Profile (OUTPUT / lectura) */
export const ProfileSchema = z.object({
  userId: z.string().optional(),
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
  social: SocialSchema.nullable().optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

/** Profile UPDATE INPUT (sin userId) */
export const UpdateProfileSchema = z.object({
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  taxId: z.string().max(50).nullable().optional(),
  // importante: permitir undefined (no tocar), objeto, o null
  social: SocialSchema.nullable().optional(),
});

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
});

export const UserRoleSchema = z.object({
  userId: z.string(),
  roleId: z.number(),
  assignedAt: z.date(),
  role: RoleSchema,
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  auth0Sub: z.string(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  profile: ProfileSchema.nullable(),
  roles: z.array(UserRoleSchema),
});

export type User = z.infer<typeof UserSchema>;

