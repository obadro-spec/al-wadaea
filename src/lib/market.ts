/** Rates from @Diary24H «نسب الودائع الشرعية» 31 Oct 2026.
 *  https://x.com/Diary24H/status/2116532015793369588
 *  Confirm in the bank app the morning you subscribe.
 */

export type Zakat = "customer" | "exempt" | "paid";

export type Offer = {
  id: string;
  bank: string;
  product: string;
  zakat: Zakat;
  channel: string;
  min: number;
  max: number;
  tenorMonths: number;
  rate: number;
  asOf: string;
  sourceUrl: string;
  ease: number;
};

export const AS_OF = "2026-10-31";
export const SOURCE_URL = "https://x.com/Diary24H/status/2116532015793369588";

function rows(
  base: Omit<Offer, "id" | "tenorMonths" | "rate" | "sourceUrl" | "asOf">,
  rates: Record<number, number>,
): Offer[] {
  return Object.entries(rates).map(([tenor, rate]) => ({
    ...base,
    asOf: AS_OF,
    id: `${base.bank}-${base.product}-${base.min}-${tenor}`,
    tenorMonths: Number(tenor),
    rate,
    sourceUrl: SOURCE_URL,
  }));
}

const awaed = (
  min: number,
  max: number,
  rates: Record<number, number>,
): Offer[] =>
  rows(
    {
      bank: "البلاد",
      product: "عوائد",
      zakat: "customer",
      channel: "تطبيق",
      min,
      max,
      ease: 3,
    },
    rates,
  );

const wakala = (
  min: number,
  max: number,
  rates: Record<number, number>,
): Offer[] =>
  rows(
    {
      bank: "البلاد",
      product: "استثمار بالوكالة",
      zakat: "exempt",
      channel: "تطبيق",
      min,
      max,
      ease: 3,
    },
    rates,
  );

export const OFFERS: Offer[] = [
  ...awaed(50_000, 99_999.99, { 6: 5.86, 9: 5.96, 12: 6.0, 18: 5.72, 24: 5.74 }),
  ...awaed(100_000, 999_999.99, {
    1: 4.89,
    2: 5.48,
    3: 5.58,
    4: 5.68,
    6: 5.86,
    9: 5.96,
    12: 6.0,
    18: 5.72,
    24: 5.74,
  }),
  ...awaed(1_000_000, 4_999_999.99, {
    1: 4.99,
    2: 5.58,
    3: 5.68,
    4: 5.78,
    6: 5.96,
    9: 6.06,
    12: 6.1,
    18: 5.82,
    24: 5.84,
  }),
  ...awaed(5_000_000, Number.POSITIVE_INFINITY, {
    1: 5.01,
    2: 5.68,
    3: 5.78,
    4: 5.88,
    6: 6.06,
    9: 6.16,
    12: 6.2,
    18: 5.92,
    24: 5.94,
  }),
  ...wakala(50_000, 99_999.99, { 6: 5.56, 9: 5.66, 12: 5.7, 18: 5.42, 24: 5.44 }),
  ...wakala(100_000, 999_999.99, {
    1: 4.59,
    2: 5.18,
    3: 5.28,
    4: 5.38,
    6: 5.56,
    9: 5.66,
    12: 5.7,
    18: 5.42,
    24: 5.44,
  }),
  ...wakala(1_000_000, 4_999_999.99, {
    1: 4.69,
    2: 5.28,
    3: 5.38,
    4: 5.48,
    6: 5.66,
    9: 5.76,
    12: 5.8,
    18: 5.52,
    24: 5.54,
  }),
  ...wakala(5_000_000, Number.POSITIVE_INFINITY, {
    1: 4.79,
    2: 5.38,
    3: 5.48,
    4: 5.58,
    6: 5.76,
    9: 5.86,
    12: 5.9,
    18: 5.62,
    24: 5.64,
  }),
  ...rows(
    {
      bank: "الإنماء",
      product: "نماء",
      zakat: "exempt",
      channel: "تطبيق",
      min: 50_000,
      max: 199_999.99,
      ease: 2,
    },
    { 3: 5.42, 6: 5.99, 9: 5.78, 12: 5.56, 24: 5.49, 36: 5.53 },
  ),
  ...rows(
    {
      bank: "الإنماء",
      product: "نماء",
      zakat: "exempt",
      channel: "تطبيق",
      min: 200_000,
      max: 5_000_000,
      ease: 2,
    },
    { 1: 4.91, 2: 5.27, 3: 5.46, 6: 5.99, 9: 5.78, 12: 5.56, 24: 5.49, 36: 5.53 },
  ),
  ...rows(
    {
      bank: "عز",
      product: "نماء",
      zakat: "exempt",
      channel: "تطبيق",
      min: 1_000,
      max: 49_999.99,
      ease: 1,
    },
    { 3: 5.2, 6: 5.75, 9: 5.54, 12: 5.34, 24: 5.27, 36: 5.31 },
  ),
  ...rows(
    {
      bank: "عز",
      product: "نماء",
      zakat: "exempt",
      channel: "تطبيق",
      min: 50_000,
      max: 199_999.99,
      ease: 1,
    },
    { 3: 5.42, 6: 5.99, 9: 5.78, 12: 5.56, 24: 5.49, 36: 5.53 },
  ),
  ...rows(
    {
      bank: "عز",
      product: "نماء",
      zakat: "exempt",
      channel: "تطبيق",
      min: 200_000,
      max: 5_000_000,
      ease: 1,
    },
    { 1: 4.91, 2: 5.27, 3: 5.46, 6: 5.99, 9: 5.78, 12: 5.56, 24: 5.49, 36: 5.53 },
  ),
  ...rows(
    {
      bank: "الراجحي",
      product: "عوائد",
      zakat: "paid",
      channel: "تطبيق",
      min: 1_000,
      max: 24_999.99,
      ease: 2,
    },
    {
      3: 5.4,
      4: 5.4,
      5: 5.5,
      6: 5.5,
      7: 5.5,
      8: 5.6,
      9: 5.6,
      10: 5.6,
      11: 5.6,
      12: 5.65,
      18: 5.7,
      24: 5.75,
      30: 5.75,
      36: 5.75,
    },
  ),
  ...rows(
    {
      bank: "الراجحي",
      product: "عوائد",
      zakat: "paid",
      channel: "تطبيق",
      min: 25_000,
      max: 100_000_000,
      ease: 2,
    },
    {
      1: 5,
      2: 5.2,
      3: 5.4,
      4: 5.4,
      5: 5.5,
      6: 5.5,
      7: 5.5,
      8: 5.6,
      9: 5.6,
      10: 5.6,
      11: 5.6,
      12: 5.65,
      18: 5.7,
      24: 5.75,
      30: 5.75,
      36: 5.75,
    },
  ),
  ...rows(
    {
      bank: "الأهلي",
      product: "خيرات",
      zakat: "customer",
      channel: "تطبيق",
      min: 25_000,
      max: 99_999.99,
      ease: 1,
    },
    { 1: 4.06, 3: 4.35, 6: 5.01, 9: 5.07, 12: 4.89 },
  ),
  ...rows(
    {
      bank: "الأهلي",
      product: "خيرات",
      zakat: "customer",
      channel: "فرع",
      min: 100_000,
      max: Number.POSITIVE_INFINITY,
      ease: 0,
    },
    { 1: 4.93, 2: 5.12, 3: 5.3, 6: 5.75, 9: 5.42, 12: 5.1 },
  ),
  ...rows(
    {
      bank: "STC",
      product: "وديعة ثابتة",
      zakat: "paid",
      channel: "تطبيق",
      min: 25_000,
      max: Number.POSITIVE_INFINITY,
      ease: 1,
    },
    { 1: 4.64, 3: 4.97, 6: 4.92, 12: 4.98 },
  ),
  ...rows(
    {
      bank: "ميم",
      product: "مرابحة",
      zakat: "customer",
      channel: "تطبيق",
      min: 25_000,
      max: 200_000,
      ease: 1,
    },
    { 1: 4.28, 3: 5.13, 6: 5.66, 12: 5.48 },
  ),
  ...rows(
    {
      bank: "ميم",
      product: "مرابحة",
      zakat: "customer",
      channel: "تطبيق",
      min: 200_001,
      max: 5_000_000,
      ease: 1,
    },
    { 1: 4.33, 3: 5.18, 6: 5.71, 12: 5.53 },
  ),
  ...rows(
    {
      bank: "الأول",
      product: "مرابحة بالسلع",
      zakat: "customer",
      channel: "تطبيق",
      min: 25_000,
      max: 5_000_000,
      ease: 1,
    },
    { 1: 3.5, 2: 4.13, 3: 4.26, 6: 5.05, 9: 5.05, 12: 4.58 },
  ),
  ...rows(
    {
      bank: "العربي",
      product: "مرابحة",
      zakat: "customer",
      channel: "تطبيق",
      min: 50_000,
      max: 2_500_000,
      ease: 1,
    },
    { 1: 4.52, 3: 4.88, 6: 5.51, 12: 5.16, 24: 5.05 },
  ),
  ...rows(
    {
      bank: "العربي",
      product: "مرابحة",
      zakat: "customer",
      channel: "تطبيق",
      min: 2_500_000,
      max: Number.POSITIVE_INFINITY,
      ease: 1,
    },
    { 1: 4.65, 3: 5.01, 6: 5.64, 12: 5.29, 24: 5.29 },
  ),
  ...rows(
    {
      bank: "العربي",
      product: "زاد",
      zakat: "paid",
      channel: "فرع",
      min: 100_000,
      max: 999_999,
      ease: 0,
    },
    { 3: 4.55, 6: 5.29, 9: 5.09, 12: 4.91 },
  ),
  ...rows(
    {
      bank: "فيجن",
      product: "مرابحة",
      zakat: "customer",
      channel: "تطبيق",
      min: 1_000,
      max: Number.POSITIVE_INFINITY,
      ease: 1,
    },
    { 1: 4.5, 2: 4.5, 3: 5, 6: 5.25, 9: 5.5, 12: 6 },
  ),
  ...rows(
    {
      bank: "الجزيرة",
      product: "نقاء",
      zakat: "customer",
      channel: "تطبيق",
      min: 40_000,
      max: 249_999,
      ease: 1,
    },
    { 2: 4.44, 3: 4.49, 4: 5.3, 5: 5.01, 6: 4.67 },
  ),
  ...rows(
    {
      bank: "الجزيرة",
      product: "نقاء",
      zakat: "customer",
      channel: "تطبيق",
      min: 250_000,
      max: 500_000,
      ease: 1,
    },
    { 2: 4.54, 3: 4.59, 4: 5.4, 5: 5.11, 6: 4.77 },
  ),
  ...rows(
    {
      bank: "الرياض",
      product: "عائد إسلامي",
      zakat: "customer",
      channel: "فرع",
      min: 50_000,
      max: 199_999,
      ease: 0,
    },
    { 1: 4.3, 2: 4.4, 3: 4.55, 6: 4.65, 9: 4.75, 12: 4.75 },
  ),
  ...rows(
    {
      bank: "الرياض",
      product: "عائد إسلامي",
      zakat: "customer",
      channel: "فرع",
      min: 200_000,
      max: 499_999,
      ease: 0,
    },
    { 1: 4.32, 2: 4.42, 3: 4.57, 6: 4.67, 9: 4.77, 12: 4.77 },
  ),
];

export const ZAKAT_LABEL: Record<Zakat, string> = {
  customer: "الزكاة عليك",
  exempt: "معفى من الزكاة",
  paid: "الزكاة مدفوعة عن فترة الاستثمار",
};

export function zakatBonus(zakat: Zakat, consider: boolean): number {
  if (!consider || zakat === "customer") return 0;
  return 2.5;
}

export function profitFor(amount: number, annualRate: number, months: number): number {
  return amount * (annualRate / 100) * (months / 12);
}

export function money(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function pct(n: number): string {
  return `${n.toFixed(2)}%`;
}

export function tenorLabel(months: number): string {
  if (months === 1) return "شهر";
  if (months === 2) return "شهران";
  if (months <= 10) return `${months} أشهر`;
  return `${months} شهراً`;
}
