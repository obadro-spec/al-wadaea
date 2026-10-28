import {
  OFFERS,
  profitFor,
  zakatBonus,
  type Offer,
} from "./market";
import { viewContract, type ContractView, type Deposit } from "./portfolio";

export type Ranked = Offer & {
  effective: number;
  profit: number;
};

export function offersFor(amount: number, tenor: number | "auto"): Offer[] {
  return OFFERS.filter((offer) => {
    if (amount < offer.min || amount > offer.max) return false;
    if (tenor !== "auto" && offer.tenorMonths !== tenor) return false;
    return true;
  });
}

export function rankOffers(
  amount: number,
  tenor: number | "auto",
  considerZakat: boolean,
): Ranked[] {
  const ranked = offersFor(amount, tenor).map((offer) => ({
    ...offer,
    effective: offer.rate + zakatBonus(offer.zakat, considerZakat),
    profit: profitFor(amount, offer.rate, offer.tenorMonths),
  }));
  ranked.sort((a, b) => {
    if (b.effective !== a.effective) return b.effective - a.effective;
    if (b.ease !== a.ease) return b.ease - a.ease;
    if (a.tenorMonths !== b.tenorMonths) return a.tenorMonths - b.tenorMonths;
    return b.rate - a.rate;
  });
  return ranked;
}

/** Diary24H ignores gaps as small as 0.15 point when the bank is convenient. */
const TIE = 0.15;

export function pickOffer(ranked: Ranked[], homeBank?: string): Ranked | null {
  if (!ranked.length) return null;
  const best = ranked[0]!;
  const band = ranked.filter((offer) => best.effective - offer.effective <= TIE);
  band.sort((a, b) => {
    const aHome = a.bank === homeBank ? 1 : 0;
    const bHome = b.bank === homeBank ? 1 : 0;
    if (bHome !== aHome) return bHome - aHome;
    if (b.ease !== a.ease) return b.ease - a.ease;
    const aSweet = a.tenorMonths === 6 || a.tenorMonths === 9 ? 1 : 0;
    const bSweet = b.tenorMonths === 6 || b.tenorMonths === 9 ? 1 : 0;
    if (bSweet !== aSweet) return bSweet - aSweet;
    if (b.rate !== a.rate) return b.rate - a.rate;
    return a.tenorMonths - b.tenorMonths;
  });
  return band[0] ?? best;
}

export type Action = "reinvest" | "hold" | "roll-soon";

export type Advice = {
  view: ContractView;
  action: Action;
  headline: string;
  detail: string;
  pick: Ranked | null;
  alt: Ranked | null;
  rollAmount: number;
};

export function advise(
  deposit: Deposit,
  today: string,
  considerZakat: boolean,
): Advice {
  const view = viewContract(deposit, today);
  const rollAmount = Math.round(view.atMaturity * 100) / 100;
  const ranked = rankOffers(rollAmount, "auto", considerZakat);
  const pick = pickOffer(ranked, deposit.bank);
  const alt =
    ranked.find((offer) => offer.id !== pick?.id && offer.bank !== pick?.bank) ??
    ranked.find((offer) => offer.id !== pick?.id) ??
    null;

  if (!pick) {
    return {
      view,
      action: "hold",
      headline: "لا توجد شريحة مطابقة لهذا المبلغ في الجدول",
      detail: "ارفع المبلغ إلى الحد الأدنى أو أبقه في البنك الحالي.",
      pick: null,
      alt: null,
      rollAmount,
    };
  }

  if (view.left <= 1) {
    return {
      view,
      action: "reinvest",
      headline: `أعِد المبلغ في نفس اليوم إلى ${pick.bank} — ${pick.product}`,
      detail: sameDayDetail(pick, alt, rollAmount),
      pick,
      alt,
      rollAmount,
    };
  }

  if (view.left <= 45) {
    return {
      view,
      action: "roll-soon",
      headline: "لا تكسر العقد. جهّز إعادة الاستثمار ليوم الاستحقاق",
      detail: holdDetail(view, pick, false),
      pick,
      alt,
      rollAmount,
    };
  }

  const grossGap = Math.max(0, pick.rate - deposit.rate);
  const opportunity = deposit.amount * (grossGap / 100) * (Math.max(view.left, 0) / 365);
  const breakMakesSense = opportunity > view.remaining && grossGap >= 0.8;

  if (breakMakesSense) {
    return {
      view,
      action: "reinvest",
      headline: "الفارق أكبر من الربح المتبقي — اسأل البنك عن كسر العقد قبل أن تتحرك",
      detail: `الربح المتبقي تقريباً ${Math.round(view.remaining)} ريال، بينما فارق النسبة حتى الاستحقاق حوالي ${Math.round(opportunity)} ريال. بعض البنوك تُسقط الربح كله عند الكسر.`,
      pick,
      alt,
      rollAmount,
    };
  }

  return {
    view,
    action: "hold",
    headline: "أبقِ العقد حتى الاستحقاق",
    detail: holdDetail(view, pick, true),
    pick,
    alt,
    rollAmount,
  };
}

function sameDayDetail(pick: Ranked, alt: Ranked | null, amount: number): string {
  const altText = alt
    ? ` البديل القريب: ${alt.bank} ${alt.product} ${alt.tenorMonths} شهر عند ${alt.rate.toFixed(2)}%.`
    : "";
  return `على مبلغ ${Math.round(amount).toLocaleString("en-US")} ريال، النسبة المنشورة ${pick.rate.toFixed(2)}% لمدة ${pick.tenorMonths} شهراً. ألغِ التجديد التلقائي، وتأكد من الرقم داخل التطبيق صباح التنفيذ لأن الجدول يتغير.${altText}`;
}

function holdDetail(view: ContractView, pick: Ranked, far: boolean): string {
  const gap = pick.rate - view.deposit.rate;
  const idle = far
    ? "كسر العقد الآن غالباً يضيع ربحاً تحقق أكثر مما ستكسبه من فرق النسبة في الأيام المتبقية."
    : "الأيام القليلة لا تبرر الكسر. كل يوم بلا عقد بعد الاستحقاق ربح فائت.";
  return `${idle} عند الاستحقاق قارن ما يظهر في التطبيق مع ${pick.bank} ${pick.product} ${pick.rate.toFixed(2)}% لمدة ${pick.tenorMonths} شهر. فرق النسبة اليوم عن عقدك حوالي ${gap.toFixed(2)} نقطة، والعقد القائم لا يتأثر بانخفاض النسب الجديدة.`;
}
