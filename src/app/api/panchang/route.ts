import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || "";
    const lang = (searchParams.get("language") || "hi").toLowerCase();

    const baseUrl = "https://panchang.astrosage.com/panchang/aajkapanchang";
    const url = `${baseUrl}?date=${encodeURIComponent(
      dateParam
    )}&language=${encodeURIComponent(lang)}&lid=1261481`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const data: Record<string, string> = {};

    // try extracting common table rows
    doc.querySelectorAll("table tr").forEach((row) => {
      const th = row.querySelector("th")?.textContent?.trim();
      const td = row.querySelector("td")?.textContent?.trim();
      if (th && td) {
        data[th] = td;
      }
    });

    return NextResponse.json(
      {
        success: true,
        source: "astrosage",
        date: dateParam,
        language: lang,
        panchang: data
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
