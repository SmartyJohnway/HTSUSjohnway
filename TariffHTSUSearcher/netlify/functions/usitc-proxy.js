import { safe } from "../../infra/guard.js";

const USITC_API_URL = "https://datawebws.usitc.gov/dataweb/api/v2/report2/runReport";

async function usitcProxy(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST", "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  const apiKey = process.env.USITC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing USITC_API_KEY" })
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 增加超時時間
  let response;
  try {
    response = await fetch(USITC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "User-Agent": "Tariff-Query-App/1.0"
      },
      body: event.body,
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("USITC API fetch error:", err);
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to reach USITC API", details: err.message })
    };
  }
  clearTimeout(timeoutId);

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON response from USITC API", details: err.message, raw: text })
    };
  }

  if (!response.ok) {
    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type"
    },
    body: JSON.stringify(data)
  };
}

export const handler = safe(usitcProxy, (error) => {
  return {
    statusCode: 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: "Proxy error", details: error.message })
  };
});