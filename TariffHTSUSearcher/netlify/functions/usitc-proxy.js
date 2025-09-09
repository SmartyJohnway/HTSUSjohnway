export async function handler(event, context) {
    const apiKey = process.env.USITC_API_KEY;
    const usitcApiUrl = "https://datawebws.usitc.gov/dataweb/api/v2/report2/runReport";

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: '只接受 POST 請求'
        };
    }

    try {
        const response = await fetch(usitcApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: event.body
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify(data)
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: '代理函數內部錯誤', details: error.message })
        };
    }
}
