import { createServerFn } from "@tanstack/react-start";
import { AS_OF, SOURCE_URL } from "./market";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const KNOWN_ID = SOURCE_URL.split("/").pop() ?? "";

export type DiarySync = {
  checkedAt: string;
  nextCheckAt: string;
  sourceUrl: string;
  asOf: string;
  status: "current" | "newer" | "unreachable";
  headline: string;
};

type Cache = { at: number; sync: DiarySync };
let memory: Cache | null = null;

export const syncDiary = createServerFn({ method: "GET" }).handler(async (): Promise<DiarySync> => {
  const now = Date.now();
  if (memory && now - memory.at < SIX_HOURS) return memory.sync;
  const found = await findLatestBoard();
  const sync = describe(found, now);
  memory = { at: now, sync };
  return sync;
});

function describe(found: { id: string; url: string } | null, now: number): DiarySync {
  const checkedAt = new Date(now).toISOString();
  const nextCheckAt = new Date(now + SIX_HOURS).toISOString();
  if (!found) {
    return {
      checkedAt,
      nextCheckAt,
      sourceUrl: SOURCE_URL,
      asOf: AS_OF,
      status: "unreachable",
      headline: "تعذّر الوصول للتغريدات. الأرقام تبقى على آخر جدول منسوخ حتى الفحص التالي.",
    };
  }
  if (found.id === KNOWN_ID || BigInt(found.id) <= BigInt(KNOWN_ID)) {
    return {
      checkedAt,
      nextCheckAt,
      sourceUrl: SOURCE_URL,
      asOf: AS_OF,
      status: "current",
      headline: "آخر جدول نسب هو المعتمد. الفحص التالي بعد 6 ساعات.",
    };
  }
  return {
    checkedAt,
    nextCheckAt,
    sourceUrl: found.url,
    asOf: AS_OF,
    status: "newer",
    headline: "ظهرت تغريدة نسب أحدث. سيُعتمد جدولها في التحديث التالي.",
  };
}

async function findLatestBoard(): Promise<{ id: string; url: string } | null> {
  try {
    const res = await fetch(
      "https://syndication.twitter.com/srv/timeline-profile/screen-name/Diary24H",
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          accept: "text/html",
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (res.ok) {
      const html = await res.text();
      const ids = [...html.matchAll(/status\/(\d{15,22})/g)].map((match) => match[1]!);
      const unique: string[] = [];
      for (const id of ids) if (!unique.includes(id)) unique.push(id);
      for (const id of unique.slice(0, 6)) {
        const text = await readTweet(id);
        if (text?.includes("نسب الودائع")) {
          return { id, url: `https://x.com/Diary24H/status/${id}` };
        }
      }
    }
  } catch {
    /* fall through to the known table */
  }
  const known = await readTweet(KNOWN_ID);
  if (!known) return null;
  return { id: KNOWN_ID, url: SOURCE_URL };
}

async function readTweet(id: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/Diary24H/status/${id}`, {
      headers: { "user-agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tweet?: { text?: string } };
    return data.tweet?.text ?? null;
  } catch {
    return null;
  }
}
