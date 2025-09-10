"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/usitc-proxy.ts
var usitc_proxy_exports = {};
__export(usitc_proxy_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(usitc_proxy_exports);
var USITC_API_URL = "https://datawebws.usitc.gov/dataweb/api/v2/report2/runReport";
var handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }
  const apiKey = process.env.DATAWEB_API_TOKEN;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "API token is not configured" })
    };
  }
  try {
    const response = await fetch(USITC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: event.body
    });
    const text = await response.text();
    if (!response.headers.get("content-type")?.includes("application/json")) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "text/plain" },
        body: `Received non-JSON response from USITC API: ${text}`
      };
    }
    return {
      statusCode: response.status,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Proxy error", details: err.message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=usitc-proxy.js.map
