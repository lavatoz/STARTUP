import { prisma } from '../../config/database';
import { DisplayIdGenerator } from '../../services/display-id.service';
import { AppError } from '../../middleware/error';

export class EventsService {
  static async createEvent(organizationId: string, body: any) {
    // Verify client exists in org context
    const client = await prisma.client.findFirst({
      where: { id: body.clientId, organizationId, deletedAt: null },
    });
    if (!client) {
      throw new AppError('Client record not found in this organization.', 404);
    }

    const eventCode = await DisplayIdGenerator.getNextId('EVT');

    return prisma.event.create({
      data: {
        organizationId,
        id: body.id || `event_${Date.now()}`,
        clientId: body.clientId,
        name: body.name,
        date: new Date(body.date),
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        progress: body.progress || 0,
        actualCompletedAt: body.actualCompletedAt ? new Date(body.actualCompletedAt) : null,
        brideLocation: body.brideLocation || null,
        groomLocation: body.groomLocation || null,
        venueLocation: body.venueLocation || null,
        notes: body.notes || null,
        status: body.status || 'Scheduled',
        eventCode,
      },
    });
  }
}
