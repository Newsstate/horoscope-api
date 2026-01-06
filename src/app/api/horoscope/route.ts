import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type"
};

const ZODIAC_URLS: Record<string, string> = {
  aries: "mesha-rashi",
  taurus: "vrishabha-rashi",
  gemini: "mithuna-rashi",
  cancer: "karka-rashi",
  leo: "simha-rashi",
  virgo: "kanya-rashi",
  libra: "tula-rashi",
  scorpio: "vrishchika-rashi",
  sagittarius: "dhanu-rashi",
  capricorn: "makara-rashi",
  aquarius: "kumbha-rashi",
  pisces: "meen-rashi"
};

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;

    const sign = (params.get("sign") || "aries").toLowerCase();
    const day = (params.get("day") || "today").toLowerCase();
    const langRaw = (params.get("lang") || "en").toLowerCase();

    if (!ZODIAC_URLS[sign]) {
      return NextResponse.json(
        { error: "Invalid zodiac sign" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    /* ✅ FIX: normalize language */
    const isHindi = ["hi", "hindi"].includes(langRaw);
    const langParam = isHindi ? "hi" : "en";

    const rashiSlug = ZODIAC_URLS[sign];
    const url =
      `https://www.drikpanchang.com/astrology/prediction/${rashiSlug}/${rashiSlug}-daily-rashiphal.html` +
      `?prediction-day=${day}&lang=${langParam}&ck=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HoroscopeBot/1.0"
      },
      cache: "no-store"
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    let horoscope = "";

    /* ✅ safer selector */
    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 120 && !horoscope) {
        horoscope = text;
      }
    });

    if (!horoscope) {
      return NextResponse.json(
        { error: "Horoscope not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    /* ✅ language-aware date */
    const date = new Date().toLocaleDateString(
      isHindi ? "hi-IN" : "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

    return NextResponse.json(
      {
        sign,
        day,
        lang: isHindi ? "hi" : "en",
        date,
        horoscope
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
