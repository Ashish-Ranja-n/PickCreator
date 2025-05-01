import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (INR)
 * @param amount - The amount to format
 * @returns Formatted currency string without the currency symbol
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "0";

  // Format with Indian numbering system (e.g., 1,00,000 instead of 100,000)
  return amount.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
}
