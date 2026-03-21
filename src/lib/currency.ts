// Locale mapping for proper currency formatting
const CURRENCY_LOCALES: Record<string, string> = {
  EUR: "de-DE",
  USD: "en-US",
  GBP: "en-GB",
  CHF: "de-CH",
  SEK: "sv-SE",
  NOK: "nb-NO",
  DKK: "da-DK",
  PLN: "pl-PL",
  CZK: "cs-CZ",
  HUF: "hu-HU",
  RON: "ro-RO",
  BGN: "bg-BG",
  CAD: "en-CA",
  AUD: "en-AU",
  JPY: "ja-JP",
};

export const SUPPORTED_CURRENCIES = [
  { code: "EUR", name: "Euro", symbol: "\u20ac" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "GBP", name: "British Pound", symbol: "\u00a3" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "PLN", name: "Polish Zloty", symbol: "z\u0142" },
  { code: "CZK", name: "Czech Koruna", symbol: "K\u010d" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "\u043b\u0432" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "\u00a5" },
] as const;

export function formatCurrency(
  amount: number,
  currency: string = "EUR"
): string {
  const locale = CURRENCY_LOCALES[currency] || "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function convertAmount(
  amount: number,
  exchangeRate: number
): number {
  return Math.round(amount * exchangeRate * 100) / 100;
}
