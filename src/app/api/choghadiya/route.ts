import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // format: DD/MM/YYYY
    const lang = searchParams.get("lang") || "en"; // default English
    if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

    // Use lang parameter in URL
    const url = `https://www.drikpanchang.com/muhurat/choghadiya.html?date=${date}&lang=${lang}`;
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });

    const html = await res.text();
    const $ = cheerio.load(html);

    const choghadiyaData: { name: string; start: string; end: string }[] = [];

    $("div.dpMuhurtaCard div.dpMuhurtaRow").each((_, el) => {
      const name = $(el).find(".dpMuhurtaName .dpVerticalMiddleText").text().trim();
      const start = $(el).find(".dpMuhurtaTime .dpVerticalMiddleText").contents().first().text().trim();
      const end = $(el).find(".dpMuhurtaTime .dpInlineBlock").text().trim();

      choghadiyaData.push({ name, start, end });
    });

    return NextResponse.json({ date, lang, choghadiya: choghadiyaData });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
