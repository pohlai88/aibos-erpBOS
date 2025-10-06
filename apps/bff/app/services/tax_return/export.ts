import { pool } from '../../lib/db';
import { ulid } from 'ulid';
import { TaxExportRequest, TaxExportRequestType } from '@aibos/contracts';
import { exportWithProfile } from './exporters';

export async function exportTaxReturn(
  runId: string,
  input: TaxExportRequestType
) {
  const validated = TaxExportRequest.parse(input);

  // Use profile-based export if profile is specified, otherwise fall back to legacy
  if (validated.profile) {
    const result = await exportWithProfile(runId, validated);

    // Save export snapshot
    const exportId = ulid();
    await pool.query(
      `INSERT INTO tax_return_export (id, run_id, format, filename, payload)
             VALUES ($1, $2, $3, $4, $5)`,
      [exportId, runId, result.format, result.filename, result.payload]
    );

    return {
      export_id: exportId,
      filename: result.filename,
      format: result.format,
      payload: result.payload,
      run_id: runId,
    };
  }

  // Legacy export logic (fallback)
  const { rows: runRows } = await pool.query(
    `SELECT tr.*, tp.name as partner_name 
         FROM tax_return_run tr
         JOIN tax_partner tp ON tp.company_id = tr.company_id AND tp.code = tr.partner_code
         WHERE tr.id = $1`,
    [runId]
  );

  if (runRows.length === 0) {
    throw new Error('Tax return run not found');
  }

  const run = runRows[0];

  // Get return lines
  const { rows: lineRows } = await pool.query(
    `SELECT trl.box_id, trl.amount, trt.box_label, trt.sign, trt.ordinal
         FROM tax_return_line trl
         JOIN tax_return_template trt ON trt.company_id = $1 AND trt.partner_code = $2 AND trt.version = $3 AND trt.box_id = trl.box_id
         WHERE trl.run_id = $4
         ORDER BY trt.ordinal`,
    [run.company_id, run.partner_code, run.version, runId]
  );

  // Generate export based on format
  let payload: string;
  let filename: string;

  switch (validated.format) {
    case 'CSV':
      payload = generateCsvExport(lineRows);
      filename = `tax_return_${run.partner_code}_${run.period_key}.csv`;
      break;
    case 'XML':
      payload = generateXmlExport(run, lineRows);
      filename = `tax_return_${run.partner_code}_${run.period_key}.xml`;
      break;
    case 'JSON':
      payload = generateJsonExport(run, lineRows);
      filename = `tax_return_${run.partner_code}_${run.period_key}.json`;
      break;
    default:
      throw new Error(`Unsupported export format: ${validated.format}`);
  }

  // Save export snapshot
  const exportId = ulid();
  await pool.query(
    `INSERT INTO tax_return_export (id, run_id, format, filename, payload)
         VALUES ($1, $2, $3, $4, $5)`,
    [exportId, runId, validated.format, filename, payload]
  );

  return {
    export_id: exportId,
    filename,
    format: validated.format,
    payload,
    run_id: runId,
  };
}

function generateCsvExport(lines: any[]): string {
  const headers = ['box_id', 'box_label', 'amount'];
  const csvRows = [headers.join(',')];

  for (const line of lines) {
    csvRows.push([line.box_id, `"${line.box_label}"`, line.amount].join(','));
  }

  return csvRows.join('\n');
}

function generateXmlExport(run: any, lines: any[]): string {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<tax_return>\n`;
  xml += `  <header>\n`;
  xml += `    <partner_code>${run.partner_code}</partner_code>\n`;
  xml += `    <partner_name>${run.partner_name}</partner_name>\n`;
  xml += `    <version>${run.version}</version>\n`;
  xml += `    <period>${run.period_key}</period>\n`;
  xml += `    <created_at>${run.created_at}</created_at>\n`;
  xml += `  </header>\n`;
  xml += `  <boxes>\n`;

  for (const line of lines) {
    xml += `    <box>\n`;
    xml += `      <id>${line.box_id}</id>\n`;
    xml += `      <label>${line.box_label}</label>\n`;
    xml += `      <amount>${line.amount}</amount>\n`;
    xml += `      <sign>${line.sign}</sign>\n`;
    xml += `    </box>\n`;
  }

  xml += `  </boxes>\n`;
  xml += `</tax_return>\n`;

  return xml;
}

function generateJsonExport(run: any, lines: any[]): string {
  const json = {
    header: {
      partner_code: run.partner_code,
      partner_name: run.partner_name,
      version: run.version,
      period: run.period_key,
      created_at: run.created_at,
    },
    boxes: lines.map(line => ({
      id: line.box_id,
      label: line.box_label,
      amount: line.amount,
      sign: line.sign,
    })),
  };

  return JSON.stringify(json, null, 2);
}

export async function getTaxReturnExports(runId: string) {
  const { rows } = await pool.query(
    `SELECT id, format, filename, created_at FROM tax_return_export WHERE run_id = $1 ORDER BY created_at DESC`,
    [runId]
  );
  return rows;
}
