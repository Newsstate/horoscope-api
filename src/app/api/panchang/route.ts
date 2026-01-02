import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type"
};

// Optional: default city, date etc
export async function GET(request: Request) {
  try {
    const urlParams = new URL(request.url).searchParams;
    const city = urlParams.get("city") || "Delhi"; // default city
    const dateParam = urlParams.get("date") || new Date().toISOString().slice(0,10); // YYYY-MM-DD

    // Build Drik Panchang URL
    const url = `https://www.drikpanchang.com/panchang/day-panchang.html?date=${dateParam}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PanchangBot/1.0; +https://example.com)"
      },
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("Failed to fetch panchang");
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Panchang scraping
    const panchangData: Record<string,string> = {};

    $(".panchang-container .panchang-row").each((_, el) => {
      const key = $(el).find(".panchang-label").text().trim();
      const value = $(el).find(".panchang-value").text().trim();
      if(key && value){
        panchangData[key] = value;
      }
    });

    return new NextResponse(
      JSON.stringify({
        date: dateParam,
        city,
        panchang: panchangData
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
