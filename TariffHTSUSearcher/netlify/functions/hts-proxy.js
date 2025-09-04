import { safe } from "../../infra/guard.js";
import cache from "../../infra/cache.js";

// This is a Netlify Function.
// It acts as a proxy to bypass CORS issues when calling the USITC API from the browser.
// Uses the native fetch available in Node 18+.

const log = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

async function handler(event, context) {
  // Log incoming request details for debugging
  log('Incoming URL:', event.rawUrl || event.path);
  log('Incoming params:', event.queryStringParameters);

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { Allow: 'GET', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  // Get the 'keyword' from the query string parameters of the request
  const keyword = event.queryStringParameters.keyword;

  // If no keyword is provided, return an error.
  if (!keyword) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing keyword parameter' }),
    };
  }

  // Return cached result if available
  const cached = cache.get(keyword);
  if (cached) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(cached)
    };
  }

  // The target API endpoint
  const API_ENDPOINT = `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(keyword)}`;

  log('Requesting API endpoint:', API_ENDPOINT);

  // Make the actual request from the server-side function to the USITC API with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  let response;
  try {
    response = await fetch(API_ENDPOINT, {
      headers: {
        'User-Agent': 'Tariff-Query-App/1.0'
      },
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        statusCode: 504,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: '504 Gateway timeout' })
      };
    }
    throw err;
  }
  clearTimeout(timeoutId);

  // Check if the API response is successful
  if (!response.ok) {
    const errorBody = await response.text();
    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `API Error: ${response.statusText}. Details: ${errorBody}` })
    };
  }

  // Get the JSON data from the API response
  const json = await response.json();

  // Add logging
  log('API Response:', JSON.stringify(json, null, 2));

  // Validate schema
  if (!json || !Array.isArray(json.results)) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '502 Schema mismatch' })
    };
  }

  const formattedData = {
    results: json.results,
    message: json.results.length > 0
      ? `Found ${json.results.length} results`
      : `No results found for keyword: ${keyword}`
  };

  // Log the formatted response
  log('Formatted Response:', JSON.stringify(formattedData, null, 2));

  cache.set(keyword, formattedData);

  // Return a successful response to the frontend with the formatted data
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(formattedData)
  };
}

export const handler = safe(handler, (error) => {
  console.error('Proxy Error:', error);
  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Failed to fetch data from the HTS API.' }),
  };
});