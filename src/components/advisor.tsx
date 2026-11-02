import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AS_OF, money, pct, SOURCE_URL, tenorLabel, ZAKAT_LABEL } from "@/lib/market";
import { syncDiary, type DiarySync } from "@/lib/diary-sync";
import { formatDay, STORAGE_KEY } from "@/lib/portfolio";
import { rankOffers, type Ranked } from "@/lib/recommend";

const TENORS = [1, 3, 6, 9, 12, 24] as const;
const PRESET_AMOUNTS = [50_000, 100_000, 250_000, 500_000, 1_000_000];
const SIX_HOURS = 6 * 60 * 60 * 1000;

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

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6">
      {/* التنويه وإخلاء المسؤولية بخط عريض وكبير في الأعلى */}
      <div className="mb-8 rounded-3xl border-3 border-amber-500 bg-amber-500/15 p-5 sm:p-7 shadow-md">
        <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400 font-black text-xl sm:text-2xl mb-2">
          <span className="text-2xl sm:text-3xl">⚠️</span>
          <span>تنبيه وإخلاء مسؤولية هـام</span>
        </div>
        <p className="text-lg sm:text-2xl font-extrabold leading-relaxed text-ink">
          ليست استشارة استثمارية ولا فتوى زكاة. الأرقام منقولة من صور @Diary24H وقد تتغير في اليوم نفسه.
        </p>
      </div>

      {/* رأس الصفحة مع عنوان التطبيق ومعلومات التحديث */}
      <header className="mb-8 text-center sm:text-right">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-4 py-1.5 text-base sm:text-lg font-bold text-gold mb-3">
          <span>📅</span>
          <span>فحص @Diary24H كل 6 ساعات · جدول {tableDay}</span>
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black leading-tight text-ink flex items-center justify-center sm:justify-start gap-3">
          <span>🏦</span>
          <span>مرشد الوديعة</span>
          <span>💰</span>
          <span className="text-2xl sm:text-4xl text-pine font-extrabold">· سلّم المقارنة</span>
        </h1>
        <p className="mt-3 text-lg sm:text-2xl text-muted font-medium leading-relaxed">
          قارن بين أعلى عوائد الودائع البنكية المتاحة لمبلغك، حسب أحدث جداول نسب منشورة.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <span className="text-base sm:text-lg text-faint font-semibold">
            {sync
              ? `🔄 ${sync.headline} (آخر فحص: ${formatStamp(sync.checkedAt)})`
              : "⏳ جارٍ فحص آخر تغريدة نسب…"}
          </span>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-base sm:text-lg font-bold text-pine underline hover:opacity-80 transition-opacity"
          >
            <span>🔗</span>
            <span>رابط التغريدة المصدر على X</span>
          </a>
        </div>
      </header>

      {/* بطاقة التحكم بمبلغ الوديعة والمدة واحتساب الزكاة */}
      <section className="mb-8 rounded-3xl border-2 border-line bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-line">
          {/* إدخال المبلغ */}
          <div className="flex-1">
            <label className="block text-lg sm:text-xl font-black text-ink mb-2">
              💰 أدخل المبلغ المالي (ر.س)
            </label>
            <div className="relative">
              <input
                inputMode="decimal"
                value={amountText}
                onChange={(event) => setAmountText(event.target.value)}
                placeholder="100,000"
                className="w-full sm:w-80 rounded-2xl border-2 border-pine/40 bg-bg px-4 py-3.5 text-2xl sm:text-3xl font-black text-ink tabular-nums focus:border-pine focus:outline-hidden transition-colors"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted pointer-events-none">
                ر.س
              </span>
            </div>
            {/* أزرار مبالغ جاهزة وسريعة */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-muted">مبالغ شائعة:</span>
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountText(String(preset))}
                  className={`rounded-xl border px-3 py-1.5 text-sm sm:text-base font-bold transition-colors ${
                    amount === preset
                      ? "border-pine bg-pine text-pine-ink"
                      : "border-line bg-bg text-ink hover:border-pine/60"
                  }`}
                >
                  {money(preset)} ر.س
                </button>
              ))}
            </div>
          </div>

          {/* مفتاح الزكاة */}
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-base sm:text-lg font-bold text-muted mb-2">معيار الترتيب:</span>
            <ZakatToggle on={zakatOn} setOn={setZakatOn} />
          </div>
        </div>

        {/* فلاتر مدة الوديعة */}
        <div className="mt-6">
          <div className="text-base sm:text-lg font-bold text-muted mb-3 flex items-center gap-2">
            <span>⏱️</span>
            <span>اختر مدة الوديعة:</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Chip active={tenor === "auto"} onClick={() => setTenor("auto")}>
              🌟 كل المدد
            </Chip>
            {TENORS.map((value) => (
              <Chip key={value} active={tenor === value} onClick={() => setTenor(value)}>
                ⏱️ {tenorLabel(value)}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* سلّم المقارنة الكامل فقط */}
      <section className="rounded-3xl border-2 border-line bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-ink flex items-center gap-3">
              <span>🏆</span>
              <span>سلّم المقارنة وترتيب العوائد</span>
              <span>📊</span>
            </h2>
            <p className="mt-2 text-base sm:text-xl text-muted font-medium">
              مرتّبة من الأعلى إلى الأقل لمبلغ{" "}
              <strong className="text-pine font-black">{money(amount)} ر.س</strong>
              {tenor !== "auto" && ` لمدة ${tenorLabel(tenor)}`}
            </p>
          </div>
          <div className="text-base sm:text-lg font-bold text-muted bg-surface-2 px-4 py-2 rounded-2xl">
            {allRanked.length} عروض متوفرة
          </div>
        </div>

        <ol className="divide-y-2 divide-line">
          {displayedLadder.length === 0 && (
            <li className="py-12 text-center text-xl sm:text-2xl font-bold text-muted">
              🚫 لا توجد شرائح متاحة لهذا المبلغ والمدة. جرّب تغيير المبلغ أو اختيار &quot;كل المدد&quot;.
            </li>
          )}
          {displayedLadder.map((offer, index) => (
            <LadderRow
              key={offer.id}
              offer={offer}
              place={index + 1}
              max={allRanked[0]?.effective ?? 1}
              amount={amount}
            />
          ))}
        </ol>

        {allRanked.length > 10 && (
          <div className="mt-8 text-center pt-4 border-t-2 border-line">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 rounded-2xl bg-pine px-6 py-3 text-lg sm:text-xl font-bold text-pine-ink hover:opacity-90 transition-opacity shadow-sm"
            >
              {showAll ? "🔼 عرض أقل (أول 10 عروض)" : `🔽 عرض كل العروض المتاحة (${allRanked.length} عرض)`}
            </button>
          </div>
        )}
      </section>

      {/* تذييل الصفحة وتنبيه مراجعة البنك */}
      <footer className="mt-10 text-center">
        <p className="text-base sm:text-lg font-medium leading-relaxed text-muted max-w-3xl mx-auto">
          ⚠️ الأرقام منقولة من صور حساب @Diary24H العامة وتتغير دورياً. تأكد من الحد الأدنى ونص العقد والشروط داخل تطبيق البنك قبل إتمام الربط.
        </p>
      </footer>
    </main>
  );
}

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    timeZone: "Asia/Riyadh",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ZakatToggle({ on, setOn }: { on: boolean; setOn: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      className="inline-flex items-center gap-3 rounded-2xl border-2 border-line bg-surface-2 px-5 py-3 text-base sm:text-lg font-bold text-ink hover:border-pine transition-all shadow-2xs"
    >
      <span
        className={`size-3.5 rounded-full transition-colors ${
          on ? "bg-pine shadow-xs ring-2 ring-pine/30" : "bg-line"
        }`}
      />
      <span>{on ? "⚖️ أُفضّل المعفى من الزكاة (+2.5%)" : "⚖️ أقارن النسبة الإجمالية فقط"}</span>
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-2xl px-5 py-2.5 text-base sm:text-lg font-bold transition-all shadow-2xs ${
        active
          ? "bg-pine text-pine-ink shadow-sm"
          : "bg-surface-2 text-ink hover:bg-surface-2/80 hover:border-line"
      }`}
    >
      {children}
    </button>
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
  amount,
}: {
  offer: Ranked;
  place: number;
  max: number;
  amount: number;
}) {
  const width = Math.max(10, Math.round((offer.effective / max) * 100));

  return (
    <li className="grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_1fr] gap-4 py-5 items-start">
      {/* الترتيب / الميدالية */}
      <div className="flex flex-col items-center justify-center pt-1">
        <span className="text-2xl sm:text-3xl font-black text-gold">
          {placeIcon(place)}
        </span>
        {place > 3 && (
          <span className="text-xs font-bold text-muted">المرتبة</span>
        )}
      </div>

      {/* تفاصيل العرض والبنك */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-ink flex items-center gap-2">
              <span>{offer.bank}</span>
              <span className="text-lg sm:text-xl font-bold text-muted">· {offer.product}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm sm:text-base font-semibold text-muted">
              <span className="rounded-lg bg-surface-2 px-2.5 py-1 text-ink font-bold">
                ⏱️ {tenorLabel(offer.tenorMonths)}
              </span>
              <span className="rounded-lg bg-surface-2 px-2.5 py-1 text-pine font-bold">
                ⚖️ {ZAKAT_LABEL[offer.zakat]}
              </span>
              <span className="text-faint">
                📅 جدول {formatDay(offer.asOf)}
              </span>
            </div>
          </div>

          {/* النسبة المئوية */}
          <div className="text-end">
            <div className="text-3xl sm:text-5xl font-black tabular-nums text-pine tracking-tight">
              {pct(offer.rate)}
            </div>
            {offer.zakat !== "customer" && (
              <div className="text-xs sm:text-sm font-bold text-gold">
                معيار الترتيب: {offer.effective.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* شريط مقارنة بياني مرئي */}
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-pine transition-all duration-300"
            style={{ width: `${width}%` }}
          />
        </div>

        {/* بطاقة الربح المتوقع بخط عريض بالشكل 1,000,000 ر.س */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2/70 p-3 sm:p-4 border border-line">
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <span className="text-base sm:text-lg font-bold text-muted">الربح المتوقع للمدة:</span>
            <strong className="text-xl sm:text-2xl font-black tabular-nums text-ink">
              {money(offer.profit)} ر.س
            </strong>
          </div>

          <a
            href={offer.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-pine underline hover:opacity-80 transition-opacity"
          >
            <span>🔗</span>
            <span>المصدر على X</span>
          </a>
        </div>
      </div>
    </li>
  );
}
