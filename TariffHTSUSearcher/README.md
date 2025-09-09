# Tariff HTSUS Searcher

A web app for querying the U.S. International Trade Commission's Harmonized Tariff Schedule.

## Features

- **Tariff lookup tools** for HTS codes and rules.
- **Sources Suite** with four modules:
  - **App1 – Sources Hub**: curated links to official/authoritative resources.
  - **App2 – Multi‑Source Search**: generate optimized search URLs across USITC, CBP, BIS, Federal Register, Regulations.gov and more.
  - **App3 – APIs & Datasets**: quick links to official APIs, CSV downloads and documentation.
  - **App4 – Index Search (Beta)**: lightweight MinimalSearchEngine index with CJK bigram support, stored via Netlify Blobs/KV.

## Configuration

API requests are routed through a proxy by default. To use a different base URL, define `API_BASE_URL` on `window` before loading the application:

```html
<script>
  window.API_BASE_URL = '/.netlify/functions/hts-proxy'; // default
</script>
<script src="js/app2.js"></script>
```

If the proxy returns a non‑JSON response the app automatically falls back to the public USITC endpoint. When both proxy and fallback fail, a user-friendly error message is displayed.

## Deployment (Netlify)

1. Connect the `TariffHTSUSearcher` directory to Netlify.
2. **Environment variables**
   - `REGS_API_KEY` – Regulations.gov v4 API key (required).
   - `USITC_API_KEY` – USITC DataWeb API key used by the `usitc-proxy` Netlify Function for the trade data dashboard (App 5).
   - (optional) other tokens such as `DATAWEB_TOKEN` if extending data pulls.
3. **Enable services**  
   - Netlify Functions (see `netlify/functions`)  
   - Netlify **Blobs/KV** for storing scheduled fetch results and search indexes.
4. `netlify.toml` already defines scheduled functions: `refresh-hts`, `refresh-fr232`, `refresh-regs232` and `build-search-index`.
5. Local development: `npm install` then `npm test` for Jest checks.

## Compliance

This tool is for research and assistance only; all official decisions rely on the original regulations and notices.  
Respect each source's licensing, terms of use and rate limits when accessing APIs or datasets.
