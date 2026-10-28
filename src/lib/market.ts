/** Indicative Sharia deposit rates transcribed from @Diary24H public tables.
 *  Albilad: card dated 25 Oct 2026. Other banks: board dated 24 Oct 2026.
 *  Rates move daily — confirm in the bank app on the morning you subscribe.
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

const ALBILAD = "2026-10-25";
const BOARD = "2026-10-24";

const SOURCE: Record<string, string> = {
  [ALBILAD]: "https://x.com/Diary24H/status/2114376077128708476",
  [BOARD]: "https://x.com/Diary24H/status/2114012805464457641",
};

function rows(
  base: Omit<Offer, "id" | "tenorMonths" | "rate" | "sourceUrl">,
  rates: Record<number, number>,
): Offer[] {
  return Object.entries(rates).map(([tenor, rate]) => ({
    ...base,
    id: `${base.bank}-${base.product}-${base.min}-${tenor}`,
    tenorMonths: Number(tenor),
    rate,
    sourceUrl: SOURCE[base.asOf] ?? SOURCE[BOARD]!,
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
      asOf: ALBILAD,
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
      asOf: ALBILAD,
      ease: 3,
    },
    rates,
  );

export const OFFERS: Offer[] = [
  ...awaed(50_000, 99_999.99, { 6: 6.26, 9: 6.36, 12: 5.84, 18: 5.75, 24: 5.77 }),
  ...awaed(100_000, 999_999.99, {
    1: 4.94,
    2: 5.48,
    3: 5.58,
    4: 5.68,
    6: 6.26,
    9: 6.36,
    12: 5.84,
    18: 5.75,
    24: 5.77,
  }),
  ...awaed(1_000_000, 4_999_999.99, {
    1: 5.04,
    2: 5.58,
    3: 5.68,
    4: 5.78,
    6: 6.36,
    9: 6.46,
    12: 5.94,
    18: 5.85,
    24: 5.88,
  }),
  ...awaed(5_000_000, Number.POSITIVE_INFINITY, {
    1: 5.14,
    2: 5.68,
    3: 5.78,
    4: 5.88,
    6: 6.46,
    9: 6.46,
    12: 6.04,
    18: 5.95,
    24: 5.98,
  }),
  ...wakala(50_000, 99_999.99, { 6: 5.96, 9: 6.06, 12: 5.54, 18: 5.45, 24: 5.47 }),
  ...wakala(100_000, 999_999.99, {
    1: 4.64,
    2: 5.18,
    3: 5.28,
    4: 5.38,
    6: 5.96,
    9: 6.06,
    12: 5.54,
    18: 5.45,
    24: 5.47,
  }),
  ...wakala(1_000_000, 4_999_999.99, {
    1: 4.74,
    2: 5.28,
    3: 5.38,
    4: 5.48,
    6: 6.06,
    9: 6.06,
    12: 5.64,
    18: 5.55,
    24: 5.57,
  }),
  ...wakala(5_000_000, Number.POSITIVE_INFINITY, {
    1: 4.84,
    2: 5.38,
    3: 5.48,
    4: 5.58,
    6: 6.16,
    9: 6.16,
    12: 5.74,
    18: 5.65,
    24: 5.67,
  }),
  ...rows(
    {
      bank: "الإنماء",
      product: "نماء",
      zakat: "exempt",
      channel: "تطبيق",
      min: 50_000,
      max: 199_999.99,
      asOf: BOARD,
      ease: 2,
    },
    { 3: 5.46, 6: 6.18, 9: 5.76, 12: 5.34, 24: 5.58, 36: 5.62 },
  ),
  ...rows(
    {
      bank: "الإنماء",
      product: "نماء",
      zakat: "exempt",
      channel: "تطبيق",
      min: 200_000,
      max: 5_000_000,
      asOf: BOARD,
      ease: 2,
    },
    { 1: 5.11, 2: 5.29, 3: 5.46, 6: 6.18, 9: 5.76, 12: 5.34, 24: 5.58, 36: 5.62 },
  ),
  ...rows(
    {
      bank: "عز",
      product: "نماء",
      zakat: "exempt",
      channel: "تطبيق",
      min: 1_000,
      max: 49_999.99,
      asOf: BOARD,
      ease: 1,
    },
    { 3: 5.24, 6: 5.93, 9: 5.53, 12: 5.13, 24: 5.35, 36: 5.39 },
  ),
  ...rows(
    {
      bank: "عز",
      product: "نماء",
      zakat: "exempt",
      channel: "تطبيق",
      min: 50_000,
      max: 199_999.99,
      asOf: BOARD,
      ease: 1,
    },
    { 3: 5.46, 6: 6.18, 9: 5.76, 12: 5.34, 24: 5.58, 36: 5.62 },
  ),
  ...rows(
    {
      bank: "عز",
      product: "نماء",
      zakat: "exempt",
      channel: "تطبيق",
      min: 200_000,
      max: 5_000_000,
      asOf: BOARD,
      ease: 1,
    },
    { 1: 5.11, 2: 5.29, 3: 5.46, 6: 6.18, 9: 5.76, 12: 5.34, 24: 5.58, 36: 5.62 },
  ),
  ...rows(
    {
      bank: "الراجحي",
      product: "عوائد",
      zakat: "paid",
      channel: "تطبيق",
      min: 1_000,
      max: 24_999.99,
      asOf: BOARD,
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
      asOf: BOARD,
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
      asOf: BOARD,
      ease: 1,
    },
    { 1: 4, 3: 4.29, 6: 4.88, 9: 4.97, 12: 4.81 },
  ),
  ...rows(
    {
      bank: "الأهلي",
      product: "خيرات",
      zakat: "customer",
      channel: "فرع",
      min: 100_000,
      max: Number.POSITIVE_INFINITY,
      asOf: BOARD,
      ease: 0,
    },
    { 1: 4.24, 2: 4.43, 6: 5.01, 9: 4.95, 12: 4.9 },
  ),
  ...rows(
    {
      bank: "STC",
      product: "وديعة ثابتة",
      zakat: "paid",
      channel: "تطبيق",
      min: 25_000,
      max: Number.POSITIVE_INFINITY,
      asOf: BOARD,
      ease: 1,
    },
    { 1: 4.62, 3: 5.01, 6: 5.69, 12: 5.14 },
  ),
  ...rows(
    {
      bank: "ميم",
      product: "مرابحة",
      zakat: "customer",
      channel: "تطبيق",
      min: 25_000,
      max: 200_000,
      asOf: BOARD,
      ease: 1,
    },
    { 1: 4.26, 3: 5.18, 6: 5.86, 12: 5.26 },
  ),
  ...rows(
    {
      bank: "ميم",
      product: "مرابحة",
      zakat: "customer",
      channel: "تطبيق",
      min: 200_001,
      max: 5_000_000,
      asOf: BOARD,
      ease: 1,
    },
    { 1: 4.31, 3: 5.23, 6: 5.91, 12: 5.31 },
  ),
  ...rows(
    {
      bank: "الأول",
      product: "مرابحة بالسلع",
      zakat: "customer",
      channel: "تطبيق",
      min: 25_000,
      max: 5_000_000,
      asOf: BOARD,
      ease: 1,
    },
    { 1: 3.5, 2: 4.22, 3: 4.57, 6: 5.4, 9: 5.4, 12: 4.55 },
  ),
  ...rows(
    {
      bank: "العربي",
      product: "مرابحة",
      zakat: "customer",
      channel: "تطبيق",
      min: 50_000,
      max: 2_500_000,
      asOf: BOARD,
      ease: 1,
    },
    { 1: 4.5, 3: 4.92, 6: 5.7, 12: 4.94, 24: 5.17 },
  ),
  ...rows(
    {
      bank: "العربي",
      product: "مرابحة",
      zakat: "customer",
      channel: "تطبيق",
      min: 2_500_000,
      max: Number.POSITIVE_INFINITY,
      asOf: BOARD,
      ease: 1,
    },
    { 1: 4.63, 3: 5.05, 6: 5.83, 12: 5.07, 24: 5.3 },
  ),
  ...rows(
    {
      bank: "العربي",
      product: "زاد",
      zakat: "paid",
      channel: "فرع",
      min: 100_000,
      max: 999_999,
      asOf: BOARD,
      ease: 0,
    },
    { 3: 4.65, 6: 4.84, 9: 4.85, 12: 4.9 },
  ),
  ...rows(
    {
      bank: "فيجن",
      product: "مرابحة",
      zakat: "customer",
      channel: "تطبيق",
      min: 1_000,
      max: Number.POSITIVE_INFINITY,
      asOf: BOARD,
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
      asOf: BOARD,
      ease: 1,
    },
    { 2: 4.61, 3: 4.66, 4: 5.16, 6: 4.7 },
  ),
  ...rows(
    {
      bank: "الجزيرة",
      product: "نقاء",
      zakat: "customer",
      channel: "تطبيق",
      min: 250_000,
      max: 500_000,
      asOf: BOARD,
      ease: 1,
    },
    { 2: 4.71, 3: 4.76, 4: 5.26, 6: 4.8 },
  ),
  ...rows(
    {
      bank: "الرياض",
      product: "عائد إسلامي",
      zakat: "customer",
      channel: "فرع",
      min: 50_000,
      max: 199_999,
      asOf: BOARD,
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
      asOf: BOARD,
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
  return new Intl.NumberFormat("ar-SA-u-nu-latn", {
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
