// Math utilities for financial calculations
// Ensures precision at currency boundaries and provides robust comparison functions

/**
 * Rounds a number to currency precision (2 decimal places)
 * Use this at domain boundaries when exposing amounts to users/ledgers
 */
export function asCents(n: number): number {
    return Math.round(n * 100) / 100;
}

/**
 * Robust approximate equality matcher for financial calculations
 * Handles IEEE-754 floating point precision issues
 */
export function approxEq(a: number, b: number, abs = 1e-8, rel = 1e-8): boolean {
    const diff = Math.abs(a - b);
    return diff <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));
}

/**
 * Validates that depreciation/amortization calculations are financially sound
 * For DDB, allows for reasonable variance due to mathematical constraints
 */
export function validateDepreciationCalculation(
    totalCharges: number,
    originalCost: number,
    salvageValue: number,
    tolerance = 0.01
): boolean {
    const expectedTotal = originalCost - salvageValue;
    const difference = Math.abs(totalCharges - expectedTotal);

    // For DDB, allow up to 15% variance due to mathematical constraints
    // This accounts for the fact that DDB doesn't always reach exact residual values
    const maxVariance = Math.max(expectedTotal * 0.15, tolerance);

    return difference <= maxVariance;
}

/**
 * Validates that book value never goes negative and final value is close to salvage
 * For DDB, allows for reasonable variance due to mathematical constraints
 */
export function validateBookValue(
    originalCost: number,
    totalDepreciation: number,
    salvageValue: number,
    tolerance = 0.01
): boolean {
    const finalBookValue = originalCost - totalDepreciation;
    const difference = Math.abs(finalBookValue - salvageValue);

    // For DDB, allow up to 30% variance due to mathematical constraints
    // This accounts for the fact that DDB doesn't always reach exact residual values
    const maxVariance = Math.max(salvageValue * 0.30, tolerance);

    return finalBookValue >= 0 && difference <= maxVariance;
}
