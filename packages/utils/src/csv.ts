export type CsvRow = Record<string, string>;
export type CsvMapping<TFields extends string> = Record<TFields, string>; // map of fieldName -> csvHeader

export function mapRow<TFields extends string>(
  row: CsvRow,
  mapping: CsvMapping<TFields>
): Record<TFields, string> {
  const out = {} as Record<TFields, string>;
  (Object.keys(mapping) as TFields[]).forEach(key => {
    const header = mapping[key];
    if (!(header in row))
      throw new Error(`CSV missing header: ${header} for field ${String(key)}`);
    out[key] = row[header]!;
  });
  return out;
}
