import { Request, Response, NextFunction } from 'express';
import '../../middleware/tenant';
import { prisma } from '../../config/database';
import { logAudit, extractReqMeta } from '../../services/audit.service';
import { AppError } from '../../middleware/error';
import { Role } from '@prisma/client';

/**
 * Get all expenses
 */
export async function getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const orgId = req.userContext!.organizationId;

    let whereClause: any = { organizationId: orgId, deletedAt: null };

    // Limit Client roles to only see their own logged expenses
    if (user.role === Role.Client) {
      const client = await prisma.client.findFirst({
        where: { email: user.email, organizationId: orgId, deletedAt: null }
      });
      if (!client) {
        res.status(200).json([]);
        return;
      }
      whereClause.clientId = client.id;
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true, email: true, companyName: true } }
      },
      orderBy: { date: 'desc' },
    });

    res.status(200).json(expenses);
  } catch (error) {
    next(error);
  }
}

/**
 * Create new expense
 */
export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { description, amount, category, date, clientId, brand, divisionId } = req.body;
    const meta = extractReqMeta(req);
    const orgId = req.userContext!.organizationId;

    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can log expenses.', 403);
    }

    // Optional client verify
    if (clientId) {
      const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: orgId, deletedAt: null } });
      if (!client) throw new AppError('Client not found.', 400);
    }

    const expense = await prisma.expense.create({
      data: {
        organizationId: orgId,
        description,
        amount,
        category,
        date: new Date(date),
        clientId,
        brand,
        divisionId,
      },
    });

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'EXPENSE_CREATE',
      details: { expenseId: expense.id, amount },
      ...meta,
    });

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
}

/**
 * Update expense
 */
export async function updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    const body = req.body;
    const meta = extractReqMeta(req);
    const orgId = req.userContext!.organizationId;

    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can edit expenses.', 403);
    }

    const existing = await prisma.expense.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) throw new AppError('Expense not found.', 404);

    const expense = await prisma.expense.update({
      where: { id, organizationId: orgId },
      data: {
        ...body,
        date: body.date ? new Date(body.date) : undefined,
      },
    });

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'EXPENSE_UPDATE',
      details: { expenseId: id, updatedFields: Object.keys(body) },
      ...meta,
    });

    res.status(200).json(expense);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete expense (Soft Delete)
 */
export async function deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    const meta = extractReqMeta(req);
    const orgId = req.userContext!.organizationId;

    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can delete expenses.', 403);
    }

    const existing = await prisma.expense.findFirst({ where: { id, organizationId: orgId, deletedAt: null } });
    if (!existing) throw new AppError('Expense not found.', 404);

    await prisma.expense.update({
      where: { id, organizationId: orgId },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'EXPENSE_DELETE',
      details: { expenseId: id },
      ...meta,
    });

    res.status(200).json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
