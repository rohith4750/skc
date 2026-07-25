import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const to = searchParams.get("to") || "te"; // Default to Telugu (te)

  if (!text) {
    return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!res.ok) {
      throw new Error(`Translation API returned status ${res.status}`);
    }

    const data = await res.json();
    
    // Google translate returns an array where data[0][0][0] is the translated string
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      const translation = data[0][0][0];
      return NextResponse.json({ translation });
    }

    return NextResponse.json({ error: "Failed to extract translation from response" }, { status: 500 });
  } catch (error: any) {
    console.error("Translation API proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch translation" },
      { status: 500 }
    );
  }
}
