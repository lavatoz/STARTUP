import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import { logAudit, extractReqMeta } from '../../services/audit.service';
import { Role } from '@prisma/client';
import { NotificationService } from '../../services/notification.service';

/**
 * Get all approval requests
 */
export async function getApprovals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const orgId = user.organizationId!;

    let approvals;
    if (user.role === Role.Client) {
      // Clients only see their own approvals
      approvals = await prisma.approval.findMany({
        where: {
          organizationId: orgId,
          clientName: `${user.firstName} ${user.lastName}`,
        },
        orderBy: { submissionDate: 'desc' },
      });
    } else {
      // Staff see all organization approvals
      approvals = await prisma.approval.findMany({
        where: { organizationId: orgId },
        orderBy: { submissionDate: 'desc' },
      });
    }

    res.status(200).json(approvals);
  } catch (error) {
    next(error);
  }
}

/**
 * Create approval request
 */
export async function createApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const body = req.body;
    const meta = extractReqMeta(req);
    const orgId = user.organizationId!;

    const approval = await prisma.approval.create({
      data: {
        organizationId: orgId,
        type: body.type,
        targetId: body.targetId,
        targetType: body.targetType,
        clientName: body.clientName,
        brandName: body.brandName || null,
        amount: body.amount,
        status: 'Pending Approval',
        notes: body.notes || null,
        metadata: body.metadata || null,
      },
    });

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'APPROVAL_SUBMIT',
      details: { approvalId: approval.id, targetId: approval.targetId, type: approval.type },
      ...meta,
    });

    try {
      await NotificationService.emitToRole(Role.SystemAdmin, {
        title: 'New Approval Submission',
        message: `A new approval request has been submitted for ${approval.clientName} (Amount: $${approval.amount}).`,
        organizationId: orgId,
      });
      await NotificationService.emitToRole(Role.Manager, {
        title: 'New Approval Submission',
        message: `A new approval request has been submitted for ${approval.clientName} (Amount: $${approval.amount}).`,
        organizationId: orgId,
      });
    } catch (err) {
      console.error('Failed to notify staff about new approval request:', err);
    }

    res.status(201).json(approval);
  } catch (error) {
    next(error);
  }
}

/**
 * Verify approval request (Approve/Reject)
 */
export async function verifyApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { status, notes } = req.body;
    const meta = extractReqMeta(req);
    const orgId = user.organizationId!;

    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can verify approvals.', 403);
    }

    if (status !== 'Approved' && status !== 'Rejected') {
      throw new AppError('Invalid verification status.', 400);
    }

    const existingApproval = await prisma.approval.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existingApproval) {
      throw new AppError('Approval record not found.', 404);
    }

    // Process status update and target state transition in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.approval.update({
        where: { id },
        data: {
          status,
          notes: notes !== undefined ? notes : existingApproval.notes,
          approvedBy: status === 'Approved' ? `${user.firstName} ${user.lastName}` : null,
          approvedDate: status === 'Approved' ? new Date() : null,
          rejectedBy: status === 'Rejected' ? `${user.firstName} ${user.lastName}` : null,
          rejectedDate: status === 'Rejected' ? new Date() : null,
        },
      });

      // Cascade state changes to corresponding business documents if Approved
      if (status === 'Approved') {
        if (existingApproval.targetType === 'invoice') {
          await tx.invoice.update({
            where: { id: existingApproval.targetId, organizationId: orgId },
            data: { status: 'Paid' },
          });
        } else if (existingApproval.targetType === 'quotation') {
          await tx.quotation.update({
            where: { id: existingApproval.targetId, organizationId: orgId },
            data: { status: 'Approved' },
          });
        }
      }

      return updated;
    });

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: status === 'Approved' ? 'APPROVAL_APPROVE' : 'APPROVAL_REJECT',
      details: { approvalId: id, targetId: existingApproval.targetId, status },
      ...meta,
    });

    try {
      const client = await prisma.client.findFirst({
        where: { name: existingApproval.clientName, organizationId: orgId, deletedAt: null }
      });
      if (client) {
        const clientUser = await prisma.user.findFirst({
          where: { email: client.email }
        });
        if (clientUser) {
          await NotificationService.emitNotification(clientUser.id, {
            title: `Approval Decision: ${status}`,
            message: `Your request for ${existingApproval.type} has been ${status.toLowerCase()} by the production team.`,
            organizationId: orgId,
          });
        }
      }
    } catch (err) {
      console.error('Failed to notify client about approval decision:', err);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete approval request
 */
export async function deleteApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    const meta = extractReqMeta(req);
    const orgId = user.organizationId!;

    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can delete approvals.', 403);
    }

    const existing = await prisma.approval.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      throw new AppError('Approval record not found.', 404);
    }

    await prisma.approval.delete({
      where: { id },
    });

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'APPROVAL_DELETE',
      details: { approvalId: id },
      ...meta,
    });

    res.status(200).json({ message: 'Approval request removed successfully.' });
  } catch (error) {
    next(error);
  }
}
