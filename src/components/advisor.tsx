import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarClock,
  Landmark,
  RotateCcw,
  Scale,
  ShieldCheck,
  TimerReset,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  money,
  pct,
  tenorLabel,
  ZAKAT_LABEL,
} from "@/lib/market";
import {
  formatDay,
  leftLabel,
  riyadhToday,
  SEED,
  STORAGE_KEY,
  type Deposit,
} from "@/lib/portfolio";
import { advise, rankOffers, type Advice, type Ranked } from "@/lib/recommend";

const TENORS = [1, 3, 6, 9, 12, 24] as const;

export function Advisor() {
  const [today, setToday] = useState("2026-10-28");
  const [deposits, setDeposits] = useState<Deposit[]>(SEED);
  const [ready, setReady] = useState(false);
  const [zakatOn, setZakatOn] = useState(true);
  const [selectedId, setSelectedId] = useState(SEED[0]!.id);
  const [tenor, setTenor] = useState<number | "auto">("auto");
  const [amountText, setAmountText] = useState("86038");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newBank, setNewBank] = useState("البلاد");
  const [newAmount, setNewAmount] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newMonths, setNewMonths] = useState<number>(6);
  const [newStart, setNewStart] = useState("2026-10-28");
  const [newMaturity, setNewMaturity] = useState("");

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newAmount);
    const rateNum = parseFloat(newRate);
    if (!amountNum || !rateNum || !newMaturity) return;

    const newDep: Deposit = {
      id: `dep-${Date.now()}`,
      bank: newBank,
      amount: amountNum,
      rate: rateNum,
      months: newMonths,
      start: newStart,
      maturity: newMaturity,
    };

    setDeposits((prev) => [...prev, newDep]);
    setSelectedId(newDep.id);
    setShowAddModal(false);
    setNewAmount("");
    setNewRate("");
    setNewMaturity("");
  };

  const handleDeleteDeposit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("هل تريد حذف هذا العقد من محفظتك؟")) {
      setDeposits((prev) => prev.filter((d) => d.id !== id));
      if (selectedId === id) {
        const remaining = deposits.filter((d) => d.id !== id);
        if (remaining.length) setSelectedId(remaining[0]!.id);
      }
    }
  };

  useEffect(() => {
    const tick = () => setToday(riyadhToday());
    tick();
    const id = window.setInterval(tick, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Deposit[];
        if (Array.isArray(parsed) && parsed.length) setDeposits(parsed);
      }
    } catch {
      /* keep the sheet */
    }
    setReady(true);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(deposits));
  }, [deposits, ready]);

  const advices = useMemo(
    () =>
      deposits
        .map((deposit) => advise(deposit, today, zakatOn))
        .sort((a, b) => a.view.left - b.view.left),
    [deposits, today, zakatOn],
  );

  const selected = advices.find((item) => item.view.deposit.id === selectedId) ?? advices[0];

  useEffect(() => {
    if (selected) setAmountText(String(Math.round(selected.rollAmount)));
  }, [selectedId, today, zakatOn, deposits]);

  const amount = Number(amountText.replace(/[^\d.]/g, "")) || 0;
  const ladder = useMemo(
    () => rankOffers(amount, tenor, zakatOn).slice(0, 6),
    [amount, tenor, zakatOn],
  );

  const principal = deposits.reduce((sum, item) => sum + item.amount, 0);
  const bookProfit = advices.reduce((sum, item) => sum + item.view.profit, 0);
  const daily = advices.reduce((sum, item) => {
    const days = Math.max(1, item.view.deposit.months * 30);
    return sum + item.view.profit / days;
  }, 0);
  const weighted =
    principal === 0
      ? 0
      : deposits.reduce((sum, item) => sum + item.amount * item.rate, 0) / principal;

  const urgent = advices.find((item) => item.view.left <= 1);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-gold">
            تحديث يومي · {formatDay(today)} · جداول @Diary24H
          </p>
          <h1 className="mt-1 font-display text-4xl leading-none text-ink">مرشد الوديعة</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            يرتّب عقودك بتاريخ الاستحقاق، ويقترح البنك والمنتج من آخر نسب منشورة:
            البلاد في 25 أكتوبر 2026 وبقية البنوك في 24 أكتوبر.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDeposits(SEED);
            setSelectedId(SEED[0]!.id);
            localStorage.removeItem(STORAGE_KEY);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs text-muted"
        >
          <RotateCcw className="size-3.5" />
          الجدول الأصلي
        </button>
      </header>

      {urgent && (
        <section className="mb-5 rounded-2xl border border-copper/30 bg-copper-soft p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-copper">
            <TimerReset className="size-4" />
            {leftLabel(urgent.view.left)} · {formatDay(urgent.view.deposit.maturity)}
          </div>
          <h2 className="mt-2 font-display text-3xl leading-snug text-ink">
            {urgent.headline}
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-ink/90">{urgent.detail}</p>
          {urgent.pick && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat k="المنتج" v={`${urgent.pick.bank} · ${urgent.pick.product}`} />
              <Stat k="النسبة والمدة" v={`${pct(urgent.pick.rate)} · ${tenorLabel(urgent.pick.tenorMonths)}`} />
              <Stat k="تاريخ التوصية" v={formatDay(urgent.pick.asOf)} />
            </div>
          )}
          {urgent.pick && (
            <TweetLink href={urgent.pick.sourceUrl} className="mt-3" />
          )}
        </section>
      )}

      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="أصل الودائع" value={`${money(principal)} ر.س`} />
        <Metric label="ربح العقود" value={`${money(bookProfit)} ر.س`} />
        <Metric label="ربح يومي تقريبي" value={`${money(daily)} ر.س`} />
        <Metric label="متوسط النسبة" value={pct(weighted)} />
      </section>

      <section className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">عقودك بالأولوية</h2>
            <button
              type="button"
              onClick={() => {
                setNewStart(today);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-pine px-3 py-1.5 text-xs font-semibold text-pine-ink hover:opacity-90 transition-opacity shadow-xs"
            >
              <Plus className="size-3.5" />
              إضافة وديعة جديدة
            </button>
          </div>
          <ZakatToggle on={zakatOn} setOn={setZakatOn} />
        </div>
        <ul className="grid gap-3">
          {advices.map((item) => (
            <li key={item.view.deposit.id}>
              <DepositCard
                advice={item}
                today={today}
                active={item.view.deposit.id === selected?.view.deposit.id}
                onSelect={() => setSelectedId(item.view.deposit.id)}
                onDelete={(e) => handleDeleteDeposit(item.view.deposit.id, e)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">سلّم المقارنة</h2>
            <p className="text-sm text-muted">
              نفس المبلغ على الشرائح المنشورة. الترتيب يضيف 2.5 نقطة تقديرية للمعفى ومدفوع الزكاة إذا كان الاعتبار مفعّلاً.
            </p>
          </div>
          <label className="text-xs text-muted">
            المبلغ
            <input
              inputMode="decimal"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              className="mt-1 block w-36 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink tabular-nums"
            />
          </label>
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
          body="منهج الحساب: استثمار بالوكالة في البلاد، أو نماء الإنماء وعز. فرق 0.15 نقطة لا يستحق نقل البنك."
        />
        <Principle
          icon={<CalendarClock className="size-4" />}
          title="لا تجديد تلقائي"
          body="النسبة التي يُنشأ بها العقد هي ربحك. العقد القائم لا ينقص إذا نزلت نسب اليوم التالي."
        />
        <Principle
          icon={<Scale className="size-4" />}
          title="لا تكسر لفرق صغير"
          body="أسهل كسر عنده: البلاد ثم الراجحي ثم الإنماء. لا تترك يوماً بعد الاستحقاق بلا عقد."
        />
      </section>

      <p className="mt-6 text-xs leading-relaxed text-faint">
        ليست استشارة استثمارية ولا فتوى زكاة. الأرقام منقولة من صور حساب @Diary24H العامة وقد تتغير في اليوم نفسه. الزكاة 2.5% هنا قاعدة ترتيب نشرها الحساب، لا احتساب شرعي لحولك. تأكد من الحد الأدنى ونص العقد داخل التطبيق قبل التحويل.
      </p>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-lg font-semibold text-ink">إضافة عقد وديعة جديد</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted hover:text-ink p-1 rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleAddDeposit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">اسم البنك</label>
                <select
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                  className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink"
                >
                  <option value="البلاد">بنك البلاد</option>
                  <option value="الإنماء">مصرف الإنماء</option>
                  <option value="عز">تطبيق عز (الإنماء)</option>
                  <option value="الراجحي">مصرف الراجحي</option>
                  <option value="الجزيرة">بنك الجزيرة</option>
                  <option value="الأهلي">البنك الأهلي السعودي (SNB)</option>
                  <option value="الرياض">بنك الرياض</option>
                  <option value="D360">بنك D360</option>
                  <option value="ميم">بنك ميم (meem)</option>
                  <option value="بنك آخر">بنك آخر</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">المبلغ (ر.س)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="مثال: 50000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">النسبة السنوية (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="مثال: 5.50"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">المدة (أشهر)</label>
                  <select
                    value={newMonths}
                    onChange={(e) => setNewMonths(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink"
                  >
                    <option value={1}>شهر</option>
                    <option value={3}>3 أشهر</option>
                    <option value={6}>6 أشهر</option>
                    <option value={9}>9 أشهر</option>
                    <option value={12}>12 شهر</option>
                    <option value={24}>24 شهر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">تاريخ البداية</label>
                  <input
                    type="date"
                    required
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    required
                    value={newMaturity}
                    onChange={(e) => setNewMaturity(e.target.value)}
                    className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-line px-4 py-2 text-sm text-muted hover:bg-surface-2"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-pine px-5 py-2 text-sm font-semibold text-pine-ink hover:opacity-90"
                >
                  حفظ الوديعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-surface/80 px-3 py-2">
      <div className="text-xs text-muted">{k}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink">{v}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-ink">{value}</div>
    </div>
  );
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

const ACTION_STYLE: Record<Advice["action"], string> = {
  reinvest: "bg-copper text-pine-ink",
  "roll-soon": "bg-gold text-pine-ink",
  hold: "bg-surface-2 text-hold",
};

const ACTION_WORD: Record<Advice["action"], string> = {
  reinvest: "نفّذ",
  "roll-soon": "جهّز",
  hold: "أبقِ",
};

function DepositCard({
  advice,
  today,
  active,
  onSelect,
  onDelete,
}: {
  advice: Advice;
  today: string;
  active: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const { deposit } = advice.view;
  const pick = advice.pick;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`w-full rounded-2xl border bg-surface p-4 text-start ${
        active ? "border-pine" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Landmark className="size-4 text-pine" />
            <span className="font-semibold">{deposit.bank}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${ACTION_STYLE[advice.action]}`}>
              {ACTION_WORD[advice.action]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{advice.headline}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-end">
            <div className="text-sm font-semibold tabular-nums">{leftLabel(advice.view.left)}</div>
            <div className="text-xs text-faint">{formatDay(deposit.maturity)}</div>
          </div>
          <button
            type="button"
            title="حذف العقد"
            onClick={onDelete}
            className="p-1.5 text-muted hover:text-red-500 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Pair k="المبلغ" v={`${money(deposit.amount)} ر.س`} />
        <Pair k="نسبتك" v={pct(deposit.rate)} />
        <Pair k="الربح المتوقع" v={`${money(advice.view.profit)} ر.س`} />
        <Pair k="المدة" v={tenorLabel(deposit.months)} />
      </dl>
      <div className="mt-3 rounded-xl border border-line bg-surface-2 px-3 py-2">
        {pick ? (
          <>
            <p className="text-xs text-gold">توصية {formatDay(pick.asOf)}</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {pick.bank} — {pick.product} — {tenorLabel(pick.tenorMonths)} — {pct(pick.rate)}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {ZAKAT_LABEL[pick.zakat]} · الأيام حُدّثت {formatDay(today)}
            </p>
            <TweetLink href={pick.sourceUrl} className="mt-1" />
          </>
        ) : (
          <p className="text-sm text-muted">لا توصية لهذا المبلغ في جدول {formatDay(today)}</p>
        )}
      </div>
    </div>
  );
}

function TweetLink({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className={`inline-flex text-xs font-medium text-pine underline ${className ?? ""}`}
    >
      رابط التغريدة
    </a>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-bg px-2 py-1.5">
      <dt className="text-faint">{k}</dt>
      <dd className="font-medium tabular-nums text-ink">{v}</dd>
    </div>
  );
}

function LadderRow({ offer, place, max }: { offer: Ranked; place: number; max: number }) {
  const width = Math.max(8, Math.round((offer.effective / max) * 100));
  return (
    <li className="grid grid-cols-[1.5rem_1fr] gap-3 py-3">
      <span className="pt-0.5 text-sm text-faint tabular-nums">{place}</span>
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-semibold">
            {offer.bank}
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
