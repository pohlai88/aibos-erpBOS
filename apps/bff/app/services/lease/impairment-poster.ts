import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  leaseImpTest,
  leaseImpLine,
  leaseImpPostLock,
  leaseComponent,
  leaseCgu,
} from '@aibos/db-adapter/schema';
import { postJournal } from '@/services/gl/journals';

export class ImpairmentPoster {
  constructor(private dbInstance = db) {}

  /**
   * Post impairment journal entries
   */
  async postImpairmentTest(
    companyId: string,
    userId: string,
    testId: string,
    year: number,
    month: number,
    dryRun: boolean = false
  ): Promise<{
    journalId: string | null;
    status: string;
    message: string;
    journalLines: Array<{
      leaseComponentId: string;
      componentCode: string;
      drAccount: string;
      crAccount: string;
      amount: number;
      memo: string;
    }>;
  }> {
    // Get impairment test details
    const test = await this.dbInstance
      .select({
        id: leaseImpTest.id,
        cguId: leaseImpTest.cguId,
        loss: leaseImpTest.loss,
        status: leaseImpTest.status,
        cguCode: leaseCgu.code,
        cguName: leaseCgu.name,
      })
      .from(leaseImpTest)
      .innerJoin(leaseCgu, eq(leaseImpTest.cguId, leaseCgu.id))
      .where(
        and(eq(leaseImpTest.id, testId), eq(leaseImpTest.companyId, companyId))
      )
      .limit(1);

    if (test.length === 0) {
      throw new Error('Impairment test not found');
    }

    if (test[0]?.status === 'POSTED') {
      throw new Error('Impairment test is already posted');
    }

    if (Number(test[0]?.loss || 0) <= 0) {
      return {
        journalId: null,
        status: 'SKIPPED',
        message: 'No impairment loss to post',
        journalLines: [],
      };
    }

    // Check for existing post lock
    if (!dryRun) {
      const existingLock = await this.dbInstance
        .select()
        .from(leaseImpPostLock)
        .where(
          and(
            eq(leaseImpPostLock.impairTestId, testId),
            eq(leaseImpPostLock.year, year),
            eq(leaseImpPostLock.month, month)
          )
        )
        .limit(1);

      if (existingLock.length > 0) {
        throw new Error(
          `Impairment test ${testId} for period ${year}-${month.toString().padStart(2, '0')} is already posted`
        );
      }
    }

    // Get impairment lines
    const lines = await this.dbInstance
      .select({
        id: leaseImpLine.id,
        leaseComponentId: leaseImpLine.leaseComponentId,
        loss: leaseImpLine.loss,
        componentCode: leaseComponent.code,
        componentName: leaseComponent.name,
      })
      .from(leaseImpLine)
      .innerJoin(
        leaseComponent,
        eq(leaseImpLine.leaseComponentId, leaseComponent.id)
      )
      .where(eq(leaseImpLine.testId, testId));

    // Prepare journal lines
    const journalLines = [];
    const journalEntries = [];

    for (const line of lines) {
      if (Number(line.loss || 0) > 0) {
        const journalLine = {
          leaseComponentId: line.leaseComponentId,
          componentCode: line.componentCode,
          drAccount: 'IMPAIRMENT_LOSS', // This would be mapped to actual GL account
          crAccount: 'ACCUMULATED_IMPAIRMENT_ROU', // This would be mapped to actual GL account
          amount: Number(line.loss || 0),
          memo: `Impairment loss - ${line.componentCode} (CGU: ${test[0]?.cguCode})`,
        };

        journalLines.push(journalLine);
        journalEntries.push({
          account: journalLine.drAccount,
          drCr: 'DR',
          amount: journalLine.amount,
          memo: journalLine.memo,
          dimension1: line.leaseComponentId, // Component dimension
          dimension2: test[0]?.cguId, // CGU dimension
        });
        journalEntries.push({
          account: journalLine.crAccount,
          drCr: 'CR',
          amount: journalLine.amount,
          memo: journalLine.memo,
          dimension1: line.leaseComponentId,
          dimension2: test[0]?.cguId,
        });
      }
    }

    if (dryRun) {
      return {
        journalId: null,
        status: 'DRY_RUN',
        message: `Would post ${journalLines.length} impairment journal lines`,
        journalLines,
      };
    }

    // Post journal entry
    const journalResult = await postJournal(companyId, {
      date: new Date(year, month - 1, 1),
      memo: `Impairment loss posting - CGU: ${test[0]?.cguCode}`,
      lines: journalEntries.map(entry => {
        const line: any = {
          accountId: entry.account,
          description: entry.memo,
        };
        if (entry.drCr === 'DR') {
          line.debit = entry.amount;
        } else {
          line.credit = entry.amount;
        }
        return line;
      }),
    });

    // Create post lock
    await this.dbInstance.insert(leaseImpPostLock).values({
      id: ulid(),
      companyId,
      impairTestId: testId,
      year,
      month,
      journalId: journalResult.journalId,
      postedAt: new Date(),
      postedBy: userId,
      createdAt: new Date(),
    });

    // Update test status
    await this.dbInstance
      .update(leaseImpTest)
      .set({
        status: 'POSTED',
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(leaseImpTest.id, testId));

    // Update line posted status
    await this.dbInstance
      .update(leaseImpLine)
      .set({ posted: true })
      .where(eq(leaseImpLine.testId, testId));

    return {
      journalId: journalResult.journalId,
      status: 'POSTED',
      message: `Posted impairment journal ${journalResult.journalId} with ${journalLines.length} lines`,
      journalLines,
    };
  }

  /**
   * Reverse impairment (if allowed by IAS 36)
   */
  async reverseImpairment(
    companyId: string,
    userId: string,
    testId: string,
    year: number,
    month: number,
    reversalAmount: number,
    dryRun: boolean = false
  ): Promise<{
    journalId: string | null;
    status: string;
    message: string;
  }> {
    // Get impairment test and lines
    const test = await this.dbInstance
      .select({
        id: leaseImpTest.id,
        cguId: leaseImpTest.cguId,
        loss: leaseImpTest.loss,
        reversalCap: leaseImpTest.reversalCap,
        cguCode: leaseCgu.code,
        cguName: leaseCgu.name,
      })
      .from(leaseImpTest)
      .innerJoin(leaseCgu, eq(leaseImpTest.cguId, leaseCgu.id))
      .where(
        and(eq(leaseImpTest.id, testId), eq(leaseImpTest.companyId, companyId))
      )
      .limit(1);

    if (test.length === 0) {
      throw new Error('Impairment test not found');
    }

    // Check reversal cap
    if (reversalAmount > Number(test[0]?.reversalCap || 0)) {
      throw new Error(
        `Reversal amount ${reversalAmount} exceeds reversal cap ${test[0]?.reversalCap}`
      );
    }

    // Get impairment lines for reversal allocation
    const lines = await this.dbInstance
      .select({
        id: leaseImpLine.id,
        leaseComponentId: leaseImpLine.leaseComponentId,
        loss: leaseImpLine.loss,
        reversalCap: leaseImpLine.reversalCap,
        componentCode: leaseComponent.code,
      })
      .from(leaseImpLine)
      .innerJoin(
        leaseComponent,
        eq(leaseImpLine.leaseComponentId, leaseComponent.id)
      )
      .where(eq(leaseImpLine.testId, testId));

    // Prepare reversal journal entries
    const journalEntries = [];

    for (const line of lines) {
      const lineReversalAmount =
        reversalAmount * (Number(line.loss || 0) / Number(test[0]?.loss || 1));

      if (lineReversalAmount > 0) {
        // Dr Accumulated Impairment, Cr Impairment Reversal
        journalEntries.push({
          account: 'ACCUMULATED_IMPAIRMENT_ROU',
          drCr: 'DR',
          amount: lineReversalAmount,
          memo: `Impairment reversal - ${line.componentCode} (CGU: ${test[0]?.cguCode})`,
          dimension1: line.leaseComponentId,
          dimension2: test[0]?.cguId,
        });
        journalEntries.push({
          account: 'IMPAIRMENT_REVERSAL',
          drCr: 'CR',
          amount: lineReversalAmount,
          memo: `Impairment reversal - ${line.componentCode} (CGU: ${test[0]?.cguCode})`,
          dimension1: line.leaseComponentId,
          dimension2: test[0]?.cguId,
        });
      }
    }

    if (dryRun) {
      return {
        journalId: null,
        status: 'DRY_RUN',
        message: `Would post impairment reversal of ${reversalAmount}`,
      };
    }

    // Post reversal journal entry
    const journalResult = await postJournal(companyId, {
      date: new Date(year, month - 1, 1),
      memo: `Impairment reversal - CGU: ${test[0]?.cguCode}`,
      lines: journalEntries.map(entry => {
        const line: any = {
          accountId: entry.account,
          description: entry.memo,
        };
        if (entry.drCr === 'DR') {
          line.debit = entry.amount;
        } else {
          line.credit = entry.amount;
        }
        return line;
      }),
    });

    return {
      journalId: journalResult.journalId,
      status: 'POSTED',
      message: `Posted impairment reversal journal ${journalResult.journalId}`,
    };
  }

  /**
   * Get posting history for impairment test
   */
  async getPostingHistory(testId: string) {
    const history = await this.dbInstance
      .select({
        id: leaseImpPostLock.id,
        year: leaseImpPostLock.year,
        month: leaseImpPostLock.month,
        journalId: leaseImpPostLock.journalId,
        postedAt: leaseImpPostLock.postedAt,
        postedBy: leaseImpPostLock.postedBy,
      })
      .from(leaseImpPostLock)
      .where(eq(leaseImpPostLock.impairTestId, testId))
      .orderBy(desc(leaseImpPostLock.year), desc(leaseImpPostLock.month));

    return history;
  }
}
