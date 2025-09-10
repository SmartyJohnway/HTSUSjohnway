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

// netlify/functions/hts-proxy.ts
var hts_proxy_exports = {};
__export(hts_proxy_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(hts_proxy_exports);
var handler = async (event) => {
  const keyword = event.queryStringParameters?.keyword || "";
  if (!keyword) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing keyword parameter" })
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
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Failed to fetch from HTS API", details: err.message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=hts-proxy.js.map
