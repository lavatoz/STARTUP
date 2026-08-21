import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class DisplayIdGenerator {
  /**
   * Safe, sequential, concurrent-safe Display ID generation using the DocumentCounter table.
   * Format: <PREFIX>-<YYYY>-<4-DIGIT-SEQUENCE> (e.g. CLI-2026-0001)
   */
  static async getNextId(
    prefix: 'CLI' | 'PRJ' | 'QUO' | 'INV' | 'AGR' | 'EVT',
    tx?: Prisma.TransactionClient,
    organizationId?: string
  ): Promise<string> {
    const client = tx || prisma;
    const year = new Date().getFullYear();

    let resolvedOrgId = organizationId;
    if (!resolvedOrgId) {
      const firstOrg = await client.organization.findFirst();
      resolvedOrgId = firstOrg?.id || 'default-org-id';
    }

    // Use Raw SQL for atomic locking and incrementing on the DocumentCounter table
    const result = await client.$queryRaw<Array<{ lastValue: number }>>`
      INSERT INTO "DocumentCounter" ("organizationId", "prefix", "type", "year", "lastValue")
      VALUES (${resolvedOrgId}, ${prefix}, 'DISPLAY_ID', ${year}, 1)
      ON CONFLICT ("organizationId", "prefix", "type", "year")
      DO UPDATE SET "lastValue" = "DocumentCounter"."lastValue" + 1
      RETURNING "lastValue";
    `;

    const lastValue = result[0]?.lastValue ?? 1;
    const formattedSeq = String(lastValue).padStart(4, '0');
    return `${prefix}-${year}-${formattedSeq}`;
  }
}
