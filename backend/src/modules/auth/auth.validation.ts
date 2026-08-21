import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(1, 'Password is required.'),
});

export const mfaLoginVerifySchema = z.object({
  tempToken: z.string().min(1, 'Temporary authentication token is required.'),
  code: z.string().min(6, 'MFA Code must be 6 digits.').max(6),
});

export const mfaVerifySchema = z.object({
  code: z.string().min(6, 'MFA Code must be 6 digits.').max(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string()
    .min(12, 'New password must be at least 12 characters long.')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'New password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'New password must contain at least one special character.'),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address format.'),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required.'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
});

export const emailVerificationConfirmSchema = z.object({
  token: z.string().min(1, 'Verification token is required.'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address format.'),
});

export const activateClientSchema = z.object({
  token: z.string().min(1, 'Token is required.'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.'),
  firstName: z.string().min(1, 'First name is required.').max(100),
  lastName: z.string().min(1, 'Last name is required.').max(100),
});

export const onboardSchema = z.object({
  name: z.string().min(2, 'Studio name must be at least 2 characters.').max(100),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters.')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  timezone: z.string().min(1, 'Timezone is required.'),
  currency: z.string().min(1, 'Currency is required.').max(3),
  businessDesc: z.string().optional().nullable(),
  contactEmail: z.string().email('Invalid email address format.').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL format.').optional().nullable().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be #RRGGBB).'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be #RRGGBB).'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (must be #RRGGBB).'),
  themePreset: z.string().default('light'),
  logoUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
});

