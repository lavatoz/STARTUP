import { Request, Response, NextFunction } from 'express';
import '../../middleware/tenant';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error';
import { Role } from '@prisma/client';
import { logAudit, extractReqMeta } from '../../services/audit.service';
import {
  assignPersonnelToEvent,
  removePersonnelFromEvent,
  removeAssignmentById,
} from '../../services/team-assignment.service';

/**
 * Get all personnel from registry (including assigned events)
 */
export async function getPersonnel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.userContext!.organizationId;

    const personnelList = await prisma.personnel.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
      include: {
        assignments: {
          include: {
            event: true,
          },
        },
      },
    });

    const response = personnelList.map((person) => {
      const assignedEvents = person.assignments.map((a) => ({
        id: a.event.id,
        name: a.event.name,
        title: a.event.name,
      }));
      const { assignments, ...rest } = person;
      return {
        ...rest,
        assignedEvents,
      };
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get personnel member by ID
 */
export async function getPersonnelById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const orgId = req.userContext!.organizationId;

    const person = await prisma.personnel.findFirst({
      where: { id, organizationId: orgId },
      include: {
        assignments: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!person) {
      throw new AppError('Personnel not found.', 404);
    }

    const assignedEvents = person.assignments.map((a) => ({
      id: a.event.id,
      name: a.event.name,
      title: a.event.name,
    }));

    const { assignments, ...rest } = person;

    res.status(200).json({
      personnel: {
        ...rest,
        assignedEvents,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add personnel member to registry
 */
export async function createPersonnel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const body = req.body;
    const meta = extractReqMeta(req);
    const orgId = req.userContext!.organizationId;

    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can add personnel to registry.', 403);
    }

    const person = await prisma.personnel.create({
      data: {
        organizationId: orgId,
        name: body.name,
        role: body.role,
        phone: body.phone || null,
        email: body.email || null,
        rate: body.rate || null,
        status: body.status || 'Active',
      },
    });

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'PERSONNEL_CREATE',
      details: { personnelId: person.id, name: person.name, role: person.role },
      ...meta,
    });

    res.status(201).json(person);
  } catch (error) {
    next(error);
  }
}

/**
 * Update personnel profile
 */
export async function updatePersonnel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    const body = req.body;
    const meta = extractReqMeta(req);
    const orgId = req.userContext!.organizationId;

    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can modify personnel records.', 403);
    }

    const existing = await prisma.personnel.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      throw new AppError('Personnel record not found.', 404);
    }

    const updated = await prisma.personnel.update({
      where: { id, organizationId: orgId },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        role: body.role !== undefined ? body.role : existing.role,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: body.email !== undefined ? body.email : existing.email,
        rate: body.rate !== undefined ? body.rate : existing.rate,
        status: body.status !== undefined ? body.status : existing.status,
      },
    });

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'PERSONNEL_UPDATE',
      details: { personnelId: id, name: updated.name },
      ...meta,
    });

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

/**
 * Remove personnel member from registry
 */
export async function deletePersonnel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    const meta = extractReqMeta(req);
    const orgId = req.userContext!.organizationId;

    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can remove personnel records.', 403);
    }

    const existing = await prisma.personnel.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      throw new AppError('Personnel record not found.', 404);
    }

    await prisma.personnel.delete({
      where: { id, organizationId: orgId },
    });

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'PERSONNEL_DELETE',
      details: { personnelId: id, name: existing.name },
      ...meta,
    });

    res.status(200).json({ message: 'Personnel member removed from registry successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign an event to a personnel member
 */
export async function assignEventToPersonnel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const orgId = req.userContext!.organizationId;
    const { personnelId, eventId, notes } = req.body;
    const meta = extractReqMeta(req);

    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can assign events to personnel.', 403);
    }

    // Verify scope
    const person = await prisma.personnel.findFirst({ where: { id: personnelId, organizationId: orgId } });
    const event = await prisma.event.findFirst({ where: { id: eventId, organizationId: orgId } });
    if (!person || !event) {
      throw new AppError('Personnel or Event not found in this organization.', 404);
    }

    const assignment = await assignPersonnelToEvent(personnelId, eventId, user.id, notes);

    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'PERSONNEL_ASSIGN',
      details: { assignmentId: assignment.id, personnelId, eventId },
      ...meta,
    });

    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
}

/**
 * Remove an event assignment from a personnel member
 */
export async function removeEventAssignment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const orgId = req.userContext!.organizationId;
    const meta = extractReqMeta(req);

    if (user.role !== Role.SystemAdmin && user.role !== Role.Manager) {
      throw new AppError('Only administrators or managers can modify personnel event assignments.', 403);
    }

    const { id } = req.params;
    const { personnelId, eventId } = req.body;

    if (id) {
      const assignment = await prisma.staffAssignment.findFirst({
        where: { id, project: { organizationId: orgId } }
      });
      if (!assignment) {
        throw new AppError('Assignment not found in this organization.', 404);
      }

      await removeAssignmentById(id);

      await logAudit({
        userId: user.id,
        organizationId: orgId,
        action: 'PERSONNEL_UNASSIGN',
        details: { assignmentId: id, personnelId: assignment.userId, eventIds: assignment.eventIds },
        ...meta,
      });
      res.status(200).json({ message: 'Personnel assignment removed successfully.' });
      return;
    }

    const targetPersonnelId = personnelId || (req.query.personnelId as string);
    const targetEventId = eventId || (req.query.eventId as string);

    if (targetPersonnelId && targetEventId) {
      // Verify scope
      const person = await prisma.personnel.findFirst({ where: { id: targetPersonnelId, organizationId: orgId } });
      const event = await prisma.event.findFirst({ where: { id: targetEventId, organizationId: orgId } });
      if (!person || !event) {
        throw new AppError('Personnel or Event not found in this organization.', 404);
      }

      const assignment = await removePersonnelFromEvent(targetPersonnelId, targetEventId);
      await logAudit({
        userId: user.id,
        organizationId: orgId,
        action: 'PERSONNEL_UNASSIGN',
        details: { assignmentId: assignment.id, personnelId: targetPersonnelId, eventId: targetEventId },
        ...meta,
      });
      res.status(200).json({ message: 'Personnel assignment removed successfully.' });
      return;
    }

    throw new AppError('Assignment ID or personnelId/eventId parameters are required.', 400);
  } catch (error) {
    next(error);
  }
}
