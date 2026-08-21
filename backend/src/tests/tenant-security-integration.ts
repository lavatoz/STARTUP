import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { Role, SubscriptionStatus, PlatformRole, OrganizationRole, AgreementStatus } from '@prisma/client';
import { resolveTenantContext } from '../middleware/tenant';

// Import controller functions for all resources
import { getClientById, deleteClient } from '../modules/clients/clients.controller';
import { createProject, getProjectById, updateProject } from '../modules/projects/projects.controller';
import { updateEvent } from '../modules/events/events.controller';
import { getTaskById } from '../modules/tasks/tasks.controller';
import { getInvoiceById, getQuotationById, getAgreements } from '../modules/invoices/invoices.controller';
import { getDocuments } from '../modules/standalone-agreements/standalone-agreements.controller';
import { downloadFile } from '../modules/files/files.controller';
import { getProjectGalleryPhotos } from '../modules/projects/gallery.controller';
import { getPersonnelById } from '../modules/personnel/personnel.controller';
import { getExpenses } from '../modules/expenses/expenses.controller';
import { getWebsiteGalleryById } from '../modules/website-gallery/website-gallery.controller';
import { getDivisionById } from '../modules/divisions/divisions.controller';
import { getProjectMessages } from '../modules/messages/messages.controller';
import { getProjectTimeline } from '../modules/workflow/workflow.controller';
import { getProjectWorkflow } from '../modules/workflow/workflow-v2.controller';

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
    requestId: 'test-security-corr-id',
    user: options.user,
    userContext: options.userContext,
  } as unknown as Request;

  let statusCode = 200;
  let responseData: any = null;
  let nextError: any = null;

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
      return { statusCode, responseData, nextError };
    }
  };
}

export async function runTests() {
  console.log('🧪 Starting APCO Tenant Security & Multi-Tenancy Integration Tests...\n');
  
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

  // ----------------------------------------------------
  // Database Seeding & Setup
  // ----------------------------------------------------
  
  // Clean tables
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "ProjectMessage" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "WorkflowStageAttachment" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "WorkflowActivity" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "WorkflowStage" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "PhotoReview" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "PhotoSelection" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "GalleryPhoto" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "ProjectGallery" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Payment" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "InvoiceItem" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Invoice" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "QuotationItem" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Quotation" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Agreement" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "StandaloneAgreementDocument" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "StandaloneAgreement" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "StandaloneAgreementTemplate" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Task" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "StaffAssignment" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Event" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Project" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Client" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "File" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Personnel" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Expense" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Division" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "WebsiteGallery" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Notification" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Subscription" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "OrganizationMember" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Organization" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE;');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Plan" CASCADE;');

  // Create Seed Plan
  const plan = await prisma.plan.create({
    data: {
      name: 'Startup Gold',
      price: 99.00,
      features: {},
      limits: {}
    }
  });

  // Create Organizations A & B
  const orgA = await prisma.organization.create({
    data: {
      name: 'Organization A',
      slug: 'org-a',
    }
  });

  const orgB = await prisma.organization.create({
    data: {
      name: 'Organization B',
      slug: 'org-b',
    }
  });

  // Create active subscription for Org A and B
  await prisma.subscription.create({
    data: {
      organizationId: orgA.id,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  await prisma.subscription.create({
    data: {
      organizationId: orgB.id,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  // Create Users A, B, C, D, E
  const userA = await prisma.user.create({
    data: {
      email: 'admin-a@apco.com',
      firstName: 'Admin',
      lastName: 'A',
      role: Role.SystemAdmin
    }
  });

  const userB = await prisma.user.create({
    data: {
      email: 'admin-b@apco.com',
      firstName: 'Admin',
      lastName: 'B',
      role: Role.SystemAdmin
    }
  });

  // User C: Disabled membership in Org A
  const userC = await prisma.user.create({
    data: {
      email: 'disabled-a@apco.com',
      firstName: 'Disabled',
      lastName: 'A',
      role: Role.Manager
    }
  });

  // User D: Removed membership in Org A (No member row will exist)
  const userD = await prisma.user.create({
    data: {
      email: 'removed-a@apco.com',
      firstName: 'Removed',
      lastName: 'A',
      role: Role.Manager
    }
  });

  // User E: Member in Org A, but Org A's subscription is suspended
  const userE = await prisma.user.create({
    data: {
      email: 'suspended-a@apco.com',
      firstName: 'Suspended',
      lastName: 'A',
      role: Role.Manager
    }
  });

  // Memberships
  const memberA = await prisma.organizationMember.create({
    data: {
      organizationId: orgA.id,
      userId: userA.id,
      role: OrganizationRole.OWNER,
      status: 'Active'
    }
  });

  const memberB = await prisma.organizationMember.create({
    data: {
      organizationId: orgB.id,
      userId: userB.id,
      role: OrganizationRole.OWNER,
      status: 'Active'
    }
  });

  // User C membership is Disabled/Inactive
  await prisma.organizationMember.create({
    data: {
      organizationId: orgA.id,
      userId: userC.id,
      role: OrganizationRole.MANAGER,
      status: 'Inactive'
    }
  });

  // User E membership is Active, but subscription suspended
  await prisma.organizationMember.create({
    data: {
      organizationId: orgA.id,
      userId: userE.id,
      role: OrganizationRole.MANAGER,
      status: 'Active'
    }
  });

  // Seed resources for Org A
  const clientA = await prisma.client.create({ data: { organizationId: orgA.id, name: 'Client A', email: 'client-a@apco.com', clientCode: 'CLI-A' } });
  const projectA = await prisma.project.create({ data: { organizationId: orgA.id, name: 'Project A', clientId: clientA.id, stage: 'Booked', projectCode: 'PRJ-A' } });
  const eventA = await prisma.event.create({ data: { organizationId: orgA.id, id: 'event-a-id', eventCode: 'EVT-A', clientId: clientA.id, name: 'Event A', status: 'Scheduled', date: new Date() } });
  const taskA = await prisma.task.create({ data: { organizationId: orgA.id, projectId: projectA.id, title: 'Task A', status: 'Pending', priority: 'Medium', assignee: 'None', brand: 'Artisans', dueDate: new Date() } });
  const invoiceA = await prisma.invoice.create({ data: { organizationId: orgA.id, projectId: projectA.id, clientId: clientA.id, invoiceCode: 'INV-CODE-A', invoiceNumber: 'INV-A', amount: 100, dueDate: new Date(), status: 'Unpaid' } });
  const quotationA = await prisma.quotation.create({ data: { organizationId: orgA.id, projectId: projectA.id, clientId: clientA.id, quotationCode: 'QUO-CODE-A', quotationNumber: 'QUO-A', amount: 100, validUntil: new Date(), status: 'Pending' } });
  const fileA = await prisma.file.create({ data: { organizationId: orgA.id, projectId: projectA.id, key: 'file-a-key', originalName: 'docA.pdf', mimeType: 'application/pdf', size: 100, hash: 'hashA' } });
  const agreementA = await prisma.agreement.create({ data: { organizationId: orgA.id, projectId: projectA.id, clientId: clientA.id, fileId: fileA.id, agreementNumber: 'AGR-A', status: 'Pending' } });
  const tplA = await prisma.standaloneAgreementTemplate.create({ data: { organizationId: orgA.id, name: 'Tpl A', version: '1.0', content: 'Content A' } });
  const standaloneA = await prisma.standaloneAgreement.create({ data: { organizationId: orgA.id, templateId: tplA.id, clientId: clientA.id, title: 'Standalone A', agreementCode: 'ST-CODE-A', generatedContent: 'Gen A', status: AgreementStatus.PENDING } });
  const galleryA = await prisma.projectGallery.create({ data: { projectId: projectA.id, currentStatus: 'SELECTION_IN_PROGRESS', selectionLocked: false } });
  const galleryPhotoA = await prisma.galleryPhoto.create({ data: { projectId: projectA.id, fileId: fileA.id } });
  const personnelA = await prisma.personnel.create({ data: { organizationId: orgA.id, name: 'Staff A', role: 'Photographer', status: 'Active' } });
  const expenseA = await prisma.expense.create({ data: { organizationId: orgA.id, description: 'Expense A', amount: 50, category: 'Travel', date: new Date(), brand: 'Artisans' } });
  const divisionA = await prisma.division.create({ data: { organizationId: orgA.id, name: 'Division A', description: 'Desc A' } });
  const websiteGalleryA = await prisma.websiteGallery.create({ data: { organizationId: orgA.id, title: 'Gallery A', coverImageUrl: 'http://test.com/img.jpg', coverImageFileId: fileA.id, published: true } });
  const notificationA = await prisma.notification.create({ data: { organizationId: orgA.id, userId: userA.id, title: 'Notif A', message: 'Hello A', isRead: false } });
  const messageA = await prisma.projectMessage.create({ data: { projectId: projectA.id, senderId: userA.id, message: 'Message A' } });
  const workflowStageA = await prisma.workflowStage.create({ data: { projectId: projectA.id, stageType: 'SHOOT', displayOrder: 0, status: 'IN_PROGRESS' } });

  // Seed resources for Org B
  const clientB = await prisma.client.create({ data: { organizationId: orgB.id, name: 'Client B', email: 'client-b@apco.com', clientCode: 'CLI-B' } });
  const projectB = await prisma.project.create({ data: { organizationId: orgB.id, name: 'Project B', clientId: clientB.id, stage: 'Booked', projectCode: 'PRJ-B' } });
  const eventB = await prisma.event.create({ data: { organizationId: orgB.id, id: 'event-b-id', eventCode: 'EVT-B', clientId: clientB.id, name: 'Event B', status: 'Scheduled', date: new Date() } });
  const taskB = await prisma.task.create({ data: { organizationId: orgB.id, projectId: projectB.id, title: 'Task B', status: 'Pending', priority: 'Medium', assignee: 'None', brand: 'Artisans', dueDate: new Date() } });
  const invoiceB = await prisma.invoice.create({ data: { organizationId: orgB.id, projectId: projectB.id, clientId: clientB.id, invoiceCode: 'INV-CODE-B', invoiceNumber: 'INV-B', amount: 200, dueDate: new Date(), status: 'Unpaid' } });
  const quotationB = await prisma.quotation.create({ data: { organizationId: orgB.id, projectId: projectB.id, clientId: clientB.id, quotationCode: 'QUO-CODE-B', quotationNumber: 'QUO-B', amount: 200, validUntil: new Date(), status: 'Pending' } });
  const fileB = await prisma.file.create({ data: { organizationId: orgB.id, projectId: projectB.id, key: 'file-b-key', originalName: 'docB.pdf', mimeType: 'application/pdf', size: 200, hash: 'hashB' } });
  const agreementB = await prisma.agreement.create({ data: { organizationId: orgB.id, projectId: projectB.id, clientId: clientB.id, fileId: fileB.id, agreementNumber: 'AGR-B', status: 'Pending' } });
  const tplB = await prisma.standaloneAgreementTemplate.create({ data: { organizationId: orgB.id, name: 'Tpl B', version: '1.0', content: 'Content B' } });
  const standaloneB = await prisma.standaloneAgreement.create({ data: { organizationId: orgB.id, templateId: tplB.id, clientId: clientB.id, title: 'Standalone B', agreementCode: 'ST-CODE-B', generatedContent: 'Gen B', status: AgreementStatus.PENDING } });
  const galleryB = await prisma.projectGallery.create({ data: { projectId: projectB.id, currentStatus: 'SELECTION_IN_PROGRESS', selectionLocked: false } });
  const galleryPhotoB = await prisma.galleryPhoto.create({ data: { projectId: projectB.id, fileId: fileB.id } });
  const personnelB = await prisma.personnel.create({ data: { organizationId: orgB.id, name: 'Staff B', role: 'Photographer', status: 'Active' } });
  const expenseB = await prisma.expense.create({ data: { organizationId: orgB.id, description: 'Expense B', amount: 80, category: 'Travel', date: new Date(), brand: 'Artisans' } });
  const divisionB = await prisma.division.create({ data: { organizationId: orgB.id, name: 'Division B', description: 'Desc B' } });
  const websiteGalleryB = await prisma.websiteGallery.create({ data: { organizationId: orgB.id, title: 'Gallery B', coverImageUrl: 'http://test.com/img.jpg', coverImageFileId: fileB.id, published: true } });
  const notificationB = await prisma.notification.create({ data: { organizationId: orgB.id, userId: userB.id, title: 'Notif B', message: 'Hello B', isRead: false } });
  const messageB = await prisma.projectMessage.create({ data: { projectId: projectB.id, senderId: userB.id, message: 'Message B' } });
  const workflowStageB = await prisma.workflowStage.create({ data: { projectId: projectB.id, stageType: 'SHOOT', displayOrder: 0, status: 'IN_PROGRESS' } });

  // Suppress warnings about unused variables
  console.log(`Seeding metadata check:
    Plans: ${plan.id}
    MemberB: ${memberB.id}
    Events: ${eventA.id} / ${eventB.id}
    Tasks: ${taskA.id} / ${taskB.id}
    Invoices: ${invoiceA.id} / ${invoiceB.id}
    Quotations: ${quotationA.id} / ${quotationB.id}
    Agreements: ${agreementA.id} / ${agreementB.id}
    Standalone: ${standaloneA.id} / ${standaloneB.id}
    Gallery: ${galleryA.id} / ${galleryB.id}
    GalleryPhoto: ${galleryPhotoA.id} / ${galleryPhotoB.id}
    Personnel: ${personnelA.id} / ${personnelB.id}
    Expenses: ${expenseA.id} / ${expenseB.id}
    Divisions: ${divisionA.id} / ${divisionB.id}
    WebGallery: ${websiteGalleryA.id} / ${websiteGalleryB.id}
    Notifications: ${notificationA.id} / ${notificationB.id}
    Messages: ${messageA.id} / ${messageB.id}
    WorkflowStage: ${workflowStageA.id} / ${workflowStageB.id}
  `);

  // Mock User Contexts for testing
  const contextA = {
    userId: userA.id,
    organizationId: orgA.id,
    membershipId: memberA.id,
    organizationRole: Role.Manager,
    platformRole: PlatformRole.USER,
    permissions: [],
    organizationName: 'Organization A',
  };

  // Helper to assert nextError is a 404 AppError
  function assertErrorIs404(results: any) {
    const { nextError, statusCode } = results;
    if (!nextError) {
      throw new Error(`Expected 404, but request succeeded with status ${statusCode}`);
    }
    if (nextError.statusCode !== 404) {
      throw new Error(`Expected 404 AppError, but got status ${nextError.statusCode}: ${nextError.message}`);
    }
  }

  // ----------------------------------------------------
  // SECURITY INTEGRATION TEST CASES
  // ----------------------------------------------------

  // 1. Client cross-tenant isolation
  await testCase('Client: Org A user cannot view Org B client', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: clientB.id },
      user: userA,
      userContext: contextA
    });
    await getClientById(req, res, next);
    assertErrorIs404(results());
  });

  await testCase('Client: Org A user cannot delete Org B client', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: clientB.id },
      user: userA,
      userContext: contextA
    });
    await deleteClient(req, res, next);
    assertErrorIs404(results());
  });

  // 2. Project cross-tenant isolation
  await testCase('Project: Org A user cannot view Org B project', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: projectB.id },
      user: userA,
      userContext: contextA
    });
    await getProjectById(req, res, next);
    assertErrorIs404(results());
  });

  await testCase('Project: Org A user cannot update Org B project', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: projectB.id },
      body: { name: 'Hack Name' },
      user: userA,
      userContext: contextA
    });
    await updateProject(req, res, next);
    assertErrorIs404(results());
  });

  // 3. Event cross-tenant isolation
  await testCase('Event: Org A user cannot update Org B event', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: eventB.id },
      body: { name: 'Hack Event Name' },
      user: userA,
      userContext: contextA
    });
    await updateEvent(req, res, next);
    assertErrorIs404(results());
  });

  // 4. Task cross-tenant isolation
  await testCase('Task: Org A user cannot view Org B task', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: taskB.id },
      user: userA,
      userContext: contextA
    });
    await getTaskById(req, res, next);
    assertErrorIs404(results());
  });

  // 5. Invoice cross-tenant isolation
  await testCase('Invoice: Org A user cannot view Org B invoice', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: invoiceB.id },
      user: userA,
      userContext: contextA
    });
    await getInvoiceById(req, res, next);
    assertErrorIs404(results());
  });

  // 6. Quotation cross-tenant isolation
  await testCase('Quotation: Org A user cannot view Org B quotation', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: quotationB.id },
      user: userA,
      userContext: contextA
    });
    await getQuotationById(req, res, next);
    assertErrorIs404(results());
  });

  // 7. Agreement cross-tenant isolation
  await testCase('Agreement: Org A user cannot view Org B agreements list', async () => {
    const { req, res, next, results } = mockRequestResponse({
      user: userA,
      userContext: contextA
    });
    await getAgreements(req, res, next);
    const { responseData } = results();
    const hasOrgB = responseData && responseData.some((a: any) => a.agreementNumber === 'AGR-B');
    if (hasOrgB) {
      throw new Error('Org A user saw Org B agreement record!');
    }
  });

  // 8. Standalone Agreement cross-tenant isolation
  await testCase('StandaloneAgreement: Org A user cannot view Org B documents list', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { agreementId: standaloneB.id },
      user: userA,
      userContext: contextA
    });
    await getDocuments(req, res, next);
    assertErrorIs404(results());
  });

  // 9. Document/File cross-tenant isolation
  await testCase('File: Org A user cannot download Org B file', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { fileId: fileB.id },
      user: userA,
      userContext: contextA
    });
    await downloadFile(req, res, next);
    assertErrorIs404(results());
  });

  // 10. Gallery cross-tenant isolation
  await testCase('Gallery: Org A user cannot access Org B project gallery photos', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: projectB.id },
      user: userA,
      userContext: contextA
    });
    await getProjectGalleryPhotos(req, res, next);
    assertErrorIs404(results());
  });

  // 11. Personnel registry isolation
  await testCase('Personnel: Org A user cannot view Org B personnel record', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: personnelB.id },
      user: userA,
      userContext: contextA
    });
    await getPersonnelById(req, res, next);
    assertErrorIs404(results());
  });

  // 12. Expenses isolation
  await testCase('Expense: Org A user cannot list Org B expenses', async () => {
    const { req, res, next, results } = mockRequestResponse({
      user: userA,
      userContext: contextA
    });
    await getExpenses(req, res, next);
    const { responseData } = results();
    const hasOrgB = responseData && responseData.some((e: any) => e.description === 'Expense B');
    if (hasOrgB) {
      throw new Error('Org A user saw Org B expense record!');
    }
  });

  // 13. Message isolation
  await testCase('Message: Org A user cannot view Org B project messages', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { projectId: projectB.id },
      user: userA,
      userContext: contextA
    });
    await getProjectMessages(req, res, next);
    assertErrorIs404(results());
  });

  // 14. Website Gallery isolation
  await testCase('WebsiteGallery: Org A user cannot view Org B website gallery', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: websiteGalleryB.id },
      user: userA,
      userContext: contextA
    });
    await getWebsiteGalleryById(req, res, next);
    assertErrorIs404(results());
  });

  // 15. Division isolation
  await testCase('Division: Org A user cannot view Org B division', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: divisionB.id },
      user: userA,
      userContext: contextA
    });
    await getDivisionById(req, res, next);
    assertErrorIs404(results());
  });

  // 16. Workflow Event Timeline isolation
  await testCase('Workflow: Org A user cannot view Org B project timeline', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { projectId: projectB.id },
      user: userA,
      userContext: contextA
    });
    await getProjectTimeline(req, res, next);
    assertErrorIs404(results());
  });

  // 17. Workflow Stage v2 isolation
  await testCase('WorkflowV2: Org A user cannot view Org B project workflow stages', async () => {
    const { req, res, next, results } = mockRequestResponse({
      params: { id: projectB.id },
      user: userA,
      userContext: contextA
    });
    await getProjectWorkflow(req, res, next);
    assertErrorIs404(results());
  });

  // ----------------------------------------------------
  // MANIPULATED PARAMETERS & MIDDLEWARE ATTACK TESTING
  // ----------------------------------------------------

  await testCase('Security: Manipulated organization ID header gets rejected', async () => {
    const { req, res, next, results } = mockRequestResponse({
      headers: { 'x-organization-id': orgB.id }, // Org A user attempts to pass Org B id in headers
      user: userA
    });
    await resolveTenantContext(req, res, next);
    const { nextError } = results();
    if (!nextError || nextError.statusCode !== 403 || !nextError.message.includes('membership')) {
      throw new Error('Expected 403 active membership not found when headers are manipulated.');
    }
  });

  await testCase('Security: Manipulated organization slug header gets rejected', async () => {
    const { req, res, next, results } = mockRequestResponse({
      headers: { 'x-organization-slug': 'org-b' }, // Org A user attempts to pass Org B slug
      user: userA
    });
    await resolveTenantContext(req, res, next);
    const { nextError } = results();
    if (!nextError || nextError.statusCode !== 403 || !nextError.message.includes('membership')) {
      throw new Error('Expected 403 active membership not found when slug header is manipulated.');
    }
  });

  await testCase('Security: Disabled/Inactive membership blocks access', async () => {
    const { req, res, next, results } = mockRequestResponse({
      headers: { 'x-organization-id': orgA.id },
      user: userC // User C has inactive membership
    });
    await resolveTenantContext(req, res, next);
    const { nextError } = results();
    if (!nextError || nextError.statusCode !== 403 || !nextError.message.includes('not active')) {
      throw new Error('Expected 403 not active membership error.');
    }
  });

  await testCase('Security: Removed/No membership blocks access', async () => {
    const { req, res, next, results } = mockRequestResponse({
      headers: { 'x-organization-id': orgA.id },
      user: userD // User D has no membership row
    });
    await resolveTenantContext(req, res, next);
    const { nextError } = results();
    if (!nextError || nextError.statusCode !== 403 || !nextError.message.includes('membership not found')) {
      throw new Error('Expected 403 membership not found error.');
    }
  });

  await testCase('Security: Suspended organization subscription blocks access', async () => {
    // Suspend Org A subscription
    await prisma.subscription.updateMany({
      where: { organizationId: orgA.id },
      data: { status: SubscriptionStatus.SUSPENDED }
    });

    try {
      const { req, res, next, results } = mockRequestResponse({
        headers: { 'x-organization-id': orgA.id },
        user: userE
      });
      await resolveTenantContext(req, res, next);
      const { nextError } = results();
      if (!nextError || nextError.statusCode !== 403 || !nextError.message.includes('suspended')) {
        throw new Error('Expected 403 suspended subscription error.');
      }
    } finally {
      // Re-enable Org A subscription
      await prisma.subscription.updateMany({
        where: { organizationId: orgA.id },
        data: { status: SubscriptionStatus.ACTIVE }
      });
    }
  });

  await testCase('Security: Expired/Invalid auth request gets rejected', async () => {
    const { req, res, next, results } = mockRequestResponse({
      headers: { 'x-organization-id': orgA.id },
      user: undefined // No authenticated user
    });
    await resolveTenantContext(req, res, next);
    const { nextError } = results();
    if (!nextError || nextError.statusCode !== 401) {
      throw new Error('Expected 401 Authentication required error.');
    }
  });

  await testCase('Security: Platform admin endpoint access from organization user is blocked', async () => {
    const clientUser = await prisma.user.create({
      data: { email: 'client-test@apco.com', firstName: 'Cli', lastName: 'Test', role: Role.Client }
    });
    const clientMember = await prisma.organizationMember.create({
      data: { organizationId: orgA.id, userId: clientUser.id, role: OrganizationRole.CLIENT, status: 'Active' }
    });
    const clientContext = {
      userId: clientUser.id,
      organizationId: orgA.id,
      membershipId: clientMember.id,
      organizationRole: Role.Client,
      platformRole: PlatformRole.USER,
      permissions: [],
      organizationName: 'Org A'
    };

    const { req, res, next, results } = mockRequestResponse({
      body: { name: 'Client Project', stage: 'Booked', projectCode: 'PRJ-NEW' },
      user: clientUser,
      userContext: clientContext
    });

    await createProject(req, res, next);
    const { nextError } = results();
    if (!nextError || nextError.statusCode !== 403) {
      throw new Error('Expected 403 Role Forbidden error on client project create.');
    }
  });

  // ----------------------------------------------------
  // Phase 5 Branding Security Verification Tests
  // ----------------------------------------------------
  await testCase('Branding Security: Org A can read its own branding settings', async () => {
    // Setup a company profile for Org A
    await prisma.companyProfile.create({
      data: {
        id: 'comp-org-a',
        companyName: 'Oakridge Org A',
        projectType: 'WEDDING',
        organizationId: orgA.id,
        invoicePrefix: 'OA',
        email: 'org-a@test.com',
        phone: '111111',
      }
    });

    try {
      const { req, res, next, results } = mockRequestResponse({
        user: { ...userA, organizationId: orgA.id },
        userContext: {
          userId: userA.id,
          organizationId: orgA.id,
          organizationRole: 'OWNER',
          platformRole: 'MEMBER',
        }
      });

      const { getCompanies } = require('../modules/settings/settings.controller');
      await getCompanies(req, res, next);
      
      const { statusCode, responseData } = results();
      if (statusCode !== 200) {
        throw new Error(`Expected 200 OK, got ${statusCode}`);
      }
      const hasComp = responseData.some((c: any) => c.id === 'comp-org-a');
      if (!hasComp) {
        throw new Error('Org A could not read its own branding settings.');
      }
    } finally {
      await prisma.companyProfile.deleteMany({ where: { id: 'comp-org-a' } });
    }
  });

  await testCase('Branding Security: Org A cannot read or modify Org B branding', async () => {
    // Setup company profile for Org B
    await prisma.companyProfile.create({
      data: {
        id: 'comp-org-b',
        companyName: 'Oakridge Org B',
        projectType: 'WEDDING',
        organizationId: orgB.id,
        invoicePrefix: 'OB',
        email: 'org-b@test.com',
        phone: '222222',
      }
    });

    try {
      // 1. Try to read Org B branding as Org A user
      const { req: readReq, res: readRes, next: readNext, results: readResults } = mockRequestResponse({
        user: { ...userA, organizationId: orgA.id },
        userContext: {
          userId: userA.id,
          organizationId: orgA.id,
          organizationRole: 'OWNER',
          platformRole: 'MEMBER',
        }
      });

      const { getCompanies } = require('../modules/settings/settings.controller');
      await getCompanies(readReq, readRes, readNext);
      const { responseData: readData } = readResults();
      const containsB = readData && Array.isArray(readData) && readData.some((c: any) => c.id === 'comp-org-b');
      if (containsB) {
        throw new Error('Org A successfully read Org B branding Settings!');
      }

      // 2. Try to modify Org B branding as Org A user
      const { req: writeReq, res: writeRes, next: writeNext, results: writeResults } = mockRequestResponse({
        params: { id: 'comp-org-b' },
        body: { companyName: 'Hacked Brand B', projectType: 'WEDDING', invoicePrefix: 'OB', email: 'org-b@test.com', phone: '222222' },
        user: { ...userA, organizationId: orgA.id },
        userContext: {
          userId: userA.id,
          organizationId: orgA.id,
          organizationRole: 'OWNER',
          platformRole: 'MEMBER',
        }
      });

      const { saveCompany } = require('../modules/settings/settings.controller');
      await saveCompany(writeReq, writeRes, writeNext);
      const { nextError } = writeResults();
      if (!nextError || nextError.statusCode !== 404) {
        throw new Error(`Expected 404 company profile not found on cross-tenant modification, got error: ${nextError?.message}`);
      }
    } finally {
      await prisma.companyProfile.deleteMany({ where: { id: 'comp-org-b' } });
    }
  });

  await testCase('Branding Security: Org A cannot generate branded documents using Org B organizationId', async () => {
    // Create quotation for Org B
    await prisma.quotation.create({
      data: {
        id: 'quote-org-b',
        quotationNumber: 'Q-OB-1234',
        quotationCode: 'Q-CODE-1234',
        amount: 2000,
        status: 'Draft',
        projectId: projectB.id,
        clientId: clientB.id,
        organizationId: orgB.id,
        validUntil: new Date(),
      } as any
    });

    try {
      const { req, res, next, results } = mockRequestResponse({
        params: { id: 'quote-org-b' },
        user: { ...userA, organizationId: orgA.id },
        userContext: {
          userId: userA.id,
          organizationId: orgA.id,
          organizationRole: 'OWNER',
          platformRole: 'MEMBER',
        }
      });

      const { generateQuotationPdfController } = require('../modules/invoices/invoices.controller');
      await generateQuotationPdfController(req, res, next);
      const { nextError } = results();
      if (!nextError || nextError.statusCode !== 404) {
        throw new Error(`Expected 404 quotation not found on cross-tenant PDF generation, got: ${nextError?.message}`);
      }
    } finally {
      await prisma.quotation.deleteMany({ where: { id: 'quote-org-b' } });
    }
  });

  await testCase('Branding Security: Spoofing headers fails to bypass membership authentication', async () => {
    // User A belongs to Org A. Try to access Org B by spoofing header.
    const { req, res, next, results } = mockRequestResponse({
      headers: { 'x-organization-id': orgB.id },
      user: userA
    });
    
    await resolveTenantContext(req, res, next);
    const { nextError } = results();
    if (!nextError || nextError.statusCode !== 403 || !nextError.message.includes('membership not found')) {
      throw new Error(`Expected 403 membership not found error on header spoofing, got: ${nextError?.message}`);
    }
  });

  console.log(`\n📊 Tenant Security Integration Tests Summary:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log('------------------------------\n');

  if (failed > 0) {
    throw new Error(`${failed} tenant security tests failed.`);
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error('❌ Tenant security tests execution failed:', err);
    process.exit(1);
  });
}
