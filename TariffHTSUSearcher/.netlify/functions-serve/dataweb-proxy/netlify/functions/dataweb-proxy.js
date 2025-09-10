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

// netlify/functions/dataweb-proxy.ts
var dataweb_proxy_exports = {};
__export(dataweb_proxy_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(dataweb_proxy_exports);
var handler = async (event) => {
  try {
    const qs = event.queryStringParameters || {};
    const url = new URL("https://datawebws.usitc.gov/dataweb/api/trade_data");
    for (const [k, v] of Object.entries(qs)) {
      if (v !== void 0 && v !== null) url.searchParams.set(k, String(v));
    }
    const r = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${process.env.DATAWEB_API_TOKEN}`,
        "Accept": "application/json"
      }
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=dataweb-proxy.js.map
