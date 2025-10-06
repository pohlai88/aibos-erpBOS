import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, sum, asc } from 'drizzle-orm';
import {
  leaseCgu,
  leaseCguLink,
  leaseComponent,
  leaseComponentSched,
  lease,
} from '@aibos/db-adapter/schema';
import type {
  CGUUpsertType,
  CGUQueryType,
  CGULinkUpsertType,
} from '@aibos/contracts';

export class CGUAllocator {
  constructor(private dbInstance = db) {}

  /**
   * Create or update CGU
   */
  async upsertCGU(
    companyId: string,
    userId: string,
    data: CGUUpsertType
  ): Promise<string> {
    const cguId = ulid();

    await this.dbInstance.insert(leaseCgu).values({
      id: cguId,
      companyId,
      code: data.code,
      name: data.name,
      notes: data.notes || null,
      createdAt: new Date(),
      createdBy: userId,
      updatedAt: new Date(),
      updatedBy: userId,
    });

    return cguId;
  }

  /**
   * Query CGUs
   */
  async queryCGUs(companyId: string, query: CGUQueryType) {
    const conditions = [eq(leaseCgu.companyId, companyId)];

    if (query.code) {
      conditions.push(eq(leaseCgu.code, query.code));
    }

    const cgus = await this.dbInstance
      .select({
        id: leaseCgu.id,
        code: leaseCgu.code,
        name: leaseCgu.name,
        notes: leaseCgu.notes,
        createdAt: leaseCgu.createdAt,
        createdBy: leaseCgu.createdBy,
        updatedAt: leaseCgu.updatedAt,
        updatedBy: leaseCgu.updatedBy,
      })
      .from(leaseCgu)
      .where(and(...conditions))
      .orderBy(asc(leaseCgu.code))
      .limit(query.limit)
      .offset(query.offset);

    return cgus;
  }

  /**
   * Create CGU allocation link
   */
  async createCGULink(
    userId: string,
    data: CGULinkUpsertType
  ): Promise<string> {
    const linkId = ulid();

    await this.dbInstance.insert(leaseCguLink).values({
      id: linkId,
      leaseComponentId: data.lease_component_id,
      cguId: data.cgu_id,
      weight: data.weight.toString(),
      createdAt: new Date(),
      createdBy: userId,
    });

    return linkId;
  }

  /**
   * Get CGU allocation for a lease component
   */
  async getCGUAllocation(leaseComponentId: string) {
    const allocation = await this.dbInstance
      .select({
        id: leaseCguLink.id,
        cguId: leaseCguLink.cguId,
        weight: leaseCguLink.weight,
        cguCode: leaseCgu.code,
        cguName: leaseCgu.name,
      })
      .from(leaseCguLink)
      .innerJoin(leaseCgu, eq(leaseCguLink.cguId, leaseCgu.id))
      .where(eq(leaseCguLink.leaseComponentId, leaseComponentId));

    return allocation;
  }

  /**
   * Calculate carrying amounts for CGU components
   */
  async calculateCGUCarryingAmounts(
    companyId: string,
    cguId: string,
    asOfDate: string
  ): Promise<
    Array<{
      leaseComponentId: string;
      componentCode: string;
      componentName: string;
      carryingAmount: number;
      allocationWeight: number;
    }>
  > {
    // Get all components allocated to this CGU
    const components = await this.dbInstance
      .select({
        leaseComponentId: leaseCguLink.leaseComponentId,
        allocationWeight: leaseCguLink.weight,
        componentCode: leaseComponent.code,
        componentName: leaseComponent.name,
      })
      .from(leaseCguLink)
      .innerJoin(
        leaseComponent,
        eq(leaseCguLink.leaseComponentId, leaseComponent.id)
      )
      .where(eq(leaseCguLink.cguId, cguId));

    const carryingAmounts = [];

    for (const component of components) {
      // Get the latest schedule for this component to calculate carrying amount
      const latestSchedule = await this.dbInstance
        .select({
          closeCarry: leaseComponentSched.closeCarry,
        })
        .from(leaseComponentSched)
        .where(
          and(
            eq(
              leaseComponentSched.leaseComponentId,
              component.leaseComponentId
            ),
            sql`${leaseComponentSched.year} || '-' || LPAD(${leaseComponentSched.month}::text, 2, '0') <= ${asOfDate}`
          )
        )
        .orderBy(
          desc(leaseComponentSched.year),
          desc(leaseComponentSched.month)
        )
        .limit(1);

      if (latestSchedule.length > 0) {
        const schedule = latestSchedule[0]!;
        const carryingAmount = Number(schedule.closeCarry || 0);

        carryingAmounts.push({
          leaseComponentId: component.leaseComponentId,
          componentCode: component.componentCode,
          componentName: component.componentName,
          carryingAmount,
          allocationWeight: Number(component.allocationWeight),
        });
      }
    }

    return carryingAmounts;
  }

  /**
   * Validate CGU allocation weights sum to 1.0
   */
  async validateCGUAllocation(cguId: string): Promise<{
    isValid: boolean;
    totalWeight: number;
    components: Array<{
      leaseComponentId: string;
      weight: number;
    }>;
  }> {
    const allocations = await this.dbInstance
      .select({
        leaseComponentId: leaseCguLink.leaseComponentId,
        weight: leaseCguLink.weight,
      })
      .from(leaseCguLink)
      .where(eq(leaseCguLink.cguId, cguId));

    const totalWeight = allocations.reduce(
      (sum, alloc) => sum + Number(alloc.weight),
      0
    );
    const isValid = Math.abs(totalWeight - 1.0) < 0.0001; // Allow for small rounding differences

    return {
      isValid,
      totalWeight,
      components: allocations.map(alloc => ({
        leaseComponentId: alloc.leaseComponentId,
        weight: Number(alloc.weight),
      })),
    };
  }

  /**
   * Get CGU summary with component count and total carrying amount
   */
  async getCGUSummary(companyId: string, cguId: string, asOfDate: string) {
    const cguData = await this.dbInstance
      .select({
        id: leaseCgu.id,
        code: leaseCgu.code,
        name: leaseCgu.name,
        notes: leaseCgu.notes,
      })
      .from(leaseCgu)
      .where(and(eq(leaseCgu.companyId, companyId), eq(leaseCgu.id, cguId)))
      .limit(1);

    if (cguData.length === 0) {
      throw new Error('CGU not found');
    }

    const carryingAmounts = await this.calculateCGUCarryingAmounts(
      companyId,
      cguId,
      asOfDate
    );
    const totalCarryingAmount = carryingAmounts.reduce(
      (sum, comp) => sum + comp.carryingAmount,
      0
    );

    return {
      ...cguData[0],
      componentCount: carryingAmounts.length,
      totalCarryingAmount,
      components: carryingAmounts,
    };
  }
}
