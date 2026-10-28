export type Deposit = {
  id: string;
  bank: string;
  months: number;
  maturity: string;
  amount: number;
  rate: number;
  start: string;
};

export const STORAGE_KEY = "wadaea-portfolio-v1";

/** Copied from the shared sheet. Two identical Izz rows are kept as two contracts. */
export const SEED: Deposit[] = [
  {
    id: "bilad-83",
    bank: "البلاد",
    months: 9,
    maturity: "2026-10-29",
    amount: 83000,
    rate: 4.88,
    start: "2026-01-29",
  },
  {
    id: "inma-55",
    bank: "الإنماء",
    months: 6,
    maturity: "2026-12-07",
    amount: 55000,
    rate: 5.03,
    start: "2026-06-07",
  },
  {
    id: "inma-325",
    bank: "الإنماء",
    months: 6,
    maturity: "2027-03-01",
    amount: 325000,
    rate: 5.11,
    start: "2026-09-01",
  },
  {
    id: "bilad-50",
    bank: "البلاد",
    months: 9,
    maturity: "2027-03-22",
    amount: 50000,
    rate: 5.04,
    start: "2026-06-22",
  },
  {
    id: "bilad-66",
    bank: "البلاد",
    months: 9,
    maturity: "2027-03-25",
    amount: 66500,
    rate: 5.04,
    start: "2026-06-25",
  },
  {
    id: "izz-6",
    bank: "عز",
    months: 6,
    maturity: "2027-03-28",
    amount: 6000,
    rate: 5.08,
    start: "2026-09-28",
  },
  {
    id: "bilad-77",
    bank: "البلاد",
    months: 9,
    maturity: "2027-07-22",
    amount: 77780,
    rate: 6.06,
    start: "2026-10-22",
  },
  {
    id: "izz-5a",
    bank: "عز",
    months: 6,
    maturity: "2027-04-27",
    amount: 5000,
    rate: 5.58,
    start: "2026-10-27",
  },
  {
    id: "izz-5b",
    bank: "عز",
    months: 6,
    maturity: "2027-04-27",
    amount: 5000,
    rate: 5.58,
    start: "2026-10-27",
  },
];

export function parseISODate(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to) - parseISODate(from)) / 86_400_000);
}

export function riyadhToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function formatDay(iso: string): string {
  const dt = new Date(parseISODate(iso));
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

export function leftLabel(days: number): string {
  if (days < 0) return `مضى منذ ${Math.abs(days)} يوم`;
  if (days === 0) return "تستحق اليوم";
  if (days === 1) return "تستحق غداً";
  if (days === 2) return "بعد يومين";
  if (days <= 10) return `بعد ${days} أيام`;
  return `بعد ${days} يوماً`;
}

export type ContractView = {
  deposit: Deposit;
  totalDays: number;
  elapsed: number;
  left: number;
  profit: number;
  accrued: number;
  remaining: number;
  atMaturity: number;
};

export function viewContract(deposit: Deposit, today: string): ContractView {
  const totalDays = Math.max(1, daysBetween(deposit.start, deposit.maturity));
  const elapsed = Math.min(totalDays, Math.max(0, daysBetween(deposit.start, today)));
  const left = daysBetween(today, deposit.maturity);
  const profit = deposit.amount * (deposit.rate / 100) * (deposit.months / 12);
  const accrued = profit * (elapsed / totalDays);
  return {
    deposit,
    totalDays,
    elapsed,
    left,
    profit,
    accrued,
    remaining: Math.max(0, profit - accrued),
    atMaturity: deposit.amount + profit,
  };
}
