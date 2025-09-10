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

// netlify/functions/fr-proxy.ts
var fr_proxy_exports = {};
__export(fr_proxy_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(fr_proxy_exports);
var handler = async (event) => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=fr-proxy.js.map
