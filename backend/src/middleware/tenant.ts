import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from './error';
import { OrganizationRole, PlatformRole } from '@prisma/client';
import './auth';

declare global {
  namespace Express {
    interface Request {
      userContext?: {
        userId: string;
        organizationId: string;
        membershipId: string;
        organizationRole: OrganizationRole;
        platformRole: PlatformRole;
        permissions: string[];
        organizationName: string;
      };
    }
  }
}

/**
 * Middleware to resolve the tenant context for authenticated requests.
 * Ensures the user has a valid and active membership in the organization.
 */
export async function resolveTenantContext(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication is required.', 401);
    }

    // 1. Retrieve organization proposal from request headers
    const proposedSlug = req.headers['x-organization-slug'] as string;
    const proposedId = req.headers['x-organization-id'] as string;

    let membership = null;

    if (proposedId) {
      membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: proposedId,
            userId: req.user.id,
          },
        },
        include: { organization: true },
      });
      if (!membership) {
        throw new AppError('Active organization membership not found for the requested organization.', 403);
      }
    } else if (proposedSlug) {
      membership = await prisma.organizationMember.findFirst({
        where: {
          userId: req.user.id,
          organization: { slug: proposedSlug },
        },
        include: { organization: true },
      });
      if (!membership) {
        throw new AppError('Active organization membership not found for the requested organization.', 403);
      }
    }

    // 2. Fallback: retrieve the user's first active membership
    if (!membership) {
      membership = await prisma.organizationMember.findFirst({
        where: {
          userId: req.user.id,
          status: 'Active',
        },
        include: { organization: true },
      });
    }

    if (!membership) {
      throw new AppError('Active organization membership not found for this user.', 403);
    }

    if (membership.status !== 'Active') {
      throw new AppError('Your membership in this organization is not active.', 403);
    }

    // Check if the organization is suspended
    const activeSubscription = await prisma.subscription.findFirst({
      where: { organizationId: membership.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSubscription && activeSubscription.status === 'SUSPENDED') {
      throw new AppError('This organization is suspended.', 403);
    }

    // 3. Inject resolved context
    req.userContext = {
      userId: req.user.id,
      organizationId: membership.organizationId,
      membershipId: membership.id,
      organizationRole: membership.role,
      platformRole: (req.user.platformRole as PlatformRole) || PlatformRole.USER,
      permissions: [],
      organizationName: membership.organization.name,
    };

    // Keep req.user back-compat keys populated
    req.user.organizationId = membership.organizationId;
    req.user.membershipId = membership.id;

    next();
  } catch (error) {
    next(error);
  }
}
