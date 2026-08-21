import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import fileRoutes from '../modules/files/files.routes';
import usersRoutes from '../modules/users/users.routes';
import clientsRoutes from '../modules/clients/clients.routes';
import projectsRoutes from '../modules/projects/projects.routes';
import messagesRoutes from '../modules/messages/messages.routes';
import invoicesRoutes from '../modules/invoices/invoices.routes';
import expensesRoutes from '../modules/expenses/expenses.routes';
import { 
  getQuotations, 
  createQuotation, 
  getQuotationById, 
  updateQuotation, 
  deleteQuotation,
  generateQuotationPdfController
} from '../modules/invoices/invoices.controller';
import { CreateQuotationSchema, UpdateQuotationSchema } from '../modules/invoices/invoices.validation';
import { resolveTenantContext } from '../middleware/tenant';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import settingsRoutes from '../modules/settings/settings.routes';
import websiteGalleryRoutes from '../modules/website-gallery/website-gallery.routes';
import { getPublicWebsiteGalleries } from '../modules/website-gallery/website-gallery.controller';
import divisionsRoutes from '../modules/divisions/divisions.routes';
import { getPublicDivisions, streamPublicDivisionMedia } from '../modules/divisions/divisions.controller';
import workflowRoutes from '../modules/workflow/workflow.routes';
import notificationsRoutes from '../modules/notifications/notifications.routes';
import tasksRoutes from '../modules/tasks/tasks.routes';
import approvalsRoutes from '../modules/approvals/approvals.routes';
import personnelRoutes from '../modules/personnel/personnel.routes';
import templatesRoutes from '../modules/templates/templates.routes';
import eventsRoutes from '../modules/events/events.routes';
import agreementsRoutes from '../modules/agreements/agreements.routes';
import healthRoutes from './health';
import { 
  standaloneAgreementTemplatesRouter, 
  standaloneAgreementsRouter 
} from '../modules/standalone-agreements/standalone-agreements.routes';
import { 
  getClientAgreement,
  acceptQuotationController,
  getClientAgreementsListController,
  getClientAgreementDetailsController
} from '../modules/standalone-agreements/standalone-agreements.controller';
import { verifyPublicDocumentController, verifyDocumentByIdController } from '../modules/public/public.controller';
import { adminGalleryRouter, publicGalleryRouter } from '../modules/gallery/gallery.routes';

const router = Router();

const financeRouter = Router();
financeRouter.use('/expenses', expensesRoutes);

const quotationRouter = Router();
quotationRouter.get('/', getQuotations);
quotationRouter.post('/', validateBody(CreateQuotationSchema), createQuotation);
quotationRouter.get('/:id', getQuotationById);
quotationRouter.put('/:id', validateBody(UpdateQuotationSchema), updateQuotation);
quotationRouter.delete('/:id', deleteQuotation);
quotationRouter.post('/:id/generate-pdf', generateQuotationPdfController);
quotationRouter.post('/:id/accept', acceptQuotationController);

// Register base routes
router.use('/auth', authRoutes);
router.use('/files', authenticate, resolveTenantContext, fileRoutes);
router.use('/users', authenticate, resolveTenantContext, usersRoutes);
router.use('/clients', authenticate, resolveTenantContext, clientsRoutes);
router.use('/events', authenticate, resolveTenantContext, eventsRoutes);
router.use('/projects', authenticate, resolveTenantContext, messagesRoutes);
router.use('/projects', authenticate, resolveTenantContext, projectsRoutes);
router.use('/invoices', authenticate, resolveTenantContext, invoicesRoutes);
router.use('/quotations', authenticate, resolveTenantContext, quotationRouter);
router.use('/finance', authenticate, resolveTenantContext, financeRouter);
router.use('/settings', authenticate, resolveTenantContext, settingsRoutes);
router.use('/website-gallery', authenticate, resolveTenantContext, websiteGalleryRoutes);
router.get('/public/website-gallery', getPublicWebsiteGalleries);
router.use('/admin/gallery', authenticate, resolveTenantContext, adminGalleryRouter);
router.use('/gallery', publicGalleryRouter);
router.use('/divisions', authenticate, resolveTenantContext, divisionsRoutes);
router.get('/public/divisions', getPublicDivisions);
router.get('/public/divisions/media/:fileId', streamPublicDivisionMedia);
router.get('/public/verify/:verificationId', verifyPublicDocumentController);
router.get('/verify/:documentId', verifyDocumentByIdController);
router.use('/workflow', authenticate, resolveTenantContext, workflowRoutes);
router.use('/notifications', authenticate, resolveTenantContext, notificationsRoutes);
router.use('/tasks', authenticate, resolveTenantContext, tasksRoutes);
router.use('/approvals', authenticate, resolveTenantContext, approvalsRoutes);
router.use('/personnel', authenticate, resolveTenantContext, personnelRoutes);
router.use('/templates', authenticate, resolveTenantContext, templatesRoutes);
router.use('/agreements', authenticate, resolveTenantContext, agreementsRoutes);
router.use('/standalone-agreement-templates', authenticate, resolveTenantContext, standaloneAgreementTemplatesRouter);
router.use('/standalone-agreements', authenticate, resolveTenantContext, standaloneAgreementsRouter);
router.get('/clients/:clientId/standalone-agreement', authenticate, resolveTenantContext, getClientAgreement);

// Client Agreement API Endpoints
router.get('/client/agreements', authenticate, resolveTenantContext, getClientAgreementsListController);
router.get('/client/agreements/:id', authenticate, resolveTenantContext, getClientAgreementDetailsController);
router.get('/clients/agreements', authenticate, resolveTenantContext, getClientAgreementsListController);
router.get('/clients/agreements/:id', authenticate, resolveTenantContext, getClientAgreementDetailsController);

router.use('/', healthRoutes);

export default router;
