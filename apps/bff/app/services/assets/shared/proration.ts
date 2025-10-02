// M16.3: Proration Service
// Shared math utilities for proration calculations

export function prorate(
  amount: number, 
  dateISO: string, 
  basis: "days_in_month" | "half_month"
): number {
  if (basis === "half_month") {
    return amount / 2;
  }

  const d = new Date(dateISO);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const daysInMonth = end.getDate();
  const daysActive = daysInMonth - (d.getDate() - 1);
  
  return (amount * daysActive) / daysInMonth;
}

/**
 * Validates proration parameters
 */
export function validateProrationParams(
  amount: number,
  dateISO: string,
  basis: "days_in_month" | "half_month"
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: "Amount must be positive" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    return { valid: false, error: "Invalid date format (expected YYYY-MM-DD)" };
  }

  const date = new Date(dateISO);
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Invalid date" };
  }

  return { valid: true };
}

/**
 * Gets proration summary for a given month
 */
export function getProrationSummary(
  amount: number,
  dateISO: string,
  basis: "days_in_month" | "half_month"
): {
  fullAmount: number;
  proratedAmount: number;
  prorationFactor: number;
  daysInMonth: number;
  daysActive: number;
} {
  const d = new Date(dateISO);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const daysInMonth = end.getDate();
  const daysActive = basis === "half_month" 
    ? Math.ceil(daysInMonth / 2)
    : daysInMonth - (d.getDate() - 1);
  
  const prorationFactor = daysActive / daysInMonth;
  const proratedAmount = amount * prorationFactor;

  return {
    fullAmount: amount,
    proratedAmount,
    prorationFactor,
    daysInMonth,
    daysActive,
  };
}
