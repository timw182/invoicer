export const EU_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
] as const;

// Standard VAT rates by EU country (2024)
export const EU_VAT_RATES: Record<string, { standard: number; reduced: number[] }> = {
  AT: { standard: 20, reduced: [10, 13] },
  BE: { standard: 21, reduced: [6, 12] },
  BG: { standard: 20, reduced: [9] },
  HR: { standard: 25, reduced: [5, 13] },
  CY: { standard: 19, reduced: [5, 9] },
  CZ: { standard: 21, reduced: [12] },
  DK: { standard: 25, reduced: [] },
  EE: { standard: 22, reduced: [9] },
  FI: { standard: 25.5, reduced: [10, 14] },
  FR: { standard: 20, reduced: [5.5, 10] },
  DE: { standard: 19, reduced: [7] },
  GR: { standard: 24, reduced: [6, 13] },
  HU: { standard: 27, reduced: [5, 18] },
  IE: { standard: 23, reduced: [9, 13.5] },
  IT: { standard: 22, reduced: [4, 5, 10] },
  LV: { standard: 21, reduced: [5, 12] },
  LT: { standard: 21, reduced: [5, 9] },
  LU: { standard: 17, reduced: [8] },
  MT: { standard: 18, reduced: [5, 7] },
  NL: { standard: 21, reduced: [9] },
  PL: { standard: 23, reduced: [5, 8] },
  PT: { standard: 23, reduced: [6, 13] },
  RO: { standard: 19, reduced: [5, 9] },
  SK: { standard: 23, reduced: [5, 10] },
  SI: { standard: 22, reduced: [5, 9.5] },
  ES: { standard: 21, reduced: [4, 10] },
  SE: { standard: 25, reduced: [6, 12] },
};

// Common non-EU rates for reference
export const NON_EU_VAT_RATES: Record<string, number> = {
  GB: 20,
  CH: 8.1,
  NO: 25,
  US: 0, // Sales tax varies by state
};

export function getStandardRate(countryCode: string): number {
  return EU_VAT_RATES[countryCode]?.standard ?? NON_EU_VAT_RATES[countryCode] ?? 0;
}

export function getAvailableRates(countryCode: string): number[] {
  const eu = EU_VAT_RATES[countryCode];
  if (eu) return [eu.standard, ...eu.reduced, 0];
  const nonEu = NON_EU_VAT_RATES[countryCode];
  if (nonEu !== undefined) return [nonEu, 0];
  return [0];
}

// VAT ID format validation (basic patterns per country)
const VAT_ID_PATTERNS: Record<string, RegExp> = {
  AT: /^ATU\d{8}$/,
  BE: /^BE[01]\d{9}$/,
  BG: /^BG\d{9,10}$/,
  HR: /^HR\d{11}$/,
  CY: /^CY\d{8}[A-Z]$/,
  CZ: /^CZ\d{8,10}$/,
  DK: /^DK\d{8}$/,
  EE: /^EE\d{9}$/,
  FI: /^FI\d{8}$/,
  FR: /^FR[A-Z0-9]{2}\d{9}$/,
  DE: /^DE\d{9}$/,
  GR: /^EL\d{9}$/,
  HU: /^HU\d{8}$/,
  IE: /^IE\d{7}[A-Z]{1,2}$/,
  IT: /^IT\d{11}$/,
  LV: /^LV\d{11}$/,
  LT: /^LT\d{9,12}$/,
  LU: /^LU\d{8}$/,
  MT: /^MT\d{8}$/,
  NL: /^NL\d{9}B\d{2}$/,
  PL: /^PL\d{10}$/,
  PT: /^PT\d{9}$/,
  RO: /^RO\d{2,10}$/,
  SK: /^SK\d{10}$/,
  SI: /^SI\d{8}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  SE: /^SE\d{12}$/,
  GB: /^GB\d{9,12}$/,
};

export function validateVatId(vatId: string): { valid: boolean; country?: string; error?: string } {
  if (!vatId || vatId.length < 4) {
    return { valid: false, error: "VAT ID is too short" };
  }

  const cleaned = vatId.replace(/[\s.-]/g, "").toUpperCase();
  const countryPrefix = cleaned.substring(0, 2);

  // Greece uses "EL" prefix but country code is "GR"
  const countryCode = countryPrefix === "EL" ? "GR" : countryPrefix;
  const pattern = VAT_ID_PATTERNS[countryCode];

  if (!pattern) {
    // Unknown country prefix — accept but flag
    return { valid: true, country: countryCode };
  }

  if (!pattern.test(cleaned)) {
    return { valid: false, country: countryCode, error: `Invalid format for ${countryCode} VAT ID` };
  }

  return { valid: true, country: countryCode };
}

export function calculateLineItem(
  quantity: number,
  unitPrice: number,
  taxRate: number,
  discount: number = 0
): { netAmount: number; discountAmount: number; vatAmount: number; grossAmount: number } {
  const rawNet = Math.round(quantity * unitPrice * 100) / 100;
  const discountAmount = Math.round(rawNet * (discount / 100) * 100) / 100;
  const netAmount = Math.round((rawNet - discountAmount) * 100) / 100;
  const vatAmount = Math.round(netAmount * (taxRate / 100) * 100) / 100;
  const grossAmount = Math.round((netAmount + vatAmount) * 100) / 100;
  return { netAmount, discountAmount, vatAmount, grossAmount };
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
    discount?: number;
  }>
): Array<{ rate: number; netTotal: number; vatTotal: number }> {
  const grouped = new Map<number, { netTotal: number; vatTotal: number }>();

  for (const item of lineItems) {
    const { netAmount, vatAmount } = calculateLineItem(
      item.quantity,
      item.unitPrice,
      item.taxRate,
      item.discount ?? 0
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
