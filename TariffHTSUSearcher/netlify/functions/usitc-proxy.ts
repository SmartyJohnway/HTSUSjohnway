import type { Handler } from "@netlify/functions";

const USITC_API_URL = "https://datawebws.usitc.gov/dataweb/api/v2/report2/runReport";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const apiKey = process.env.DATAWEB_API_TOKEN;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "API token is not configured" }),
    };
  }

  try {
    const response = await fetch(USITC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: event.body,
    });

    const text = await response.text();

    // Check for non-JSON responses which can happen on errors
    if (!response.headers.get("content-type")?.includes("application/json")) {
       // If USITC returns a non-json error (like HTML), forward it but with an appropriate status
      return {
        statusCode: response.status,
        headers: { "Content-Type": "text/plain" },
        body: `Received non-JSON response from USITC API: ${text}`
      }
    }

    return {
      statusCode: response.status,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
      body: text,
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Proxy error", details: err.message }),
    };
  }
};
