import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Landmark,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { AS_OF, money, pct, SOURCE_URL, tenorLabel, ZAKAT_LABEL } from "@/lib/market";
import { syncDiary, type DiarySync } from "@/lib/diary-sync";
import { formatDay, STORAGE_KEY } from "@/lib/portfolio";
import { rankOffers, type Ranked } from "@/lib/recommend";

const TENORS = [1, 3, 6, 9, 12, 24] as const;
const PRESET_AMOUNTS = [50_000, 100_000, 250_000, 500_000, 1_000_000];
const SIX_HOURS = 6 * 60 * 60 * 1000;

const PARTNER_BANKS = [
  { name: "بنك البلاد", code: "البلاد", color: "from-amber-600 to-amber-800" },
  { name: "مصرف الإنماء", code: "الإنماء", color: "from-sky-600 to-blue-800" },
  { name: "تطبيق عز", code: "عز", color: "from-blue-600 to-indigo-800" },
  { name: "مصرف الراجحي", code: "الراجحي", color: "from-blue-700 to-slate-900" },
  { name: "البنك الأهلي", code: "الأهلي", color: "from-emerald-700 to-teal-900" },
  { name: "بنك الرياض", code: "الرياض", color: "from-red-600 to-red-800" },
  { name: "بنك الجزيرة", code: "الجزيرة", color: "from-teal-600 to-teal-800" },
  { name: "بنك D360", code: "D360", color: "from-purple-600 to-purple-900" },
  { name: "بنك ميم", code: "ميم", color: "from-orange-500 to-orange-700" },
];

export function Advisor() {
  const [zakatOn, setZakatOn] = useState(true);
  const [tenor, setTenor] = useState<number | "auto">("auto");
  const [amountText, setAmountText] = useState("100000");
  const [showAll, setShowAll] = useState(false);
  const [sync, setSync] = useState<DiarySync | null>(null);

  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
    let timer = 0;
    let stop = false;
    const nextAt = { t: 0 };

    const run = async () => {
      try {
        const next = await syncDiary();
        nextAt.t = Date.parse(next.nextCheckAt);
        if (!stop) setSync(next);
      } catch {
        nextAt.t = Date.now() + SIX_HOURS;
        if (!stop) setSync(null);
      }
    };

    const arm = () => {
      window.clearTimeout(timer);
      const wait = Math.max(1_000, (nextAt.t || Date.now() + SIX_HOURS) - Date.now());
      timer = window.setTimeout(() => {
        void run().finally(arm);
      }, wait);
    };

    void run().finally(arm);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (nextAt.t && Date.now() >= nextAt.t) void run().finally(arm);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const amount = Number(amountText.replace(/[^\d.]/g, "")) || 0;
  const allRanked = useMemo(
    () => rankOffers(amount, tenor, zakatOn),
    [amount, tenor, zakatOn],
  );

  const displayedLadder = showAll ? allRanked : allRanked.slice(0, 10);
  const sourceUrl = sync?.sourceUrl ?? SOURCE_URL;
  const tableDay = formatDay(sync?.asOf ?? AS_OF);
  const topRate = allRanked[0]?.rate ?? 6.1;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white">
      {/* شريط الإعلان والتنظيم العلوي بنمط منصة ودائع */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-800">🇸🇦 منصة موحدة لعوائد الودائع البنكية</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-slate-500">متوافقة مع الضوابط الشرعية</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700 font-bold border border-emerald-200">
              <ShieldCheck className="size-3.5" />
              <span>بيئة موثوقة</span>
            </span>
            <span className="text-slate-400">·</span>
            <span>تحديث: {tableDay}</span>
          </div>
        </div>

        {/* ترويسة الموقع مع شعار ودائع وقائمة التنقل */}
        <header className="mx-auto max-w-6xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-md">
              <Landmark className="size-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  ودائع
                </span>
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-black text-blue-800">
                  Wadaie
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                مجمّع ومقارنة عوائد الودائع البنكية السعودية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#calculator"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs"
            >
              <span>📊 سلّم المقارنة</span>
            </a>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              <span>المصدر على X</span>
              <ExternalLink className="size-3.5 text-slate-400" />
            </a>
          </div>
        </header>
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        {/* التنويه وإخلاء المسؤولية بخط عريض وكبير في الأعلى حسب طلب المستخدم */}
        <div className="mb-8 rounded-3xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 p-5 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 text-amber-900 font-black text-lg sm:text-2xl mb-2">
            <span className="text-2xl sm:text-3xl">⚠️</span>
            <span>تنبيه وإخلاء مسؤولية هـام</span>
          </div>
          <p className="text-lg sm:text-2xl font-extrabold leading-relaxed text-slate-900">
            ليست استشارة استثمارية ولا فتوى زكاة. الأرقام منقولة من صور @Diary24H وقد تتغير في اليوم نفسه.
          </p>
        </div>

        {/* قسم الواجهة الرئيسية بنمط Hero Section الخاص بـ wadaie.com */}
        <section className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-7 sm:p-12 text-white shadow-xl relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs sm:text-sm font-bold text-emerald-300 mb-4">
              <Sparkles className="size-4" />
              <span>مقارنة فورية لأفضل الودائع الزمنية والادخارية</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white">
              استثمر سيولتك بأعلى عوائد الودائع البنكية في المملكة 🇸🇦
            </h1>
            <p className="mt-4 text-base sm:text-xl text-slate-300 leading-relaxed font-normal">
              سلّم مقارنة متقدم يرتب لك أفضل العوائد المطابقة لمبلغك الاستثماري.
            </p>

            {/* مؤشرات الأرقام البارزة في Hero Section */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 pt-6 border-t border-slate-800">
              <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10 backdrop-blur-xs">
                <div className="text-xs sm:text-sm font-semibold text-slate-400">أعلى عائد سنوي</div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                  {pct(topRate)}
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10 backdrop-blur-xs">
                <div className="text-xs sm:text-sm font-semibold text-slate-400">البنوك المشمولة</div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-white tabular-nums">
                  +8 بنوك
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10 backdrop-blur-xs">
                <div className="text-xs sm:text-sm font-semibold text-slate-400">فحص التغريدات</div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  كل 6 ساعات
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-3.5 border border-white/10 backdrop-blur-xs">
                <div className="text-xs sm:text-sm font-semibold text-slate-400">الضوابط الشرعية</div>
                <div className="mt-1 text-2xl sm:text-3xl font-black text-emerald-400">
                  100% متوافق
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* شريط البنوك السعودية الشريكة */}
        <section className="mb-10">
          <div className="text-center text-xs sm:text-sm font-bold text-slate-400 mb-4 flex items-center justify-center gap-2">
            <span>🏛️</span>
            <span>عوائد معتمدة تشمل أبرز البنوك والمصارف السعودية</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {PARTNER_BANKS.map((b) => (
              <span
                key={b.code}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm sm:text-base font-bold text-slate-800 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <span className={`size-2.5 rounded-full bg-gradient-to-tr ${b.color}`} />
                <span>{b.name}</span>
              </span>
            ))}
          </div>
        </section>

        {/* حاسبة العوائد وأدوات التحكم (wadaie.com Calculator Style) */}
        <section
          id="calculator"
          className="mb-8 rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            {/* إدخال وتعديل المبلغ */}
            <div className="flex-1">
              <label className="block text-lg sm:text-2xl font-black text-slate-900 mb-2">
                💰 كم المبلغ الذي ترغب باستثماره؟
              </label>
              <div className="relative">
                <input
                  inputMode="decimal"
                  value={amountText}
                  onChange={(event) => setAmountText(event.target.value)}
                  placeholder="100,000"
                  className="w-full sm:w-96 rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3.5 text-2xl sm:text-4xl font-black text-slate-900 tabular-nums focus:border-emerald-600 focus:bg-white focus:outline-hidden transition-all shadow-inner"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400 pointer-events-none">
                  ر.س
                </span>
              </div>

              {/* أزرار المبالغ الشائعة السريعة */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-slate-500">اختر مبلغاً:</span>
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountText(String(preset))}
                    className={`rounded-xl border px-3 py-1.5 text-sm sm:text-base font-extrabold transition-all shadow-2xs ${
                      amount === preset
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {money(preset)} ر.س
                  </button>
                ))}
              </div>
            </div>

            {/* مفتاح تفضيل الزكاة */}
            <div className="flex flex-col items-start lg:items-end">
              <span className="text-base sm:text-lg font-bold text-slate-600 mb-2">معيار الترتيب الشرعي:</span>
              <button
                type="button"
                role="switch"
                aria-checked={zakatOn}
                onClick={() => setZakatOn(!zakatOn)}
                className={`inline-flex items-center gap-3 rounded-2xl border-2 px-5 py-3.5 text-base sm:text-lg font-bold transition-all shadow-2xs ${
                  zakatOn
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                    : "border-slate-200 bg-slate-100 text-slate-800"
                }`}
              >
                <span
                  className={`size-3.5 rounded-full transition-all ${
                    zakatOn
                      ? "bg-emerald-600 ring-4 ring-emerald-200"
                      : "bg-slate-400"
                  }`}
                />
                <span>
                  {zakatOn
                    ? "⚖️ أُفضّل الودائع المعفية من الزكاة (+2.5%)"
                    : "⚖️ مقارنة النسبة المعلنة فقط"}
                </span>
              </button>
            </div>
          </div>

          {/* فلاتر مدة الوديعة الاستثمارية */}
          <div className="mt-6">
            <div className="text-base sm:text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span>⏱️</span>
              <span>اختر مدة ربط الوديعة:</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setTenor("auto")}
                className={`rounded-2xl px-5 py-2.5 text-base sm:text-lg font-extrabold transition-all shadow-2xs ${
                  tenor === "auto"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                🌟 كل المدد
              </button>
              {TENORS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTenor(value)}
                  className={`rounded-2xl px-5 py-2.5 text-base sm:text-lg font-extrabold transition-all shadow-2xs ${
                    tenor === value
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  ⏱️ {tenorLabel(value)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* سلّم المقارنة وترتيب العوائد (Main Ladder Section) */}
        <section className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 flex items-center gap-3">
                <span>🏆</span>
                <span>سلّم المقارنة وأفضل عوائد السوق</span>
              </h2>
              <p className="mt-1.5 text-base sm:text-xl text-slate-600 font-medium">
                مرتّبة من الأعلى إلى الأقل لمبلغ{" "}
                <strong className="text-emerald-700 font-black">{money(amount)} ر.س</strong>
                {tenor !== "auto" && ` لمدة ${tenorLabel(tenor)}`}
              </p>
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
              {allRanked.length} عروض متوفرة
            </div>
          </div>

          <ol className="divide-y-2 divide-slate-100">
            {displayedLadder.length === 0 && (
              <li className="py-14 text-center text-xl sm:text-2xl font-bold text-slate-500">
                🚫 لا توجد ودائع بنكية متاحة لهذا المبلغ والمدة. يُرجى تجربة مبلغ آخر أو اختيار &quot;كل المدد&quot;.
              </li>
            )}
            {displayedLadder.map((offer, index) => (
              <LadderRow
                key={offer.id}
                offer={offer}
                place={index + 1}
                max={allRanked[0]?.effective ?? 1}
              />
            ))}
          </ol>

          {allRanked.length > 10 && (
            <div className="mt-8 text-center pt-6 border-t-2 border-slate-200">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-lg sm:text-xl font-bold text-white hover:bg-slate-800 transition-all shadow-sm"
              >
                {showAll ? (
                  <>
                    <span>عرض أقل (أول 10 عروض)</span>
                    <ChevronUp className="size-5" />
                  </>
                ) : (
                  <>
                    <span>عرض كل العروض المتاحة ({allRanked.length} عرض)</span>
                    <ChevronDown className="size-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </section>



        {/* تذييل الصفحة بنمط منصة ودائع */}
        <footer className="mt-16 pt-8 border-t-2 border-slate-200 text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm sm:text-base">
          <div>
            <p className="font-bold text-slate-700">
              مرشد ودائع · محاكاة وتجميع عوائد الودائع البنكية السعودية
            </p>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              تأكد دائماً من نص العقد والشروط والحد الأدنى عبر التطبيق البنكي قبل إتمام عملية الربط.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold">
            <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
              تغريدة @Diary24H
            </a>
            <span>·</span>
            <span className="text-slate-400">تحديث {tableDay}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function placeIcon(place: number): string {
  if (place === 1) return "🥇";
  if (place === 2) return "🥈";
  if (place === 3) return "🥉";
  return `${place}`;
}

function LadderRow({
  offer,
  place,
  max,
}: {
  offer: Ranked;
  place: number;
  max: number;
}) {
  const width = Math.max(12, Math.round((offer.effective / max) * 100));

  return (
    <li className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[4.5rem_1fr] gap-4 py-6 items-start hover:bg-slate-50/70 rounded-2xl px-2 transition-colors">
      {/* أيقونة الترتيب */}
      <div className="flex flex-col items-center justify-center pt-1.5">
        <span className="text-3xl sm:text-4xl font-black text-amber-500">
          {placeIcon(place)}
        </span>
        {place > 3 && (
          <span className="text-xs font-bold text-slate-400 mt-0.5">المرتبة</span>
        )}
      </div>

      {/* تفاصيل العرض البنكي والعائد */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
              <span>{offer.bank}</span>
              <span className="text-lg sm:text-2xl font-bold text-slate-500">· {offer.product}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm sm:text-base font-semibold">
              <span className="rounded-xl bg-slate-100 px-3 py-1 text-slate-800 font-bold border border-slate-200">
                ⏱️ {tenorLabel(offer.tenorMonths)}
              </span>
              <span className="rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 font-bold border border-emerald-200">
                ⚖️ {ZAKAT_LABEL[offer.zakat]}
              </span>
              <span className="text-slate-400 text-xs sm:text-sm">
                📅 جدول {formatDay(offer.asOf)}
              </span>
            </div>
          </div>

          {/* النسبة السنوية بخط ضخم */}
          <div className="text-end">
            <div className="text-3xl sm:text-5xl font-black tabular-nums text-emerald-600 tracking-tight">
              {pct(offer.rate)}
            </div>
            {offer.zakat !== "customer" && (
              <div className="text-xs sm:text-sm font-bold text-amber-700">
                معيار الترتيب: {offer.effective.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* شريط بياني متناسق للمقارنة */}
        <div className="mt-3.5 h-3 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
            style={{ width: `${width}%` }}
          />
        </div>

        {/* بطاقة الربح المتوقع بخط عريض وبالشكل 1,000,000 ر.س */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3.5 sm:p-4 border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-base sm:text-lg font-bold text-slate-600">الربح المتوقع للمدة:</span>
            <strong className="text-xl sm:text-3xl font-black tabular-nums text-slate-900">
              {money(offer.profit)} ر.س
            </strong>
          </div>

          <a
            href={offer.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-slate-900 hover:text-emerald-700 underline transition-colors"
          >
            <span>🔗</span>
            <span>التغريدة المصدر</span>
          </a>
        </div>
      </div>
    </li>
  );
}
