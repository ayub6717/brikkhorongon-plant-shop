/** Formats a BDT amount with the ৳ sign, using the active locale's digits. */
export function formatPrice(amount: number, locale: string): string {
  const number = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `৳${number}`;
}
