export function asDate(input: string | number | Date): Date {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) throw new TypeError('Invalid date input');
  return d;
}

export function asISO(input: string | number | Date): string {
  return asDate(input).toISOString();
}
