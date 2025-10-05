import { pool } from "../../../lib/db";
import { TaxExportRequestType } from "@aibos/contracts";

export interface ExportProfile {
    validate(run: any, lines: any[]): void;
    render(run: any, lines: any[]): string;
    filename(run: any): string;
}

export interface ExportResult {
    payload: string;
    filename: string;
    format: string;
}

// MY-SST-02-CSV Profile
export class MySst02CsvProfile implements ExportProfile {
    validate(run: any, lines: any[]): void {
        const requiredBoxes = ['OUTPUT_TAX', 'INPUT_TAX'];
        const presentBoxes = new Set(lines.map(l => l.box_id));

        for (const box of requiredBoxes) {
            if (!presentBoxes.has(box)) {
                throw new Error(`Required box ${box} is missing for SST-02 export`);
            }
        }

        // Validate amounts are properly rounded to 2dp
        for (const line of lines) {
            const rounded = Math.round(line.amount * 100) / 100;
            if (Math.abs(line.amount - rounded) > 0.001) {
                throw new Error(`Box ${line.box_id} amount ${line.amount} must be rounded to 2 decimal places`);
            }
        }

        // Validate NET_PAYABLE calculation
        const outputTax = lines.find(l => l.box_id === 'OUTPUT_TAX')?.amount || 0;
        const inputTax = lines.find(l => l.box_id === 'INPUT_TAX')?.amount || 0;
        const netPayable = outputTax - inputTax;

        if (Math.abs(netPayable) > 0 && Math.abs(netPayable) < 0.01) {
            throw new Error(`NET_PAYABLE amount ${netPayable} is too small - must be at least 0.01`);
        }
    }

    render(run: any, lines: any[]): string {
        const headers = ["Box ID", "Box Label", "Amount (RM)"];
        const csvRows = [headers.join(",")];

        // Sort by ordinal if available
        const sortedLines = lines.sort((a, b) => (a.ordinal || 0) - (b.ordinal || 0));

        for (const line of sortedLines) {
            csvRows.push([
                line.box_id,
                `"${line.box_label || line.box_id}"`,
                line.amount.toFixed(2)
            ].join(","));
        }

        return csvRows.join("\n");
    }

    filename(run: any): string {
        return `${run.partner_code}-${run.period_key}-${run.id}.csv`;
    }
}

// UK-VAT100-XML Profile
export class UkVat100XmlProfile implements ExportProfile {
    validate(run: any, lines: any[]): void {
        const requiredBoxes = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
        const presentBoxes = new Set(lines.map(l => l.box_id));

        for (const box of requiredBoxes) {
            if (!presentBoxes.has(box)) {
                throw new Error(`Required box ${box} is missing for VAT100 export`);
            }
        }

        // Validate amounts are integers (pennies)
        for (const line of lines) {
            if (line.amount % 1 !== 0) {
                throw new Error(`Box ${line.box_id} amount ${line.amount} must be in whole pennies for VAT100`);
            }
        }

        // Validate totals reconciliation
        const box1 = lines.find(l => l.box_id === '1')?.amount || 0;
        const box2 = lines.find(l => l.box_id === '2')?.amount || 0;
        const box3 = lines.find(l => l.box_id === '3')?.amount || 0;
        const box4 = lines.find(l => l.box_id === '4')?.amount || 0;
        const box5 = lines.find(l => l.box_id === '5')?.amount || 0;

        const calculatedBox5 = box1 + box2 + box3;
        if (Math.abs(box5 - calculatedBox5) > 0) {
            throw new Error(`Box 5 total ${box5} does not match sum of boxes 1+2+3 (${calculatedBox5})`);
        }
    }

    render(run: any, lines: any[]): string {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<VAT100>\n`;
        xml += `  <Header>\n`;
        xml += `    <Period>${run.period_key}</Period>\n`;
        xml += `    <PartnerCode>${run.partner_code}</PartnerCode>\n`;
        xml += `    <Version>${run.version}</Version>\n`;
        xml += `    <CreatedAt>${run.created_at}</CreatedAt>\n`;
        xml += `  </Header>\n`;
        xml += `  <Boxes>\n`;

        // Sort by box number
        const sortedLines = lines.sort((a, b) => {
            const aNum = parseInt(a.box_id);
            const bNum = parseInt(b.box_id);
            return aNum - bNum;
        });

        for (const line of sortedLines) {
            xml += `    <Box>\n`;
            xml += `      <Number>${line.box_id}</Number>\n`;
            xml += `      <Label>${line.box_label || line.box_id}</Label>\n`;
            xml += `      <Amount>${Math.round(line.amount)}</Amount>\n`;
            xml += `    </Box>\n`;
        }

        xml += `  </Boxes>\n`;
        xml += `</VAT100>\n`;

        return xml;
    }

    filename(run: any): string {
        return `${run.partner_code}-${run.period_key}-${run.id}.xml`;
    }
}

// Registry
const exporters: Record<string, ExportProfile> = {
    'MY-SST-02-CSV': new MySst02CsvProfile(),
    'UK-VAT100-XML': new UkVat100XmlProfile()
};

export function getExporter(profile: string): ExportProfile {
    const exporter = exporters[profile];
    if (!exporter) {
        throw new Error(`Unknown export profile: ${profile}`);
    }
    return exporter;
}

export function getAvailableProfiles(): string[] {
    return Object.keys(exporters);
}

export async function getDefaultProfile(companyId: string, partnerCode: string, version: string): Promise<string | null> {
    const { rows } = await pool.query(
        `SELECT format FROM tax_export_profile 
         WHERE company_id = $1 AND partner_code = $2 AND version = $3 AND is_default = true`,
        [companyId, partnerCode, version]
    );

    return rows.length > 0 ? rows[0].format : null;
}

export async function exportWithProfile(runId: string, input: TaxExportRequestType): Promise<ExportResult> {
    // Get run details
    const { rows: runRows } = await pool.query(
        `SELECT tr.*, tp.name as partner_name 
         FROM tax_return_run tr
         JOIN tax_partner tp ON tp.company_id = tr.company_id AND tp.code = tr.partner_code
         WHERE tr.id = $1`,
        [runId]
    );

    if (runRows.length === 0) {
        throw new Error("Tax return run not found");
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

    // Determine profile
    let profile: string;
    if (input.profile) {
        profile = input.profile;
    } else {
        const defaultProfile = await getDefaultProfile(run.company_id, run.partner_code, run.version);
        if (!defaultProfile) {
            throw new Error(`No default export profile found for ${run.partner_code} ${run.version}`);
        }
        profile = defaultProfile;
    }

    // Get exporter and validate
    const exporter = getExporter(profile);
    exporter.validate(run, lineRows);

    // Generate export
    const payload = exporter.render(run, lineRows);
    const filename = exporter.filename(run);

    return {
        payload,
        filename,
        format: input.format || 'CSV'
    };
}
