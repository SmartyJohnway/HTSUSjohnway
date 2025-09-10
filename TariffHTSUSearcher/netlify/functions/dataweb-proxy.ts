import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  try {
    const qs = event.queryStringParameters || {};
    const url = new URL("https://datawebws.usitc.gov/dataweb/api/trade_data");
    for (const [k,v] of Object.entries(qs)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }

    const r = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${process.env.DATAWEB_API_TOKEN}`,
        "Accept": "application/json"
      },
    });

    const text = await r.text();
    return {
      statusCode: r.status,
      headers: {
        "content-type": r.headers.get("content-type") || "application/json",
        "cache-control": "no-store"
      },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: String(err) })
    };
  }
};
