// This is a Netlify Function.
// It acts as a proxy to bypass CORS issues when calling the USITC API from the browser.
// Uses the native fetch available in Node 18+.

const log = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { Allow: 'GET' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  // Get the 'keyword' from the query string parameters of the request
  const keyword = event.queryStringParameters.keyword;

  // If no keyword is provided, return an error.
  if (!keyword) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing keyword parameter' }),
    };
  }

  // The target API endpoint
  const API_ENDPOINT = `https://hts.usitc.gov/reststop/search?keyword=${encodeURIComponent(keyword)}`;

  try {
    // Make the actual request from the server-side function to the USITC API
    const response = await fetch(API_ENDPOINT, {
        headers: {
            'User-Agent': 'Tariff-Query-App/1.0'
        }
    });

    // Check if the API response is successful
    if (!response.ok) {
      const errorBody = await response.text();
      return { 
        statusCode: response.status, 
        body: `API Error: ${response.statusText}. Details: ${errorBody}` 
      };
    }

    // Get the JSON data from the API response
    const data = await response.json();
    
    // Add logging␊
    log('API Response:', JSON.stringify(data, null, 2));

    // Format the response - USITC API returns an array directly
    const formattedData = {
      results: Array.isArray(data) ? data : [],
      message: Array.isArray(data) && data.length > 0 
        ? `Found ${data.length} results` 
        : `No results found for keyword: ${keyword}`
    };

    // Log the formatted response␊
    log('Formatted Response:', JSON.stringify(formattedData, null, 2));

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
  } catch (error) {
    // Handle any network errors during the fetch
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from the HTS API.' }),
    };
  }
};
