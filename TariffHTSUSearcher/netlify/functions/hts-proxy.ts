import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const keyword = event.queryStringParameters?.keyword || '';
  if (!keyword) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing keyword parameter' })
    };
  }

  const url = `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(keyword)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-store"
      },
      body: JSON.stringify(data)
    };
  } catch (err: any) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to fetch from HTS API', details: err.message })
    };
  }
};
