import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function GET() {
  try {
    const url =
      "https://www.drikpanchang.com/astrology/prediction/mesha-rashi/mesha-rashi-daily-rashiphal.html?prediction-day=today";

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HoroscopeBot/1.0; +https://example.com)"
      },
      cache: "no-store"
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    let horoscope = "";

    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 120 && !horoscope) {
        horoscope = text;
      }
    });

    if (!horoscope) {
      return new NextResponse(
        JSON.stringify({ error: "Horoscope not found" }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return new NextResponse(
      JSON.stringify({
        sign: "Mesha (Aries)",
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }),
        horoscope
      }),
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
