import { PrismaClient, Role, OrganizationRole, PlatformRole, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting APCO multi-tenant data backfill...');

  const defaultOrgId = 'de305d54-75b4-431b-adb2-eb6b9e546014';

  // 1. Resolve Company Profile to name the default Organization
  const companyProfile = await prisma.companyProfile.findFirst({
    where: { isDefault: true }
  }) || await prisma.companyProfile.findFirst();

  const orgName = companyProfile?.companyName || 'Artisans Production Company';
  const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'artisans';

  console.log(`Setting up organization name: "${orgName}", slug: "${orgSlug}"`);

  // 2. Upsert the default Organization
  const org = await prisma.organization.upsert({
    where: { id: defaultOrgId },
    update: {
      name: orgName,
      slug: orgSlug,
      phone: companyProfile?.phone || null,
      contactEmail: companyProfile?.email || null,
      address: companyProfile?.address || null,
      website: companyProfile?.website || null,
      primaryColor: companyProfile?.primaryColor || '#F7F5F0',
    },
    create: {
      id: defaultOrgId,
      name: orgName,
      slug: orgSlug,
      phone: companyProfile?.phone || null,
      contactEmail: companyProfile?.email || null,
      address: companyProfile?.address || null,
      website: companyProfile?.website || null,
      primaryColor: companyProfile?.primaryColor || '#F7F5F0',
    }
  });

  // 3. Set up a default Enterprise Plan
  const planName = 'ENTERPRISE';
  const plan = await prisma.plan.upsert({
    where: { name: planName },
    update: {},
    create: {
      name: planName,
      description: 'Enterprise level plan with all features enabled.',
      price: 199.00,
      interval: 'month',
      features: [
        'Client Management', 'Projects', 'Events', 'Tasks', 'Team', 'Quotations',
        'Invoices', 'Agreements', 'Digital Signatures', 'Documents', 'Gallery',
        'Reports', 'WhatsApp', 'Advanced Branding', 'Custom Domain', 'API Access'
      ],
      limits: {
        maxUsers: 100,
        maxStorageGb: 1000,
        maxClients: 10000,
        maxProjects: 10000
      }
    }
  });

  // 4. Set up an active Subscription for the organization
  const subEndDate = new Date();
  subEndDate.setFullYear(subEndDate.getFullYear() + 10); // Active for 10 years

  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      currentPeriodStart: new Date(),
      currentPeriodEnd: subEndDate,
    }
  });

  // 5. Backfill Users, Roles, and Memberships
  const users = await prisma.user.findMany();
  console.log(`Processing ${users.length} user records...`);

  for (const user of users) {
    let orgRole: OrganizationRole = OrganizationRole.STAFF;
    let platRole: PlatformRole = PlatformRole.USER;

    // Map existing User Roles to new Tenancy/Platform Roles
    if (user.role === Role.SystemAdmin) {
      orgRole = OrganizationRole.OWNER;
      platRole = PlatformRole.SUPER_ADMIN;
    } else if (user.role === Role.Manager) {
      orgRole = OrganizationRole.MANAGER;
    } else if (user.role === Role.Client) {
      orgRole = OrganizationRole.CLIENT;
    }

    // Update Platform Role on User
    await prisma.user.update({
      where: { id: user.id },
      data: { platformRole: platRole }
    });

    // Create Organization Membership
    const membership = await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id
        }
      },
      update: { role: orgRole },
      create: {
        organizationId: org.id,
        userId: user.id,
        role: orgRole,
        status: 'Active'
      }
    });

    // Backfill user sessions and refresh tokens to this membership
    await prisma.userSession.updateMany({
      where: { userId: user.id, membershipId: null },
      data: { membershipId: membership.id }
    });

    await prisma.refreshToken.updateMany({
      where: { userId: user.id, membershipId: null },
      data: { membershipId: membership.id }
    });
  }

  // 6. Bulk backfill business models with organizationId
  const modelsToBackfill = [
    'client',
    'project',
    'event',
    'task',
    'invoice',
    'quotation',
    'agreement',
    'payment',
    'file',
    'workflowEvent',
    'notification',
    'auditLog',
    'securityEvent',
    'companyProfile',
    'expense',
    'approval',
    'personnel',
    'agreementTemplate',
    'standaloneAgreementTemplate',
    'standaloneAgreement',
    'websiteGallery',
    'division',
    'documentRegistry',
    'galleryCollection'
  ];

  for (const modelKey of modelsToBackfill) {
    const client = prisma as any;
    if (client[modelKey] && client[modelKey].updateMany) {
      const result = await client[modelKey].updateMany({
        where: { organizationId: null },
        data: { organizationId: org.id }
      });
      console.log(`Backfilled ${result.count} records in table "${modelKey}"`);
    } else {
      console.warn(`Could not backfill table "${modelKey}": model or updateMany not found`);
    }
  }

  console.log('🎉 Data backfill completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Data backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
