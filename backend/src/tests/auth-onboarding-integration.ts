import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { Role, OrganizationRole } from '@prisma/client';
import { resolveTenantContext } from '../middleware/tenant';
import { 
  register, 
  onboard, 
  getMemberships, 
  confirmEmailVerification,
  requestPasswordReset,
  confirmPasswordReset
} from '../modules/auth/auth.controller';
import { hashToken } from '../utils/jwt';

// Request/Response mocking helper
function mockRequestResponse(options: {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  user?: any;
  userContext?: any;
}) {
  const req = {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: {
      'user-agent': 'TestRunner/1.0',
      ...options.headers,
    },
    ip: '127.0.0.1',
    requestId: 'test-auth-corr-id',
    user: options.user,
    userContext: options.userContext,
  } as unknown as Request;

  let statusCode = 200;
  let responseData: any = null;
  let nextError: any = null;
  let redirectedUrl: string | null = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      responseData = data;
      return this;
    },
    setHeader(_name: string, _value: string) {
      return this;
    },
    redirect(url: string) {
      redirectedUrl = url;
      return this;
    },
    send(content: string) {
      responseData = content;
      return this;
    }
  } as unknown as Response;

  const next = (err?: any) => {
    nextError = err;
  };

  return {
    req,
    res,
    next,
    results() {
      return { statusCode, responseData, nextError, redirectedUrl };
    }
  };
}

async function runTests() {
  console.log('🧪 Starting Auth & Onboarding Integration Tests...\n');

  let passed = 0;
  let failed = 0;

  async function testCase(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`   ✅ [PASSED] ${name}`);
      passed++;
    } catch (err: any) {
      console.log(`   ❌ [FAILED] ${name}`);
      console.error(`      Reason: ${err.message || err}`);
      if (err.stack) {
        console.error(err.stack.split('\n').slice(0, 3).join('\n'));
      }
      failed++;
    }
  }

  // Clear test DB state for clean run
  const testEmail1 = 'test-owner-1@studio.com';
  const testEmail2 = 'test-owner-2@studio.com';
  
  await prisma.organizationMember.deleteMany({
    where: { user: { email: { in: [testEmail1, testEmail2] } } }
  });
  await prisma.companyProfile.deleteMany({
    where: { organization: { slug: { in: ['studio-test-1', 'studio-test-2', 'studio-test-3'] } } }
  });
  await prisma.subscription.deleteMany({
    where: { organization: { slug: { in: ['studio-test-1', 'studio-test-2', 'studio-test-3'] } } }
  });
  await prisma.documentCounter.deleteMany({
    where: { organization: { slug: { in: ['studio-test-1', 'studio-test-2', 'studio-test-3'] } } }
  });
  await prisma.agreementTemplate.deleteMany({
    where: { organization: { slug: { in: ['studio-test-1', 'studio-test-2', 'studio-test-3'] } } }
  });
  await prisma.organization.deleteMany({
    where: { slug: { in: ['studio-test-1', 'studio-test-2', 'studio-test-3'] } }
  });
  await prisma.user.deleteMany({
    where: { email: { in: [testEmail1, testEmail2] } }
  });
  await prisma.organization.upsert({
    where: { id: 'de305d54-75b4-431b-adb2-eb6b9e546014' },
    update: {},
    create: {
      id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
      name: 'Default System Organization',
      slug: 'default-system-org',
      currency: 'USD',
      timezone: 'UTC'
    }
  });

  // 1. User Registration

  await testCase('User Registration Flow', async () => {
    const { req, res, next, results } = mockRequestResponse({
      body: {
        email: testEmail1,
        password: 'Password1234!',
        firstName: 'John',
        lastName: 'Doe'
      }
    });

    await register(req, res, next);
    const result = results();

    if (result.nextError) {
      throw new Error(`Registration failed: ${result.nextError.message}`);
    }

    if (result.statusCode !== 201) {
      throw new Error(`Expected status 201, got ${result.statusCode}`);
    }

    // Lookup user in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail1 }
    });

    if (!dbUser) {
      throw new Error('User was not created in the database.');
    }

    if (dbUser.emailVerified !== false) {
      throw new Error('User emailVerified should be false by default.');
    }

    if (dbUser.platformRole !== 'USER') {
      throw new Error(`User platformRole should be USER, got ${dbUser.platformRole}`);
    }

    if (!dbUser.verificationToken) {
      throw new Error('Verification token hash not stored in database.');
    }
  });

  // 2. Duplicate Account Prevention
  await testCase('Duplicate Registration Prevention', async () => {
    const { req, res, next, results } = mockRequestResponse({
      body: {
        email: testEmail1,
        password: 'Password1234!',
        firstName: 'John',
        lastName: 'Doe'
      }
    });

    await register(req, res, next);
    const result = results();

    if (!result.nextError || result.nextError.statusCode !== 400) {
      throw new Error('Expected duplicate email to throw 400 error.');
    }
  });

  // 3. Email Verification
  await testCase('Email Verification with Valid Token', async () => {
    // Read user token hash from DB and get a valid match
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail1 } });
    
    // Construct valid request using a mock token hash bypass for local test validation
    const rawToken = 'valid_test_token_string';
    const tokenHash = hashToken(rawToken);

    await prisma.user.update({
      where: { id: dbUser!.id },
      data: { verificationToken: tokenHash }
    });

    const { req, res, next, results } = mockRequestResponse({
      query: { token: rawToken }
    });

    await confirmEmailVerification(req, res, next);
    const result = results();

    if (result.nextError) {
      throw new Error(`Verification failed: ${result.nextError.message}`);
    }

    const updatedUser = await prisma.user.findUnique({ where: { id: dbUser!.id } });
    if (!updatedUser || updatedUser.emailVerified !== true) {
      throw new Error('User emailVerified should be true after successful confirmation.');
    }

    if (updatedUser.verificationToken !== null) {
      throw new Error('Verification token should be cleared after use.');
    }
  });

  // 4. Invalid token verification
  await testCase('Email Verification with Invalid Token', async () => {
    const { req, res, next, results } = mockRequestResponse({
      query: { token: 'invalid_token' }
    });

    await confirmEmailVerification(req, res, next);
    const result = results();

    // Verification redirect error page check
    if (result.responseData && result.responseData.includes('Verification Failed')) {
      // Pass
    } else if (result.statusCode === 400) {
      // Pass
    } else {
      throw new Error('Expected invalid token to fail.');
    }
  });

  // 5. Onboarding & Seeding Verification
  let org1Id = '';
  await testCase('Organization Onboarding & Seeding', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail1 } });

    const { req, res, next, results } = mockRequestResponse({
      user,
      body: {
        name: 'Studio Test 1',
        slug: 'studio-test-1',
        timezone: 'America/New_York',
        currency: 'USD',
        primaryColor: '#F7F5F0',
        secondaryColor: '#77736B',
        accentColor: '#B89452',
        themePreset: 'light'
      }
    });

    await onboard(req, res, next);
    const result = results();

    if (result.nextError) {
      throw new Error(`Onboarding failed: ${result.nextError.message}`);
    }

    if (result.statusCode !== 201) {
      throw new Error(`Expected status 201, got ${result.statusCode}`);
    }

    const org = result.responseData.organization;
    org1Id = org.id;

    // Verify Organization details in DB
    const dbOrg = await prisma.organization.findUnique({ where: { id: org.id } });
    if (!dbOrg || dbOrg.slug !== 'studio-test-1') {
      throw new Error('Organization not created properly in DB.');
    }

    // Verify OrganizationMember Owner in DB
    const dbMember = await prisma.organizationMember.findFirst({
      where: { organizationId: org.id, userId: user!.id }
    });
    if (!dbMember || dbMember.role !== 'OWNER' || dbMember.status !== 'Active') {
      throw new Error('Owner membership not set correctly.');
    }

    // Verify TRIAL subscription
    const dbSub = await prisma.subscription.findFirst({
      where: { organizationId: org.id }
    });
    if (!dbSub || dbSub.status !== 'TRIAL') {
      throw new Error(`Subscription should be TRIAL, got ${dbSub?.status}`);
    }

    // Verify CompanyProfile
    const dbProfile = await prisma.companyProfile.findFirst({
      where: { organizationId: org.id }
    });
    if (!dbProfile || dbProfile.companyName !== 'Studio Test 1') {
      throw new Error('Company Profile not seeded.');
    }

    // Verify document counters
    const counters = await prisma.documentCounter.findMany({
      where: { organizationId: org.id }
    });
    if (counters.length < 3) {
      throw new Error(`Expected at least 3 seeded document counters, got ${counters.length}`);
    }
  });

  // 6. Reserved Slugs Gate
  await testCase('Onboarding Reserved Slugs Gate', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail1 } });

    const { req, res, next, results } = mockRequestResponse({
      user,
      body: {
        name: 'Admin Area',
        slug: 'admin',
        timezone: 'America/New_York',
        currency: 'USD',
        primaryColor: '#F7F5F0',
        secondaryColor: '#77736B',
        accentColor: '#B89452',
        themePreset: 'light'
      }
    });

    await onboard(req, res, next);
    const result = results();

    if (!result.nextError || result.nextError.statusCode !== 400) {
      throw new Error('Expected reserved slug (admin) to fail onboarding.');
    }
  });

  // 7. Duplicate Slug Verification
  await testCase('Onboarding Duplicate Slug Block', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail1 } });

    const { req, res, next, results } = mockRequestResponse({
      user,
      body: {
        name: 'Another Studio Test 1',
        slug: 'studio-test-1',
        timezone: 'America/New_York',
        currency: 'USD',
        primaryColor: '#F7F5F0',
        secondaryColor: '#77736B',
        accentColor: '#B89452',
        themePreset: 'light'
      }
    });

    await onboard(req, res, next);
    const result = results();

    if (!result.nextError || result.nextError.statusCode !== 400) {
      throw new Error('Expected duplicate slug to fail onboarding.');
    }
  });

  // 8. Organization limit (max 5)
  await testCase('Onboarding Organization Limit Enforcement', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail1 } });

    // Seed 4 more organizations to reach 5 total
    for (let i = 2; i <= 5; i++) {
      await prisma.organization.create({
        data: {
          name: `Studio Test ${i}`,
          slug: `studio-test-${i}`,
          currency: 'USD',
          timezone: 'UTC',
          members: {
            create: {
              userId: user!.id,
              role: OrganizationRole.OWNER,
              status: 'Active'
            }
          }
        }
      });
    }

    // Try onboarding 6th organization
    const { req, res, next, results } = mockRequestResponse({
      user,
      body: {
        name: 'Studio Test 6',
        slug: 'studio-test-6',
        timezone: 'UTC',
        currency: 'USD',
        primaryColor: '#F7F5F0',
        secondaryColor: '#77736B',
        accentColor: '#B89452',
        themePreset: 'light'
      }
    });

    await onboard(req, res, next);
    const result = results();

    if (!result.nextError || result.nextError.statusCode !== 400) {
      throw new Error('Expected 6th organization onboarding to be blocked.');
    }

    // Cleanup extra seeded orgs for subsequent tests
    await prisma.organizationMember.deleteMany({
      where: { userId: user!.id, organization: { slug: { in: ['studio-test-2', 'studio-test-3', 'studio-test-4', 'studio-test-5'] } } }
    });
    await prisma.organization.deleteMany({
      where: { slug: { in: ['studio-test-2', 'studio-test-3', 'studio-test-4', 'studio-test-5'] } }
    });
  });

  // 9. Memberships retrieval
  await testCase('Memberships Retrieval Flow', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail1 } });

    const { req, res, next, results } = mockRequestResponse({ user });

    await getMemberships(req, res, next);
    const result = results();

    if (result.nextError) {
      throw new Error(`getMemberships failed: ${result.nextError.message}`);
    }

    const orgs = result.responseData;
    if (orgs.length !== 1 || orgs[0].id !== org1Id) {
      throw new Error('getMemberships did not return correct user active memberships.');
    }
  });

  // 10. Tenant switching & Security boundaries
  let user2Id = '';
  let org2Id = '';

  await testCase('Tenant Boundary Security Isolation', async () => {
    // 1. Create User 2
    const passwordHash = 'dummyHashVal';
    const user2 = await prisma.user.create({
      data: {
        email: testEmail2,
        passwordHash,
        firstName: 'Jane',
        lastName: 'Doe',
        role: Role.Manager,
        platformRole: 'USER',
        emailVerified: true,
        status: 'Active'
      }
    });
    user2Id = user2.id;

    // 2. Create Org 2 belonging to User 2
    const org2 = await prisma.organization.create({
      data: {
        name: 'Studio Test 2',
        slug: 'studio-test-2',
        currency: 'USD',
        timezone: 'UTC',
        members: {
          create: {
            userId: user2Id,
            role: OrganizationRole.OWNER,
            status: 'Active'
          }
        }
      }
    });
    org2Id = org2.id;

    // 3. User 1 tries to access Org 2 using header variables
    const user1 = await prisma.user.findUnique({ where: { email: testEmail1 } });
    
    // Case A: using x-organization-id header
    const { req: reqA, res: resA, next: nextA, results: resultsA } = mockRequestResponse({
      user: user1,
      headers: {
        'x-organization-id': org2Id
      }
    });

    await resolveTenantContext(reqA, resA, nextA);
    const resultA = resultsA();

    if (!resultA.nextError || resultA.nextError.statusCode !== 403) {
      throw new Error('Expected User 1 requesting Org 2 id to throw 403 context error.');
    }

    // Case B: using x-organization-slug header
    const { req: reqB, res: resB, next: nextB, results: resultsB } = mockRequestResponse({
      user: user1,
      headers: {
        'x-organization-slug': 'studio-test-2'
      }
    });

    await resolveTenantContext(reqB, resB, nextB);
    const resultB = resultsB();

    if (!resultB.nextError || resultB.nextError.statusCode !== 403) {
      throw new Error('Expected User 1 requesting Org 2 slug to throw 403 context error.');
    }
  });

  // 11. Explicit Security Regression: Cross-tenant Spoofing Rejection
  await testCase('Explicit Security Regression: Cross-tenant Spoofing Rejection', async () => {
    const userA = await prisma.user.findUnique({ where: { email: testEmail1 } });
    
    const membershipA = await prisma.organizationMember.findFirst({
      where: { userId: userA!.id, organizationId: org1Id }
    });
    if (!membershipA) {
      throw new Error('Precondition failed: User does not belong to Org A.');
    }

    const { req, res, next, results } = mockRequestResponse({
      user: userA,
      headers: {
        'x-organization-id': org2Id
      }
    });

    await resolveTenantContext(req, res, next);
    const result = results();

    if (!result.nextError) {
      throw new Error('Expected backend middleware to reject spoofed request.');
    }

    if (result.nextError.statusCode !== 403) {
      throw new Error(`Expected status 403 Forbidden, got ${result.nextError.statusCode}`);
    }

    if (req.userContext) {
      throw new Error('Request context should not be populated with Org B details.');
    }
  });

  // 12. Password Reset Flow & Session Revocation
  await testCase('Password Reset & Session Invalidation', async () => {
    const user = await prisma.user.findUnique({ where: { email: testEmail1 } });

    // Seed mock refresh token and active session
    await prisma.refreshToken.create({
      data: {
        userId: user!.id,
        tokenHash: hashToken('mock-refresh-token-session'),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isRevoked: false
      }
    });

    await prisma.userSession.create({
      data: {
        userId: user!.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Test'
      }
    });

    // Request reset
    const { req: reqReq, res: resReq, next: nextReq, results: resultsReq } = mockRequestResponse({
      body: { email: testEmail1 }
    });

    await requestPasswordReset(reqReq, resReq, nextReq);
    const resultReq = resultsReq();

    if (resultReq.nextError) {
      throw new Error(`Password reset request failed: ${resultReq.nextError.message}`);
    }

    const updatedUser = await prisma.user.findUnique({ where: { id: user!.id } });
    if (!updatedUser?.resetToken) {
      throw new Error('Reset token hash not stored in database.');
    }

    // Confirm password reset
    // Fetch valid token string from DB bypass hash bypass
    const rawResetToken = 'valid_password_reset_token_string';
    const resetTokenHash = hashToken(rawResetToken);

    await prisma.user.update({
      where: { id: user!.id },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    const { req: reqConf, res: resConf, next: nextConf, results: resultsConf } = mockRequestResponse({
      body: {
        token: rawResetToken,
        newPassword: 'NewSecurePassword123!'
      }
    });

    await confirmPasswordReset(reqConf, resConf, nextConf);
    const resultConf = resultsConf();

    if (resultConf.nextError) {
      throw new Error(`Password reset confirm failed: ${resultConf.nextError.message}`);
    }

    // Check that session is deleted and refresh token is revoked
    const dbSession = await prisma.userSession.findFirst({
      where: { userId: user!.id }
    });
    if (dbSession) {
      throw new Error('User session was not deleted upon password reset.');
    }

    const dbRefreshToken = await prisma.refreshToken.findFirst({
      where: { userId: user!.id, tokenHash: hashToken('mock-refresh-token-session') }
    });
    if (!dbRefreshToken || dbRefreshToken.isRevoked !== true) {
      throw new Error('Refresh tokens were not revoked upon password reset.');
    }
  });

  // Cleanup DB state
  await prisma.organizationMember.deleteMany({
    where: { user: { email: { in: [testEmail1, testEmail2] } } }
  });
  await prisma.companyProfile.deleteMany({
    where: { organization: { slug: { in: ['studio-test-1', 'studio-test-2', 'studio-test-3'] } } }
  });
  await prisma.subscription.deleteMany({
    where: { organization: { slug: { in: ['studio-test-1', 'studio-test-2', 'studio-test-3'] } } }
  });
  await prisma.documentCounter.deleteMany({
    where: { organization: { slug: { in: ['studio-test-1', 'studio-test-2', 'studio-test-3'] } } }
  });
  await prisma.agreementTemplate.deleteMany({
    where: { organization: { slug: { in: ['studio-test-1', 'studio-test-2', 'studio-test-3'] } } }
  });
  await prisma.organization.deleteMany({
    where: { slug: { in: ['studio-test-1', 'studio-test-2', 'studio-test-3'] } }
  });
  await prisma.user.deleteMany({
    where: { email: { in: [testEmail1, testEmail2] } }
  });

  console.log(`\n🎉 Integration Suite Complete: Passed ${passed}/${passed + failed} checks.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
