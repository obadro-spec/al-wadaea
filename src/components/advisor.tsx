import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarClock, Scale, ShieldCheck } from "lucide-react";
import { AS_OF, money, pct, SOURCE_URL, tenorLabel, ZAKAT_LABEL } from "@/lib/market";
import { syncDiary, type DiarySync } from "@/lib/diary-sync";
import { formatDay, STORAGE_KEY } from "@/lib/portfolio";
import { pickOffer, rankOffers, type Ranked } from "@/lib/recommend";

const TENORS = [1, 3, 6, 9, 12, 24] as const;
const SIX_HOURS = 6 * 60 * 60 * 1000;

export function Advisor() {
  const [zakatOn, setZakatOn] = useState(true);
  const [tenor, setTenor] = useState<number | "auto">("auto");
  const [amountText, setAmountText] = useState("100000");
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
  const ladder = useMemo(
    () => rankOffers(amount, tenor, zakatOn).slice(0, 8),
    [amount, tenor, zakatOn],
  );
  const pick = pickOffer(ladder);
  const sourceUrl = sync?.sourceUrl ?? pick?.sourceUrl ?? SOURCE_URL;
  const tableDay = formatDay(sync?.asOf ?? pick?.asOf ?? AS_OF);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-medium tracking-wide text-gold">
          فحص @Diary24H كل 6 ساعات · جدول {tableDay}
        </p>
        <h1 className="mt-1 font-display text-4xl leading-none text-ink">سلّم المقارنة</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          جرّب مبلغك. الترتيب من آخر جدول نسب نُسخ عن الحساب، ويُعاد فحص التغريدات كل 6 ساعات.
        </p>
        <p className="mt-2 text-xs text-faint">
          {sync
            ? `${sync.headline} آخر فحص ${formatStamp(sync.checkedAt)}.`
            : "جارٍ فحص آخر تغريدة نسب…"}
        </p>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-xs font-medium text-pine underline"
        >
          رابط التغريدة
        </a>
      </header>

      <section className="mb-5 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="text-xs text-muted">
            جرّب مبلغك
            <input
              inputMode="decimal"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              className="mt-1 block w-44 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink tabular-nums"
            />
          </label>
          <ZakatToggle on={zakatOn} setOn={setZakatOn} />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Chip active={tenor === "auto"} onClick={() => setTenor("auto")}>
            كل المدد
          </Chip>
          {TENORS.map((value) => (
            <Chip key={value} active={tenor === value} onClick={() => setTenor(value)}>
              {tenorLabel(value)}
            </Chip>
          ))}
        </div>
      </section>

      {pick && (
        <section className="mb-5 rounded-2xl border border-copper/30 bg-copper-soft p-5 sm:p-6">
          <p className="text-xs font-semibold text-copper">التوصية · {tableDay}</p>
          <h2 className="mt-2 font-display text-3xl leading-snug text-ink">
            {pick.bank} — {pick.product}
          </h2>
          <p className="mt-2 text-sm text-ink/90">
            {tenorLabel(pick.tenorMonths)} · {pct(pick.rate)} · {ZAKAT_LABEL[pick.zakat]} · ربح{" "}
            {money(pick.profit)} ر.س على {money(amount)} ر.س
          </p>
          <a
            href={pick.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-xs font-medium text-pine underline"
          >
            رابط التغريدة
          </a>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 className="text-lg font-semibold">السلّم</h2>
        <p className="text-sm text-muted">
          نفس المبلغ على الشرائح المنشورة. المعفى ومدفوع الزكاة يأخذ 2.5 نقطة في الترتيب إذا كان الاعتبار مفعّلاً.
        </p>
        <ol className="mt-3 divide-y divide-line">
          {ladder.length === 0 && (
            <li className="py-6 text-sm text-muted">لا توجد شريحة لهذا المبلغ والمدة.</li>
          )}
          {ladder.map((offer, index) => (
            <LadderRow key={offer.id} offer={offer} place={index + 1} max={ladder[0]?.effective ?? 1} />
          ))}
        </ol>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Principle
          icon={<ShieldCheck className="size-4" />}
          title="المعفى أولاً"
          body="منهج الحساب: وكالة البلاد أو نماء الإنماء وعز. فرق 0.15 نقطة لا يستحق نقل البنك."
        />
        <Principle
          icon={<CalendarClock className="size-4" />}
          title="كل 6 ساعات"
          body="الموقع يراجع تغريدات الحساب ويعتمد آخر جدول نسب. لا عقود محفوظة هنا، أنت تجرّب المبلغ."
        />
        <Principle
          icon={<Scale className="size-4" />}
          title="لا تجديد تلقائي"
          body="أسهل كسر: البلاد ثم الراجحي ثم الإنماء. أكّد النسبة داخل التطبيق صباح الاشتراك."
        />
      </section>

      <p className="mt-6 text-xs leading-relaxed text-faint">
        ليست استشارة استثمارية ولا فتوى زكاة. الأرقام منقولة من صور @Diary24H وقد تتغير في اليوم نفسه. الزكاة 2.5% قاعدة ترتيب نشرها الحساب، لا احتساب شرعي لحولك.
      </p>
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
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs"
    >
      <span className={`size-2 rounded-full ${on ? "bg-pine" : "bg-line"}`} />
      {on ? "أُفضّل المعفى من الزكاة" : "أقارن النسبة الإجمالية فقط"}
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
      className={`shrink-0 rounded-full px-3 py-2 text-xs ${
        active ? "bg-pine text-pine-ink" : "bg-surface-2 text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function LadderRow({ offer, place, max }: { offer: Ranked; place: number; max: number }) {
  const width = Math.max(8, Math.round((offer.effective / max) * 100));
  return (
    <li className="py-3">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-semibold">
            {place}. {offer.bank}
            <span className="font-normal text-muted"> · {offer.product}</span>
          </div>
          <div className="text-sm font-semibold tabular-nums text-pine">{pct(offer.rate)}</div>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-pine" style={{ width: `${width}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted">
          {tenorLabel(offer.tenorMonths)} · {ZAKAT_LABEL[offer.zakat]} · جدول {formatDay(offer.asOf)} · ربح{" "}
          {money(offer.profit)} ر.س
          {offer.zakat !== "customer" ? ` · ترتيب ${offer.effective.toFixed(2)}` : ""}
        </p>
        <a
          href={offer.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex text-xs font-medium text-pine underline"
        >
          رابط التغريدة
        </a>
      </div>
    </li>
  );
}

function Principle({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-pine">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </article>
  );
}
