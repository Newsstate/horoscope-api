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
    // ... date and lang logic remains the same ...

    const html = await res.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const rawPanchang: Record<string, string> = {};

    // 1. Target all table cells that contain keys and values
    // Drik Panchang often uses classes like .dpPanchangKey and .dpPanchangValue
    // or standard table cells. We will iterate through all cells to find pairs.
    const cells = doc.querySelectorAll(".dpPanchangRow td, .panchang_table td, tr td");
    
    let currentKey = "";
    cells.forEach((cell) => {
      // Check if the cell acts as a label (usually contains a span or specific class)
      const isKey = cell.classList.contains('dpPanchangKey') || cell.querySelector('span') || cell.tagName === 'TH';
      const text = cell.textContent?.trim().replace(/[:.]/g, "") || "";

      if (text && (cell.classList.contains('dpPanchangKey') || cell.getAttribute('width') === '20%')) {
        currentKey = text;
      } else if (currentKey && text) {
        // If we have a key saved, this next cell is likely the value
        rawPanchang[currentKey] = text;
        currentKey = ""; // Reset for next pair
      }
    });

    // 2. Backup: If the specific class approach fails, use the index approach
    if (Object.keys(rawPanchang).length < 5) {
      doc.querySelectorAll("tr").forEach(row => {
        const tds = row.querySelectorAll("td");
        if (tds.length >= 2) {
          // Handles [Key][Value]
          rawPanchang[tds[0].textContent?.trim().replace(":", "") || ""] = tds[1].textContent?.trim() || "";
        }
        if (tds.length >= 4) {
          // Handles [Key][Value][Key][Value] structure seen in your image
          rawPanchang[tds[2].textContent?.trim().replace(":", "") || ""] = tds[3].textContent?.trim() || "";
        }
      });
    }

    // 3. Normalization (Mapping the Hindi keys from your image)
    const getVal = (enKey: string, hiKey: string) => {
      return rawPanchang[enKey] || rawPanchang[hiKey] || "N/A";
    };

    const normalizedData = {
      weekday: getVal("Weekday", "वार"),
      sunrise: getVal("Sunrise", "सूर्योदय"),
      sunset: getVal("Sunset", "सूर्यास्त"),
      tithi: { name: getVal("Tithi", "तिथि"), ends: "" },
      nakshatra: { name: getVal("Nakshatra", "नक्षत्र"), ends: "" },
      paksha: getVal("Paksha", "पक्ष"),
      moonsign: getVal("Moon Sign", "चन्द्र राशि"),
      sunsign: getVal("Sun Sign", "सूर्य राशि"),
      vikram_samvat: getVal("Vikram Samvat", "विक्रम संवत"),
      month: {
        amanta: getVal("Amanta", "अमान्त"), // Based on image "पौष - अमान्त"
        purnimanta: getVal("Purnimanta", "पौष - पूर्णिमान्त")
      }
    };

    return NextResponse.json({ success: true, ...normalizedData }, { headers: CORS_HEADERS });

  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
