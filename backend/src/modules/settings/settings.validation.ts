import { z } from 'zod';

const colorRegex = /^#([0-9a-fA-F]{3}){1,2}$/;
const colorSchema = z.string().regex(colorRegex, 'Invalid hex color format');

export const CompanyProfileSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  tagline: z.string().optional().nullable(),
  projectType: z.string().min(1, 'Project type is required'),
  logo: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  whatsapp: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')).nullable(),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  upiId: z.string().optional().nullable(),
  bankDetails: z.object({
    accountName: z.string().optional().default(''),
    accountNumber: z.string().optional().default(''),
    ifsc: z.string().optional().default(''),
    bankName: z.string().optional().default(''),
  }).optional().nullable(),
  paymentTerms: z.string().default('Due on Receipt'),
  invoiceNotes: z.string().optional().nullable(),
  primaryColor: colorSchema.default('#FAF9F6'),
  secondaryColor: colorSchema.default('#6F6A61'),
  accentColor: colorSchema.default('#B89452'),
  backgroundColor: colorSchema.default('#FAF9F6'),
  textColor: colorSchema.default('#1C1A17'),
  themePreset: z.string().default('light'),
  graphicsPreset: z.string().default('default'),
  typographyPreset: z.enum(['MODERN', 'ELEGANT', 'CLASSIC', 'EDITORIAL', 'MINIMAL']).default('CLASSIC'),
  portalConfig: z.object({
    clientPortal: z.boolean().default(true),
    staffPortal: z.boolean().default(true),
    publicBooking: z.boolean().default(true),
    productionWorkflow: z.boolean().default(true),
    revenueModule: z.boolean().default(true),
    marketingHub: z.boolean().default(true),
  }).optional().nullable(),
  isDefault: z.boolean().default(false),
});

export const GlobalSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string(),
  description: z.string().optional().nullable(),
});

export const BulkSettingsSchema = z.record(z.string());
