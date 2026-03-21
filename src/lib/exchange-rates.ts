import { prisma } from "@/lib/db";

const ECB_URL = "https://data-api.ecb.europa.eu/service/data/EXR/D..EUR.SP00.A?lastNObservations=1&format=csvdata";

// In-memory cache: rates keyed by "BASE-TARGET", refreshed daily
let ratesCache: Map<string, number> = new Map();
let lastFetched: Date | null = null;
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

function isCacheValid(): boolean {
  return lastFetched !== null && Date.now() - lastFetched.getTime() < CACHE_TTL_MS;
}

/**
 * Fetch latest ECB rates (EUR-based).
 * Returns a map of currency code -> rate (1 EUR = X currency).
 */
async function fetchECBRates(): Promise<Map<string, number>> {
  const rates = new Map<string, number>();
  rates.set("EUR", 1);

  try {
    const res = await fetch(ECB_URL, { next: { revalidate: 14400 } });
    if (!res.ok) throw new Error(`ECB API returned ${res.status}`);

    const csv = await res.text();
    const lines = csv.split("\n");

    // CSV header: find CURRENCY and OBS_VALUE columns
    const header = lines[0]?.split(",") || [];
    const currIdx = header.indexOf("CURRENCY");
    const valIdx = header.indexOf("OBS_VALUE");

    if (currIdx === -1 || valIdx === -1) throw new Error("Unexpected ECB CSV format");

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]?.split(",");
      if (!cols || cols.length <= Math.max(currIdx, valIdx)) continue;
      const currency = cols[currIdx]?.trim();
      const value = parseFloat(cols[valIdx]?.trim());
      if (currency && !isNaN(value) && value > 0) {
        rates.set(currency, value);
      }
    }
  } catch (error) {
    console.error("Failed to fetch ECB rates:", error);
    // Return whatever we have cached + EUR=1
  }

  return rates;
}

/**
 * Get exchange rate: 1 unit of `from` currency = X units of `to` currency.
 */
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;

  if (!isCacheValid()) {
    const ecbRates = await fetchECBRates();
    ratesCache = ecbRates;
    lastFetched = new Date();
  }

  // ECB rates are EUR-based: 1 EUR = X currency
  const fromRate = ratesCache.get(from);
  const toRate = ratesCache.get(to);

  if (fromRate === undefined || toRate === undefined) return null;

  // Cross rate: from -> EUR -> to
  const rate = toRate / fromRate;
  return Math.round(rate * 1000000) / 1000000;
}

/**
 * Get all available rates against a base currency.
 */
export async function getAllRates(baseCurrency: string = "EUR"): Promise<Record<string, number>> {
  if (!isCacheValid()) {
    const ecbRates = await fetchECBRates();
    ratesCache = ecbRates;
    lastFetched = new Date();
  }

  const baseRate = ratesCache.get(baseCurrency);
  if (!baseRate) return {};

  const result: Record<string, number> = {};
  ratesCache.forEach((rate, currency) => {
    result[currency] = Math.round((rate / baseRate) * 1000000) / 1000000;
  });
  return result;
}

/**
 * Convert an amount from one currency to another.
 * Uses invoice's stored exchangeRate if available, otherwise fetches live rate.
 */
export async function convertToBase(
  amount: number,
  fromCurrency: string,
  baseCurrency: string,
  storedExchangeRate?: number | null
): Promise<number> {
  if (fromCurrency === baseCurrency) return amount;

  // If we have a stored rate (1 EUR = X fromCurrency), invert it
  if (storedExchangeRate && storedExchangeRate > 0) {
    // storedExchangeRate means: 1 baseCurrency = storedExchangeRate fromCurrency
    return Math.round((amount / storedExchangeRate) * 100) / 100;
  }

  const rate = await getExchangeRate(fromCurrency, baseCurrency);
  if (rate === null) return amount; // Fallback: return unconverted

  return Math.round(amount * rate * 100) / 100;
}

/**
 * Get the business base currency from the profile.
 */
export async function getBaseCurrency(): Promise<string> {
  const profile = await prisma.businessProfile.findFirst({
    select: { defaultCurrency: true },
  });
  return profile?.defaultCurrency || "EUR";
}
