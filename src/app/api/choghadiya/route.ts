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
    const dateParam = searchParams.get("date"); // format: DD/MM/YYYY
    const lang = (searchParams.get("lang") || "hi").toLowerCase();

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: "Date parameter is required (DD/MM/YYYY)" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const langPath = lang === "hi" ? "/hindi" : "";
    const url = `https://www.drikpanchang.com${langPath}/muhurat/choghadiya.html?date=${dateParam}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const choghadiyaData: { time: string; period: string }[] = [];

    // DrikPanchang Choghadiya table selector
    doc.querySelectorAll("div.choghadiya-table .row").forEach((row) => {
      const time = row.querySelector(".col-xs-6")?.textContent?.trim();
      const period = row.querySelector(".col-xs-6 + .col-xs-6")?.textContent?.trim();
      if (time && period) {
        choghadiyaData.push({ time, period });
      }
    });

    return NextResponse.json(
      {
        success: true,
        date: dateParam,
        lang,
        choghadiya: choghadiyaData,
        full_url: url,
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
