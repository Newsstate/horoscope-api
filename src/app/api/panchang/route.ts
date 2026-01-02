import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function GET(request: Request) {
  try {
    const urlParams = new URL(request.url).searchParams;
    const dateParam = urlParams.get("date") || new Date().toISOString().slice(0,10); // YYYY-MM-DD

    const url = `https://www.drikpanchang.com/panchang/day-panchang.html?date=${dateParam}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PanchangBot/1.0; +https://example.com)"
      },
      cache: "no-store"
    });

    if (!res.ok) throw new Error("Failed to fetch Panchang");

    const html = await res.text();
    const $ = cheerio.load(html);

    const panchangData: Record<string,string> = {};

    // The main Panchang info is inside .panchang-detail divs
    $(".panchang-detail").each((_, el) => {
      const label = $(el).find(".panchang-label").text().trim();
      const value = $(el).find(".panchang-value").text().trim();
      if(label && value){
        panchangData[label] = value;
      }
    });

    // If still empty, try the table rows
    if(Object.keys(panchangData).length===0){
      $("table tr").each((_, el) => {
        const key = $(el).find("th").text().trim();
        const val = $(el).find("td").text().trim();
        if(key && val){
          panchangData[key] = val;
        }
      });
    }

    return new NextResponse(
      JSON.stringify({
        date: dateParam,
        city: "Delhi",
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
