# Repository Snapshot & Merge Prep Report

- Unzipped to: `/mnt/data/HTSUSjohnway-2025SepCombine`
- Files indexed: **139**

## Key Files Detected

- **package_json** (12):
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/data-uri-to-buffer/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/fetch-blob/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/formdata-polyfill/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/node-domexception/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/node-fetch/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/es2018/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/es6/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/ponyfill/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/ponyfill/es2018/package.json`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/ponyfill/es6/package.json`

- **netlify_toml** (1):
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/netlify.toml`

- **gitmodules** (0):

- **readme** (7):
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/README.md`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/data-uri-to-buffer/README.md`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/fetch-blob/README.md`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/formdata-polyfill/README.md`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/node-domexception/README.md`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/node-fetch/README.md`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/README.md`

- **html** (1):
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/index.html`

- **functions_dir** (6):
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/netlify/functions/build-search-index.mjs`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/netlify/functions/get-index.mjs`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/netlify/functions/hts-proxy.js`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/netlify/functions/refresh-fr232.mjs`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/netlify/functions/refresh-hts.mjs`
  - `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/netlify/functions/refresh-regs232.mjs`

## package.json Summaries

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/package.json`
  - name: `tariff-htsus-app2` | private: `None`
  - scripts: test
  - dependencies: @netlify/blobs
  - devDependencies: autoprefixer, jest, postcss, tailwindcss

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/data-uri-to-buffer/package.json`
  - name: `data-uri-to-buffer` | private: `None`
  - scripts: build, test, prepublishOnly
  - dependencies: (none)
  - devDependencies: @types/jest, @types/node, jest, ts-jest, typescript

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/fetch-blob/package.json`
  - name: `fetch-blob` | private: `None`
  - scripts: test, report, coverage, prepublishOnly
  - dependencies: node-domexception, web-streams-polyfill
  - devDependencies: @types/node, c8, typescript

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/formdata-polyfill/package.json`
  - name: `formdata-polyfill` | private: `None`
  - scripts: build, test, test-wpt, test-polyfill
  - dependencies: fetch-blob
  - devDependencies: @types/google-closure-compiler, @types/node, google-closure-compiler

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/node-domexception/package.json`
  - name: `node-domexception` | private: `None`
  - scripts: (none)
  - dependencies: (none)
  - devDependencies: (none)

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/node-fetch/package.json`
  - name: `node-fetch` | private: `None`
  - scripts: test, coverage, test-types, lint
  - dependencies: data-uri-to-buffer, fetch-blob, formdata-polyfill
  - devDependencies: abort-controller, abortcontroller-polyfill, busboy, c8, chai, chai-as-promised, chai-iterator, chai-string, coveralls, form-data, formdata-node, mocha, p-timeout, stream-consumers, tsd, xo

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/package.json`
  - name: `web-streams-polyfill` | private: `None`
  - scripts: test, test:wpt, test:wpt:node, test:wpt:chromium, test:wpt:firefox, test:types, test:unit, lint, build, build:bundle, build:types, accept:types, postbuild:types, prepare
  - dependencies: (none)
  - devDependencies: @microsoft/api-extractor, @rollup/plugin-inject, @rollup/plugin-replace, @rollup/plugin-strip, @rollup/plugin-terser, @rollup/plugin-typescript, @types/node, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, @ungap/promise-all-settled, downlevel-dts, eslint, jasmine, micromatch, minimist, playwright, recursive-readdir, rollup, ts-morph, tslib, typescript, wpt-runner

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/es2018/package.json`
  - name: `web-streams-polyfill-es2018` | private: `None`
  - scripts: (none)
  - dependencies: (none)
  - devDependencies: (none)

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/es6/package.json`
  - name: `web-streams-polyfill-es6` | private: `None`
  - scripts: (none)
  - dependencies: (none)
  - devDependencies: (none)

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/ponyfill/package.json`
  - name: `web-streams-ponyfill` | private: `None`
  - scripts: (none)
  - dependencies: (none)
  - devDependencies: (none)

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/ponyfill/es2018/package.json`
  - name: `web-streams-ponyfill-es2018` | private: `None`
  - scripts: (none)
  - dependencies: (none)
  - devDependencies: (none)

- Path: `HTSUSjohnway-2025SepCombine/TariffHTSUSearcher/node_modules/web-streams-polyfill/ponyfill/es6/package.json`
  - name: `web-streams-ponyfill-es6` | private: `None`
  - scripts: (none)
  - dependencies: (none)
  - devDependencies: (none)

## Next-Step Merge Checklist (Draft)


1. Confirm target repository root and desired final layout (monorepo vs single-app).
2. Decide how to integrate `section232-app`'s app1~app4 into `TariffHTSUSearcher/Sources/` subfolder:
   - Keep each app in its own subdir (e.g., `sources/app1` ... `sources/app4`).
   - Normalize package managers, Node versions, and build outputs (`/dist` or `/build`).
3. Reconcile `package.json` scripts and dependencies:
   - Merge shared deps at workspace root or flatten into a single app.
   - Standardize scripts: `dev`, `build`, `preview`, `lint`, `format`.
4. Netlify deploy:
   - Ensure single `netlify.toml` at repo root with correct `base`, `build`, `publish`.
   - Place Netlify Functions under `/netlify/functions/` and verify imports.
5. Remove obsolete submodule references (`.gitmodules`), fix paths, and clean broken links.
6. Add top-level `README.md` describing all apps, data sources (USITC DataWeb, HTSUS), and how to run locally.
7. Create `CODEx_WORK_ORDER.md` with task-by-task workflow for Codex & VS Code UI (no CLI), plus branching/PR guide.
8. Validate JSON files to prevent `EJSONPARSE` errors.
9. Run local smoke tests for each app; pin Node (e.g., `18.20.x`) via `.nvmrc` or Netlify `NODE_VERSION`.
