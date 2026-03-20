export const EU_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
] as const;

export function calculateLineItem(
  quantity: number,
  unitPrice: number,
  taxRate: number
): { netAmount: number; vatAmount: number; grossAmount: number } {
  const netAmount = Math.round(quantity * unitPrice * 100) / 100;
  const vatAmount = Math.round(netAmount * (taxRate / 100) * 100) / 100;
  const grossAmount = Math.round((netAmount + vatAmount) * 100) / 100;
  return { netAmount, vatAmount, grossAmount };
}

export function shouldReverseCharge(
  supplierCountry: string,
  clientCountry: string,
  clientVatId?: string | null
): boolean {
  const euCountries: readonly string[] = EU_COUNTRIES;
  if (supplierCountry === clientCountry) return false;
  if (!euCountries.includes(supplierCountry)) return false;
  if (!euCountries.includes(clientCountry)) return false;
  if (!clientVatId) return false;
  return true;
}

export function getVatBreakdown(
  lineItems: Array<{
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>
): Array<{ rate: number; netTotal: number; vatTotal: number }> {
  const grouped = new Map<number, { netTotal: number; vatTotal: number }>();

  for (const item of lineItems) {
    const { netAmount, vatAmount } = calculateLineItem(
      item.quantity,
      item.unitPrice,
      item.taxRate
    );

    const existing = grouped.get(item.taxRate);
    if (existing) {
      existing.netTotal = Math.round((existing.netTotal + netAmount) * 100) / 100;
      existing.vatTotal = Math.round((existing.vatTotal + vatAmount) * 100) / 100;
    } else {
      grouped.set(item.taxRate, { netTotal: netAmount, vatTotal: vatAmount });
    }
  }

  return Array.from(grouped.entries())
    .map(([rate, totals]) => ({ rate, ...totals }))
    .sort((a, b) => a.rate - b.rate);
}
