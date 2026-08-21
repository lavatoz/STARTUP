import { Request, Response, NextFunction } from 'express';
import '../../middleware/tenant';
import { prisma } from '../../config/database';
import { logAudit, extractReqMeta } from '../../services/audit.service';
import { AppError } from '../../middleware/error';
import { Role } from '@prisma/client';

/**
 * Get all company profiles (soft delete filtered)
 */
export async function getCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.userContext!.organizationId;

    const companies = await prisma.companyProfile.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json(companies.map(mapProfile));
  } catch (error) {
    next(error);
  }
}

/**
 * Save/Update company profile
 */
export async function saveCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user!;
    const meta = extractReqMeta(req);
    const orgId = req.userContext!.organizationId;
    const orgRole = req.userContext!.organizationRole;
    const isPlatformAdmin = 
      req.userContext!.platformRole === 'SUPER_ADMIN' || 
      req.userContext!.platformRole === 'PLATFORM_ADMIN' ||
      user.role === Role.SystemAdmin;

    // Enforce OWNER/ADMIN permission check (case-insensitive)
    const upperRole = orgRole?.toUpperCase();
    if (upperRole !== 'OWNER' && upperRole !== 'ADMIN' && !isPlatformAdmin) {
      throw new AppError('Only organization owners or administrators can modify company settings.', 403);
    }

    // Extract brand configurations
    const { 
      secondaryColor, 
      accentColor, 
      backgroundColor, 
      textColor, 
      favicon, 
      whatsapp, 
      ...rest 
    } = body;

    const previousPortalConfig = (body.portalConfig && typeof body.portalConfig === 'object') ? body.portalConfig : {};

    const portalConfig = {
      ...previousPortalConfig,
      secondaryColor: secondaryColor || '#6F6A61',
      accentColor: accentColor || '#B89452',
      backgroundColor: backgroundColor || '#FAF9F6',
      textColor: textColor || '#1C1A17',
      favicon: favicon || '',
      whatsapp: whatsapp || '',
    };

    const updateData = {
      ...rest,
      portalConfig
    };

    let company;

    if (id) {
      // Update
      const existing = await prisma.companyProfile.findFirst({
        where: { id, organizationId: orgId, deletedAt: null },
      });
      if (!existing) {
        throw new AppError('Company profile not found.', 404);
      }

      company = await prisma.companyProfile.update({
        where: { id, organizationId: orgId },
        data: updateData,
      });

      await logAudit({
        userId: user.id,
        organizationId: orgId,
        action: 'COMPANY_UPDATE',
        details: { companyId: company.id, companyName: company.companyName },
        ...meta,
      });
    } else {
      // Create
      company = await prisma.companyProfile.create({
        data: {
          ...updateData,
          organizationId: orgId,
        },
      });

      await logAudit({
        userId: user.id,
        organizationId: orgId,
        action: 'COMPANY_CREATE',
        details: { companyId: company.id, companyName: company.companyName },
        ...meta,
      });
    }

    // If marked as default, unset other defaults in the same organization
    if (body.isDefault) {
      await prisma.companyProfile.updateMany({
        where: { id: { not: company.id }, organizationId: orgId },
        data: { isDefault: false },
      });

      // Synchronize branding settings with main parent Organization
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          logoUrl: body.logo || null,
          faviconUrl: favicon || null,
          primaryColor: body.primaryColor || '#FAF9F6',
          secondaryColor: secondaryColor || '#6F6A61',
          accentColor: accentColor || '#B89452',
          phone: body.phone || null,
          whatsapp: whatsapp || null,
          address: body.address || null,
          website: body.website || null,
          contactEmail: body.email || null,
        }
      });
    }

    res.status(200).json(mapProfile(company));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete company profile (soft delete)
 */
export async function deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    const meta = extractReqMeta(req);
    const orgId = req.userContext!.organizationId;
    const orgRole = req.userContext!.organizationRole;
    const isPlatformAdmin = 
      req.userContext!.platformRole === 'SUPER_ADMIN' || 
      req.userContext!.platformRole === 'PLATFORM_ADMIN' ||
      user.role === Role.SystemAdmin;

    // Enforce OWNER/ADMIN permission check (case-insensitive)
    const upperRole = orgRole?.toUpperCase();
    if (upperRole !== 'OWNER' && upperRole !== 'ADMIN' && !isPlatformAdmin) {
      throw new AppError('Only organization owners or administrators can delete company profiles.', 403);
    }

    const company = await prisma.companyProfile.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!company) {
      throw new AppError('Company profile not found.', 404);
    }

    await prisma.companyProfile.update({
      where: { id, organizationId: orgId },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'COMPANY_DELETE',
      details: { companyId: id, companyName: company.companyName },
      ...meta,
    });

    res.status(200).json({ message: 'Company profile deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all global settings (Filters out sensitive passwords for non-admins)
 */
export async function getGlobalSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const settings = await prisma.globalSetting.findMany();

    const result: Record<string, string> = {};
    for (const setting of settings) {
      // Leakage protection: hide passwords if user is not SystemAdmin or Manager
      const isSensitive = setting.key.toLowerCase().includes('password') || setting.key.toLowerCase().includes('secret') || setting.key.toLowerCase().includes('key');
      const hasPermission = user.role === Role.SystemAdmin || user.role === Role.Manager;

      if (!isSensitive || hasPermission) {
        result[setting.key] = setting.value;
      }
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk save settings
 */
export async function saveGlobalSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Record<string, string>;
    const user = req.user!;
    const meta = extractReqMeta(req);

    // Enforce Admin/Manager
    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can update global settings.', 403);
    }

    const upsertPromises = Object.entries(body).map(([key, value]) => {
      return prisma.globalSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    });

    await Promise.all(upsertPromises);

    await logAudit({
      userId: user.id,
      action: 'SETTINGS_UPDATE',
      details: { keys: Object.keys(body) },
      ...meta,
    });

    res.status(200).json({ message: 'Settings saved successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single company profile by ID
 */
export async function getCompanyById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const orgId = req.userContext!.organizationId;

    const company = await prisma.companyProfile.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });

    if (!company) {
      throw new AppError('Company profile not found.', 404);
    }

    res.status(200).json(mapProfile(company));
  } catch (error) {
    next(error);
  }
}

/**
 * Utility to map sub-fields inside portalConfig to top-level properties
 */
function mapProfile(p: any) {
  if (!p) return p;
  const config = p.portalConfig && typeof p.portalConfig === 'object' ? (p.portalConfig as any) : {};
  return {
    ...p,
    secondaryColor: config.secondaryColor || '#6F6A61',
    accentColor: config.accentColor || '#B89452',
    backgroundColor: config.backgroundColor || '#FAF9F6',
    textColor: config.textColor || '#1C1A17',
    favicon: config.favicon || '',
    whatsapp: config.whatsapp || '',
  };
}
