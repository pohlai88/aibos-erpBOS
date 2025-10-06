import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';
import {
  lease,
  leaseCashflow,
  leaseOpening,
  leaseSchedule,
  leaseEvent,
  leasePostLock,
  leaseDisclosure,
  leaseAttachment,
} from '@aibos/db-adapter/schema';
import type {
  LeaseImportReqType,
  LeaseUpsertType,
  LeaseCashflowRowType,
} from '@aibos/contracts';
import { LeaseRegistrationService } from './registration';

export class LeaseImportService {
  constructor(private dbInstance = db) {}
  private registrationService = new LeaseRegistrationService();

  /**
   * Import leases from CSV with mapping and idempotency
   */
  async importFromCSV(
    companyId: string,
    userId: string,
    csvData: string,
    mapping: LeaseImportReqType['mapping'],
    contentHash?: string
  ): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Check for idempotency if content hash provided
    if (contentHash) {
      const existingImport = await this.dbInstance
        .select()
        .from(lease)
        .where(
          and(
            eq(lease.companyId, companyId),
            sql`EXISTS (
                        SELECT 1 FROM lease_attachment 
                        WHERE lease_id = lease.id 
                        AND description LIKE ${`%import_hash:${contentHash}%`}
                    )`
          )
        )
        .limit(1);

      if (existingImport.length > 0) {
        return {
          imported: 0,
          skipped: 0,
          errors: ['Import already processed'],
        };
      }
    }

    // Parse CSV data
    const rows = this.parseCSV(csvData);
    if (rows.length === 0) {
      throw new Error('No data found in CSV');
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i]!;
        const leaseData = this.mapRowToLease(row, mapping);
        const cashflows = this.mapRowToCashflows(row, mapping);

        // Validate lease data
        this.validateLeaseData(leaseData, cashflows);

        // Check if lease already exists
        const existingLease = await this.dbInstance
          .select()
          .from(lease)
          .where(
            and(
              eq(lease.companyId, companyId),
              eq(lease.leaseCode, leaseData.lease_code)
            )
          )
          .limit(1);

        if (existingLease.length > 0) {
          skipped++;
          continue;
        }

        // Create lease
        const leaseId = await this.registrationService.upsertLease(
          companyId,
          userId,
          leaseData,
          cashflows
        );

        // Record import hash for idempotency
        if (contentHash) {
          await this.dbInstance.insert(leaseAttachment).values({
            id: ulid(),
            leaseId,
            evidenceId: `import_hash_${contentHash}`,
            attachmentType: 'OTHER',
            description: `Import hash: ${contentHash}`,
            uploadedBy: userId,
            uploadedAt: new Date(),
          });
        }

        imported++;
      } catch (error) {
        errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Parse CSV data into rows
   */
  private parseCSV(csvData: string): Record<string, string>[] {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have header and at least one data row');
    }

    const headers = lines[0]!.split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]!.split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) {
        throw new Error(
          `Row ${i + 1} has ${values.length} columns, expected ${headers.length}`
        );
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  }

  /**
   * Map CSV row to lease data using provided mapping
   */
  private mapRowToLease(
    row: Record<string, string>,
    mapping: LeaseImportReqType['mapping']
  ): LeaseUpsertType {
    return {
      lease_code: row[mapping.lease_code] || '',
      lessor: row[mapping.lessor] || '',
      asset_class: this.mapAssetClass(row[mapping.asset_class] || ''),
      ccy: row[mapping.ccy] || 'USD',
      commence_on: this.parseDate(row[mapping.commence_on] || ''),
      end_on: this.parseDate(row[mapping.end_on] || ''),
      payment_frequency: this.mapPaymentFrequency(
        row[mapping.payment_frequency] || ''
      ),
      discount_rate: parseFloat(row[mapping.discount_rate] || '0'),
      rate_kind: 'fixed',
      index_code: undefined,
      short_term_exempt: false,
      low_value_exempt: false,
      present_ccy: undefined,
      status: 'DRAFT',
    };
  }

  /**
   * Map CSV row to cashflows using provided mapping
   */
  private mapRowToCashflows(
    row: Record<string, string>,
    mapping: LeaseImportReqType['mapping']
  ): LeaseCashflowRowType[] {
    try {
      const cashflowsJson = row[mapping.cashflows] || '[]';
      const parsed = JSON.parse(cashflowsJson);

      if (!Array.isArray(parsed)) {
        throw new Error('Cashflows must be an array');
      }

      return parsed.map((cf: any) => ({
        due_on: this.parseDate(cf.due_on || ''),
        amount: parseFloat(cf.amount || '0'),
        in_substance_fixed: cf.in_substance_fixed !== false,
        variable_flag: cf.variable_flag === true,
        index_base: cf.index_base ? parseFloat(cf.index_base) : undefined,
        index_link_id: cf.index_link_id || undefined,
      }));
    } catch (error) {
      throw new Error(
        `Invalid cashflows format: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate lease data before import
   */
  private validateLeaseData(
    leaseData: LeaseUpsertType,
    cashflows: LeaseCashflowRowType[]
  ): void {
    if (!leaseData.lease_code) {
      throw new Error('Lease code is required');
    }

    if (!leaseData.lessor) {
      throw new Error('Lessor is required');
    }

    if (!leaseData.commence_on || !leaseData.end_on) {
      throw new Error('Commencement and end dates are required');
    }

    const commenceDate = new Date(leaseData.commence_on);
    const endDate = new Date(leaseData.end_on);

    if (endDate <= commenceDate) {
      throw new Error('End date must be after commencement date');
    }

    if (leaseData.discount_rate <= 0 || leaseData.discount_rate >= 1) {
      throw new Error('Discount rate must be between 0 and 1');
    }

    if (cashflows.length === 0) {
      throw new Error('At least one cashflow is required');
    }

    // Validate cashflows
    for (const cf of cashflows) {
      if (!cf.due_on) {
        throw new Error('Cashflow due date is required');
      }

      if (cf.amount <= 0) {
        throw new Error('Cashflow amount must be positive');
      }

      const cfDate = new Date(cf.due_on);
      if (cfDate < commenceDate || cfDate > endDate) {
        throw new Error('Cashflow date must be within lease term');
      }
    }
  }

  /**
   * Map asset class string to enum value
   */
  private mapAssetClass(
    assetClass: string
  ): 'Land/Building' | 'IT/Equipment' | 'Vehicles' | 'Others' {
    const normalized = assetClass.toLowerCase().trim();

    if (
      normalized.includes('land') ||
      normalized.includes('building') ||
      normalized.includes('office')
    ) {
      return 'Land/Building';
    }
    if (
      normalized.includes('it') ||
      normalized.includes('equipment') ||
      normalized.includes('computer')
    ) {
      return 'IT/Equipment';
    }
    if (
      normalized.includes('vehicle') ||
      normalized.includes('car') ||
      normalized.includes('truck')
    ) {
      return 'Vehicles';
    }

    return 'Others';
  }

  /**
   * Map payment frequency string to enum value
   */
  private mapPaymentFrequency(
    frequency: string
  ): 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' {
    const normalized = frequency.toLowerCase().trim();

    if (normalized.includes('month')) {
      return 'MONTHLY';
    }
    if (normalized.includes('quarter')) {
      return 'QUARTERLY';
    }
    if (normalized.includes('annual') || normalized.includes('year')) {
      return 'ANNUALLY';
    }

    return 'MONTHLY'; // Default
  }

  /**
   * Parse date string to YYYY-MM-DD format
   */
  private parseDate(dateStr: string): string {
    if (!dateStr) {
      throw new Error('Date is required');
    }

    // Try various date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    ];

    let parsedDate: Date;

    if (formats[0]!.test(dateStr)) {
      parsedDate = new Date(dateStr);
    } else if (formats[1]!.test(dateStr)) {
      const [month, day, year] = dateStr.split('/');
      parsedDate = new Date(
        parseInt(year!),
        parseInt(month!) - 1,
        parseInt(day!)
      );
    } else if (formats[2]!.test(dateStr)) {
      const [month, day, year] = dateStr.split('-');
      parsedDate = new Date(
        parseInt(year!),
        parseInt(month!) - 1,
        parseInt(day!)
      );
    } else if (formats[3]!.test(dateStr)) {
      const [year, month, day] = dateStr.split('/');
      parsedDate = new Date(
        parseInt(year!),
        parseInt(month!) - 1,
        parseInt(day!)
      );
    } else {
      parsedDate = new Date(dateStr);
    }

    if (isNaN(parsedDate.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    return parsedDate.toISOString().split('T')[0]!;
  }

  /**
   * Get import template for CSV mapping
   */
  getImportTemplate(): string {
    return `lease_code,lessor,asset_class,ccy,commence_on,end_on,payment_frequency,discount_rate,cashflows
OFFICE-HCMC-01,ABC Properties Ltd,Building,VND,2025-01-01,2027-12-31,MONTHLY,0.085,"[{""due_on"":""2025-01-31"",""amount"":12000000,""in_substance_fixed"":true}]"
EQUIPMENT-001,XYZ Equipment Co,IT/Equipment,USD,2025-02-01,2028-01-31,QUARTERLY,0.075,"[{""due_on"":""2025-04-30"",""amount"":5000,""in_substance_fixed"":true}]"`;
  }
}
