export function majorToMinor(major: number): number {
  return Math.round((Number(major) || 0) * 100);
}

export function minorToMajor(minor: number): number {
  return Math.round(Number(minor) || 0) / 100;
}

export function formatCurrencyMajor(amount: number, currency: string = 'INR'): string {
  const num = Number(amount) || 0;
  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${num.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyMinor(amountMinor: number, currency: string = 'INR'): string {
  const major = minorToMajor(amountMinor);
  return formatCurrencyMajor(major, currency);
}

export function calculateTax(subtotalMinor: number, taxRatePercent: number = 5.0): number {
  return Math.round((Number(subtotalMinor) || 0) * ((Number(taxRatePercent) || 0) / 100));
}

export function calculateDiscount(
  subtotalMinor: number,
  discount?: { type: 'PERCENT' | 'FIXED'; value: number }
): number {
  if (!discount || !discount.value || discount.value <= 0) return 0;
  const sub = Number(subtotalMinor) || 0;
  if (discount.type === 'PERCENT') {
    return Math.round(sub * (Math.min(discount.value, 100) / 100));
  }
  const discountMinor = majorToMinor(discount.value);
  return Math.min(discountMinor, sub);
}

export function calculateServiceCharge(subtotalMinor: number, serviceChargePercent: number = 0): number {
  if (!serviceChargePercent || serviceChargePercent <= 0) return 0;
  return Math.round((Number(subtotalMinor) || 0) * (serviceChargePercent / 100));
}

export function calculateBillTotal(
  subtotalMinor: number,
  taxMinor: number,
  serviceChargeMinor: number,
  discountMinor: number
): number {
  return Math.max(0, (Number(subtotalMinor) || 0) + (Number(taxMinor) || 0) + (Number(serviceChargeMinor) || 0) - (Number(discountMinor) || 0));
}

export function calculateEqualSplit(totalMinor: number, participantCount: number): number[] {
  const count = Math.max(1, Math.floor(participantCount) || 1);
  const total = Math.max(0, Math.round(Number(totalMinor) || 0));
  if (count === 1) return [total];

  const baseShare = Math.floor(total / count);
  const remainder = total % count;

  const shares: number[] = new Array(count).fill(baseShare);
  for (let i = 0; i < remainder; i++) {
    shares[i] += 1;
  }
  return shares;
}
