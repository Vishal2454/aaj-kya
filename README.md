# Aaj Kya? — source & build

A fast, mobile-first, static utility website for India ("Aaj Kya?" = "What today?").
No framework, no build tool dependency beyond plain Node.js — output is plain
HTML/CSS/JS, so it's about as fast as a website can be and deploys anywhere
(Netlify, Vercel, GitHub Pages, S3+CloudFront, a plain nginx box, etc).

## Structure

```
src/
  data/
    categories.js   — the 8 site categories (single source of truth)
    tools.js         — every tool's SEO metadata, intro copy, FAQ (single source of truth)
    forms.js          — the actual <form> HTML for each tool
  build.js            — generates the whole /dist site from the data above
dist/
  index.html, /tools/<slug>/, /categories/<slug>/, /about/, /contact/,
  /privacy-policy/, /terms/, /search/, sitemap.xml, robots.txt, 404.html
  assets/css/style.css     — the whole design system (one file, no framework)
  assets/js/main.js        — nav, search-as-you-type, shared UI behaviour
  assets/js/calculators.js — the actual working logic for all 16 tools
  assets/js/tools-data.js  — generated: powers the search box (window.TOOLS)
```

## Adding a new tool (this is the whole workflow — no other file needs touching)

1. Add one entry to `src/data/tools.js` (slug, title, category, SEO copy, FAQ).
2. Add the form markup for it in `src/data/forms.js`, keyed by the same slug.
3. Add `CALC["your-slug"] = function(ctx) { ... }` in `dist/assets/js/calculators.js`
   — read inputs with `ctx.get("fieldName")`, write the answer with `ctx.setTicket(...)`.
4. Run `node src/build.js`.

That's it — the new tool automatically gets its own SEO-friendly page at
`/tools/your-slug/`, shows up in its category page, the homepage tool grid,
the sitemap, and the search box.

## Rebuilding

```
node src/build.js
```

Regenerates every generated HTML file, sitemap.xml and robots.txt from the
data files. It does NOT touch anything under `dist/assets/` except the
auto-generated `tools-data.js` and `favicon.svg`, so your CSS/JS edits are safe.

## Before you deploy

- **Domain**: set `SITE.domain` in `src/build.js` to your real domain, then rebuild.
- **AdSense**: replace `SITE.adsenseClientPlaceholder` (`ca-pub-XXXXXXXXXXXXXXXX`)
  in `src/build.js` with your real publisher ID, then uncomment the two
  commented blocks per page (the `<script async ...adsbygoogle.js...>` in
  `renderHead()` and the `<ins class="adsbygoogle">` in `renderAdSlot()`),
  then rebuild. Ad slots are already placed at sensible, non-intrusive spots
  (after the hero on every tool page, mid-scroll on category/home pages).
- **Contact emails**: `hello@aajkya.in` / `ads@aajkya.in` in the About/Contact/
  Privacy/Terms copy in `src/build.js` are placeholders — update them.
- **Analytics**: add your analytics snippet in the `renderHead()` function.
- **QR generator**: loads `qrcode.js` from cdnjs on that one page only
  (`https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`).
  Self-host it under `/assets/js/vendor/` if you'd rather not depend on a CDN.
- **Currency converter**: fetches live rates client-side from the free,
  keyless `open.er-api.com` API. Swap the URL in `calculators.js` for a paid
  provider if you need higher reliability/rate limits at scale.

## Performance notes

- Zero JS frameworks, zero build-step CSS — the whole site is ~3 small,
  cacheable static files (`style.css`, `main.js`, `calculators.js`) shared
  across every page.
- Fonts (Fraunces + Inter) are loaded via `<link>` with `display=swap` and
  `preconnect`, so text never blocks on font load.
- No layout-shifting images — icons are inline SVG.
