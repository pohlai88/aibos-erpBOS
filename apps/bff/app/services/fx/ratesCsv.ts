import { parseCsv } from '../../utils/csv';
import { upsertRate } from './rates';

export async function importRatesCsv(
  companyId: string,
  actor: string,
  fileText: string,
  mapping?: Partial<Record<string, string>>
) {
  const rows = await parseCsv(fileText);
  let upserted = 0;
  const errors: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    try {
      const as_of_date = r[mapping?.as_of_date ?? 'as_of_date'];
      const src_ccy = r[mapping?.src_ccy ?? 'src_ccy'];
      const dst_ccy = r[mapping?.dst_ccy ?? 'dst_ccy'];
      const rateStr = r[mapping?.rate ?? 'rate'];

      if (!as_of_date || !src_ccy || !dst_ccy || !rateStr) {
        throw new Error('missing columns');
      }

      const rate = Number(rateStr);
      if (isNaN(rate) || rate <= 0) {
        throw new Error('invalid rate');
      }

      await upsertRate(companyId, actor, {
        as_of_date,
        src_ccy,
        dst_ccy,
        rate,
      });
      upserted++;
    } catch (e: any) {
      errors.push({ line: i + 2, error: e.message ?? String(e) });
    }
  }

  return { upserted, errors };
}
