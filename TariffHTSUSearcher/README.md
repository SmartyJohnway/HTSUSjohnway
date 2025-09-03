# Tariff HTSUS Searcher

A web app for querying the U.S. International Trade Commission's Harmonized Tariff Schedule.

## Configuration

API requests are routed through a proxy by default. To use a different base URL, define `API_BASE_URL` on `window` before loading the application:

```html
<script>
  window.API_BASE_URL = '/.netlify/functions/hts-proxy'; // default
</script>
<script src="js/app2.js"></script>
```

If the proxy returns a non‑JSON response the app automatically falls back to the public USITC endpoint. When both proxy and fallback fail, a user-friendly error message is displayed.
