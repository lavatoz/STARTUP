import { prisma } from '../../config/database';
import { DisplayIdGenerator } from '../../services/display-id.service';
import { Role } from '@prisma/client';
import crypto from 'crypto';
import { AppError } from '../../middleware/error';

export class ClientsService {
  static async createClient(body: any, _currentUser: any) {
    const orgId = _currentUser.organizationId!;

    // Business Validation within the active organization
    const existing = await prisma.client.findFirst({
      where: { email: body.email, organizationId: orgId, deletedAt: null },
    });

    if (existing) {
      throw new AppError('A client with this email already exists in this organization.', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new AppError('A user account with this email address already exists.', 400);
    }

    const nameParts = (body.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.slice(1).join(' ') || 'User';
    const setupToken = crypto.randomBytes(32).toString('hex');

    const { events, ...clientData } = body;

    // Run inside database transaction
    const client = await prisma.$transaction(async (tx) => {
      // 1. Generate unique sequential client display ID
      const clientCode = await DisplayIdGenerator.getNextId('CLI', tx, orgId);

      // 2. Create client record
      const newClient = await tx.client.create({
        data: {
          ...clientData,
          organizationId: orgId,
          clientCode,
        },
      });

      // 3. Provision User record with Pending Activation status
      const newUser = await tx.user.create({
        data: {
          email: newClient.email,
          passwordHash: null,
          firstName,
          lastName,
          role: Role.Client,
          mustChangePassword: true,
          emailVerified: true,
          setupToken,
          status: 'Pending Activation',
          linkedClientId: newClient.id,
        },
      });

      // 3b. Create organization membership for user
      await tx.organizationMember.create({
        data: {
          organizationId: orgId,
          userId: newUser.id,
          role: 'CLIENT',
          status: 'Active',
        },
      });

      // 4. Create events if any
      if (events && events.length > 0) {
        const eventsData = [];
        for (const ev of events) {
          const eventCode = await DisplayIdGenerator.getNextId('EVT', tx, orgId);
          eventsData.push({
            id: ev.id,
            organizationId: orgId,
            clientId: newClient.id,
            name: ev.name,
            date: new Date(ev.date),
            startTime: ev.startTime || null,
            endTime: ev.endTime || null,
            progress: ev.progress || 0,
            actualCompletedAt: ev.actualCompletedAt ? new Date(ev.actualCompletedAt) : null,
            brideLocation: ev.brideLocation || null,
            groomLocation: ev.groomLocation || null,
            venueLocation: ev.venueLocation || null,
            notes: ev.notes || null,
            status: ev.status || 'Scheduled',
            eventCode,
          });
        }
        await tx.event.createMany({
          data: eventsData,
        });
      }

      // 5. Provision default Project record
      const projectCode = await DisplayIdGenerator.getNextId('PRJ', tx, orgId);
      await tx.project.create({
        data: {
          organizationId: orgId,
          name: `${newClient.name}'s Project`,
          status: 'Draft',
          clientId: newClient.id,
          projectCode,
          stage: 'Booked',
        },
      });

      return newClient;
    });

    // Fetch and return the fully populated client in org context
    return prisma.client.findFirst({
      where: { id: client.id, organizationId: orgId },
      include: {
        events: {
          orderBy: { date: 'asc' },
        },
      },
    });
  }

  static async updateClient(id: string, body: any, _currentUser: any, existingClient: any) {
    const orgId = _currentUser.organizationId!;
    const { events, ...clientData } = body;

    const client = await prisma.$transaction(async (tx) => {
      // 1. Update client record in org context
      const updatedClient = await tx.client.update({
        where: { id, organizationId: orgId },
        data: clientData,
      });

      // 2. Sync corresponding User record if email or name changes
      if (clientData.email || clientData.name) {
        const userUpdateData: any = {};
        if (clientData.email) userUpdateData.email = clientData.email;
        if (clientData.name) {
          const nameParts = clientData.name.trim().split(/\s+/);
          userUpdateData.firstName = nameParts[0] || 'Client';
          userUpdateData.lastName = nameParts.slice(1).join(' ') || 'User';
        }

        await tx.user.updateMany({
          where: {
            OR: [
              { linkedClientId: id },
              { email: existingClient.email, role: Role.Client }
            ]
          },
          data: userUpdateData,
        });
      }

      // 3. Sync events differentially
      if (events) {
        // Fetch existing events from database for this client and organization context
        const dbEvents = await tx.event.findMany({
          where: { clientId: id, organizationId: orgId },
        });
        const dbEventIds = dbEvents.map((e) => e.id);
        const payloadEventIds = events.map((ev: any) => ev.id).filter(Boolean);

        // Identify event IDs to delete (exist in DB but not in payload)
        const eventIdsToDelete = dbEventIds.filter((dbId) => !payloadEventIds.includes(dbId));
        if (eventIdsToDelete.length > 0) {
          await tx.event.deleteMany({
            where: {
              id: { in: eventIdsToDelete },
              clientId: id,
              organizationId: orgId,
            },
          });
        }

        // Process additions and updates
        for (const ev of events) {
          const isExisting = ev.id && dbEventIds.includes(ev.id);
          if (isExisting) {
            // Update existing event in place
            await tx.event.update({
              where: { id: ev.id, organizationId: orgId },
              data: {
                name: ev.name,
                date: new Date(ev.date),
                startTime: ev.startTime || null,
                endTime: ev.endTime || null,
                progress: ev.progress || 0,
                actualCompletedAt: ev.actualCompletedAt ? new Date(ev.actualCompletedAt) : null,
                brideLocation: ev.brideLocation || null,
                groomLocation: ev.groomLocation || null,
                venueLocation: ev.venueLocation || null,
                notes: ev.notes || null,
                status: ev.status || 'Scheduled',
              },
            });
          } else {
            // Create new event record
            const eventCode = ev.eventCode || (await DisplayIdGenerator.getNextId('EVT', tx, orgId));
            await tx.event.create({
              data: {
                id: ev.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                organizationId: orgId,
                clientId: id,
                name: ev.name,
                date: new Date(ev.date),
                startTime: ev.startTime || null,
                endTime: ev.endTime || null,
                progress: ev.progress || 0,
                actualCompletedAt: ev.actualCompletedAt ? new Date(ev.actualCompletedAt) : null,
                brideLocation: ev.brideLocation || null,
                groomLocation: ev.groomLocation || null,
                venueLocation: ev.venueLocation || null,
                notes: ev.notes || null,
                status: ev.status || 'Scheduled',
                eventCode,
              },
            });
          }
        }
      }

      return updatedClient;
    });

    return prisma.client.findFirst({
      where: { id: client.id, organizationId: orgId },
      include: {
        events: {
          orderBy: { date: 'asc' },
        },
      },
    });
  }
}
