import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    if (!params.has("per_page")) params.set("per_page", "20");
    if (!params.has("order")) params.set("order", "newest");
    const api = `https://www.federalregister.gov/api/v1/documents.json?${params.toString()}`;
    const r = await fetch(api);
    const text = await r.text();
    return {
      statusCode: r.status,
      headers: {
        "content-type": "application/json",
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
