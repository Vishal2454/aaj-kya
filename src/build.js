#!/usr/bin/env node
/**
 * Aaj Kya? — build script.
 * Generates the full static site into /dist from the data registries.
 * Run: node src/build.js
 */
const fs = require("fs");
const path = require("path");

const categories = require("./data/categories.js");
const tools = require("./data/tools.js");
const forms = require("./data/forms.js");

const SITE = {
  name: "Aaj Kya?",
  domain: "https://www.aajkya.in", // placeholder — point this at your real domain before launch
  tagline: "Everyday answers, one search away.",
  buildDate: new Date().toISOString().slice(0, 10),
  adsenseClientPlaceholder: "ca-pub-XXXXXXXXXXXXXXXX",
};

const DIST = path.join(__dirname, "..", "dist");
const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
tools.forEach((t) => { t.categoryTitle = catBySlug[t.category].title; t.url = `/tools/${t.slug}/`; });

// ---------------------------------------------------------------------
// tiny helpers
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function write(relPath, content) {
  const full = path.join(DIST, relPath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, "utf8");
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toolsInCategory(catSlug) { return tools.filter((t) => t.category === catSlug); }

// ---------------------------------------------------------------------
// SVG icon set (inline, no image requests — keeps the site fast)
const ICONS = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-3.6-3.6"></path></svg>`,
  calculators: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="7" x2="16" y2="7"></line><line x1="8" y1="12" x2="8" y2="12"></line><line x1="12" y1="12" x2="12" y2="12"></line><line x1="16" y1="12" x2="16" y2="12"></line><line x1="8" y1="16" x2="8" y2="16"></line><line x1="12" y1="16" x2="12" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>`,
  money: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="3"></circle><path d="M6 6v.01M18 18v.01"></path></svg>`,
  "dates-time": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  food: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M3 2v7a4 4 0 0 0 8 0V2"></path><path d="M7 2v20"></path><path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"></path></svg>`,
  travel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M14 9V5a3 3 0 0 0-6 0v4"></path><path d="M2 11h20l-2 9H4z"></path><circle cx="8" cy="20" r="1"></circle><circle cx="16" cy="20" r="1"></circle></svg>`,
  shopping: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
  converters: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
  "everyday-tools": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
};
function icon(name) { return ICONS[name] || ICONS.search; }

// ---------------------------------------------------------------------
// Head: meta + Open Graph + JSON-LD
function renderHead({ title, description, canonicalPath, jsonLd = [], keywords = [] }) {
  const url = SITE.domain + canonicalPath;
  const jsonLdBlocks = jsonLd.map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`).join("\n  ");
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${keywords.length ? `<meta name="keywords" content="${esc(keywords.join(", "))}">` : ""}
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#10151f">
  <link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css">
  <!-- Google AdSense: uncomment and add your publisher ID once approved.
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsenseClientPlaceholder}" crossorigin="anonymous"></script>
  -->
  ${jsonLdBlocks}`;
}

// ---------------------------------------------------------------------
// Header / footer / search box (shared components)
function renderSearchBox({ variant = "default", placeholder = "What do you want to know? GST, EMI, age…" } = {}) {
  return `<div class="search-box${variant === "hero" ? " search-box--hero" : ""}" data-search-root>
        <span class="search-box__icon" aria-hidden="true">${icon("search")}</span>
        <label for="search-${variant}" class="visually-hidden">Search tools</label>
        <input type="search" id="search-${variant}" class="search-box__field" placeholder="${esc(placeholder)}" autocomplete="off">
        <div class="search-suggest" role="listbox"></div>
      </div>`;
}

function renderHeader(activePath = "") {
  const navLinks = categories
    .slice(0, 6)
    .map((c) => `<a href="/categories/${c.slug}/"${activePath === `/categories/${c.slug}/` ? ' aria-current="page"' : ""}>${esc(c.title)}</a>`)
    .join("\n        ");
  const mobileLinks = categories
    .map((c) => `<a href="/categories/${c.slug}/">${esc(c.title)}</a>`)
    .join("\n        ");
  return `<header class="site-header">
    <div class="container site-header__bar">
      <a href="/" class="logo"><span class="logo__mark">Aaj</span>&nbsp;Kya?</a>
      <nav class="site-header__nav" aria-label="Categories">
        ${navLinks}
      </nav>
      ${renderSearchBox({ variant: "header", placeholder: "Search tools…" })}
      <button class="nav-toggle" data-nav-toggle aria-expanded="false" aria-controls="mobile-nav" aria-label="Menu">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
    </div>
    <nav class="container mobile-nav" id="mobile-nav" data-mobile-nav aria-label="Categories, mobile">
        ${mobileLinks}
        <a href="/search/">All tools</a>
    </nav>
  </header>`;
}

function renderFooter() {
  const catLinks = categories.map((c) => `<a href="/categories/${c.slug}/">${esc(c.title)}</a>`).join("\n          ");
  const popularTools = tools.slice(0, 8).map((t) => `<a href="${t.url}">${esc(t.title)}</a>`).join("\n          ");
  return `<footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="/" class="logo"><span class="logo__mark">Aaj</span>&nbsp;Kya?</a>
          <p class="tag">Free, fast, everyday calculators and tools for India — GST, EMI, age, dates, currency and more. No sign-up, no clutter.</p>
        </div>
        <div>
          <h4>Categories</h4>
          ${catLinks}
        </div>
        <div>
          <h4>Popular tools</h4>
          ${popularTools}
        </div>
        <div>
          <h4>Site</h4>
          <a href="/about/">About</a>
          <a href="/contact/">Contact</a>
          <a href="/privacy-policy/">Privacy Policy</a>
          <a href="/terms/">Terms of Use</a>
          <a href="/sitemap.xml">Sitemap</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-year></span> Aaj Kya?. All calculations run in your browser.</span>
        <span>Made for everyday India 🇮🇳</span>
      </div>
    </div>
  </footer>`;
}

function renderAdSlot(label = "Advertisement") {
  return `<div class="ad-slot ad-slot--inline">
    <div class="ad-slot__inner">
      <!-- AdSense unit placeholder — replace with your <ins class="adsbygoogle"> unit.
      <ins class="adsbygoogle" style="display:block" data-ad-client="${SITE.adsenseClientPlaceholder}" data-ad-slot="0000000000" data-ad-format="auto" data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      -->
      ${esc(label)}
    </div>
  </div>`;
}

function breadcrumbHTML(items) {
  const parts = items
    .map((it, i) => (i < items.length - 1 ? `<a href="${it.url}">${esc(it.name)}</a><span aria-hidden="true">/</span>` : `<span aria-current="page">${esc(it.name)}</span>`))
    .join(" ");
  return `<nav class="container breadcrumb" aria-label="Breadcrumb">${parts}</nav>`;
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: SITE.domain + it.url,
    })),
  };
}

// ---------------------------------------------------------------------
function page({ title, description, canonicalPath, bodyClass = "", jsonLd = [], keywords = [], main, extraScripts = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  ${renderHead({ title, description, canonicalPath, jsonLd, keywords })}
</head>
<body class="${bodyClass}">
  <a href="#main" class="skip-link">Skip to content</a>
  ${renderHeader(canonicalPath)}
  <main id="main">
    ${main}
  </main>
  ${renderFooter()}
  <script src="/assets/js/tools-data.js"></script>
  <script src="/assets/js/main.js"></script>
  ${extraScripts}
</body>
</html>`;
}

// ---------------------------------------------------------------------
// Homepage
function buildHome() {
  const catCards = categories
    .map(
      (c) => `<a class="cat-card" href="/categories/${c.slug}/">
        <span class="cat-card__icon" aria-hidden="true">${icon(c.slug)}</span>
        <span class="cat-card__hindi">${esc(c.hindi)}</span>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.description)}</p>
      </a>`
    )
    .join("\n      ");

  const toolCards = tools
    .slice(0, 12)
    .map(
      (t) => `<a class="tool-card" href="${t.url}">
        <span class="tool-card__icon" aria-hidden="true">${icon(t.category)}</span>
        <span>
          <span class="tool-card__cat">${esc(t.categoryTitle)}</span>
          <h3>${esc(t.title)}</h3>
          <p>${esc(t.tagline)}</p>
        </span>
      </a>`
    )
    .join("\n      ");

  const chips = ["gst-calculator", "emi-calculator", "age-calculator", "currency-converter", "bmi-calculator", "qr-generator"]
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean)
    .map((t) => `<a class="chip" href="${t.url}">${esc(t.title)}</a>`)
    .join("\n        ");

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.domain + "/",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE.domain}/search/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE.name,
      url: SITE.domain + "/",
    },
  ];

  const main = `
    <section class="hero">
      <div class="container hero__inner">
        <p class="eyebrow" style="color:rgba(255,255,255,0.7)">Free • No sign-up • Works on any phone</p>
        <h1>Aaj Kya? <span class="hero__hindi">— आज क्या?</span></h1>
        <p class="hero__sub">One search box for the everyday maths of Indian life — GST, EMI, discounts, dates, currency and more. Type what you want to know.</p>
        ${renderSearchBox({ variant: "hero", placeholder: "Try “GST calculator” or “age from date of birth”" })}
        <div class="hero__chips">
          ${chips}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section__head">
          <div>
            <p class="eyebrow">Browse</p>
            <h2 class="mt-0">Categories</h2>
          </div>
        </div>
        <div class="cat-grid">
          ${catCards}
        </div>
      </div>
    </section>

    ${renderAdSlot("Advertisement")}

    <section class="section section--muted">
      <div class="container">
        <div class="section__head">
          <div>
            <p class="eyebrow">Popular right now</p>
            <h2 class="mt-0">Tools people use daily</h2>
          </div>
          <a href="/search/" class="btn btn--ghost btn--sm">See all tools →</a>
        </div>
        <div class="tool-grid">
          ${toolCards}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container prose">
        <h2>Everyday answers, without the ads-first clutter</h2>
        <p>Aaj Kya? ("What today?") is a set of small, fast tools for the maths that comes up every day in India — working out a discount at a sale, splitting a restaurant bill, checking GST on an invoice, or counting the days until a wedding. No app to install, no account to create. Just open a tool, type your numbers, and get your answer.</p>
        <p>More tools are added regularly across Calculators, Money, Dates &amp; Time, Food, Travel, Shopping, Converters and Everyday Tools — search for what you need above, or browse by category.</p>
      </div>
    </section>
  `;

  write(
    "index.html",
    page({
      title: `${SITE.name} — Everyday Calculators & Tools for India`,
      description: "Free everyday tools for India — GST calculator, EMI calculator, age calculator, discount calculator, currency converter, QR generator and more. Fast, mobile-friendly, no sign-up.",
      canonicalPath: "/",
      jsonLd,
      keywords: ["aaj kya", "gst calculator", "emi calculator", "age calculator india", "everyday calculators india"],
      main,
    })
  );
}

// ---------------------------------------------------------------------
// Category pages
function buildCategories() {
  categories.forEach((c) => {
    const list = toolsInCategory(c.slug);
    const cards = list
      .map(
        (t) => `<a class="tool-card" href="${t.url}">
        <span class="tool-card__icon" aria-hidden="true">${icon(t.category)}</span>
        <span>
          <h3>${esc(t.title)}</h3>
          <p>${esc(t.tagline)}</p>
        </span>
      </a>`
      )
      .join("\n      ");

    const jsonLd = [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: c.title, url: `/categories/${c.slug}/` },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${c.title} — ${SITE.name}`,
        url: `${SITE.domain}/categories/${c.slug}/`,
      },
    ];

    const main = `
      ${breadcrumbHTML([{ name: "Home", url: "/" }, { name: c.title, url: `/categories/${c.slug}/` }])}
      <section class="section--tight container">
        <p class="eyebrow">${esc(c.hindi)}</p>
        <h1>${esc(c.title)}</h1>
        <p class="tool-hero__tagline">${esc(c.description)}</p>
      </section>
      <section class="section section--tight">
        <div class="container">
          <div class="tool-grid">
            ${cards || "<p>Tools in this category are coming soon.</p>"}
          </div>
        </div>
      </section>
      ${renderAdSlot("Advertisement")}
    `;

    write(
      `categories/${c.slug}/index.html`,
      page({
        title: `${c.title} — Free Tools & Calculators | ${SITE.name}`,
        description: c.description,
        canonicalPath: `/categories/${c.slug}/`,
        jsonLd,
        main,
      })
    );
  });
}

// ---------------------------------------------------------------------
// Tool pages
function buildTools() {
  tools.forEach((t) => {
    const formHTML = forms[t.slug] || "<p>Form coming soon.</p>";
    const related = tools.filter((o) => o.category === t.category && o.slug !== t.slug).slice(0, 3);
    const relatedHTML = related
      .map((r) => `<a class="tool-card" href="${r.url}"><span class="tool-card__icon" aria-hidden="true">${icon(r.category)}</span><span><h3>${esc(r.title)}</h3><p>${esc(r.tagline)}</p></span></a>`)
      .join("\n        ");

    const faqHTML = t.faq
      .map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
      .join("\n        ");

    const isQr = t.slug === "qr-generator";
    const rightPanel = isQr
      ? `<div class="panel">
          <div class="ticket" style="background:var(--paper-raised);color:var(--ink);border:1px solid var(--line);text-align:center;">
            <p class="ticket__eyebrow" style="color:var(--marigold-deep)">Your QR code</p>
            <div data-qr-out style="display:flex;justify-content:center;margin-top:8px;">
              <p class="ticket__placeholder" style="color:var(--ink-soft)">Your QR code will appear here.</p>
            </div>
            <div class="ticket__actions" data-qr-actions style="display:none;justify-content:center;">
              <button type="button" class="btn btn--sm" data-qr-download>Download PNG</button>
            </div>
          </div>
        </div>`
      : `<div class="panel">
          <div class="ticket" data-ticket>
            <p class="ticket__eyebrow">Result</p>
            <p class="ticket__value">—</p>
            <p class="ticket__sub">Fill in the form to see your answer here.</p>
          </div>
        </div>`;

    const jsonLd = [
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: t.categoryTitle, url: `/categories/${t.category}/` },
        { name: t.title, url: t.url },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: t.title,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any (Web browser)",
        url: SITE.domain + t.url,
        description: t.metaDescription,
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: t.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ];

    const main = `
      ${breadcrumbHTML([{ name: "Home", url: "/" }, { name: t.categoryTitle, url: `/categories/${t.category}/` }, { name: t.title, url: t.url }])}
      <section class="container tool-hero">
        <p class="eyebrow">${esc(t.categoryTitle)}</p>
        <h1>${esc(t.title)}</h1>
        <p class="tool-hero__tagline">${esc(t.tagline)}</p>
      </section>

      <section class="container">
        <div class="tool-layout">
          <div class="panel">
            <form data-tool="${t.slug}" novalidate>
              ${formHTML}
              <button type="submit" class="btn btn--full">Calculate</button>
              <p class="error-text" data-error>Please check the values above.</p>
            </form>
          </div>
          ${rightPanel}
        </div>
      </section>

      ${renderAdSlot("Advertisement")}

      <section class="container prose">
        <h2>About this tool</h2>
        <p>${esc(t.intro)}</p>
        <h2>Frequently asked questions</h2>
        <div class="faq">
          ${faqHTML}
        </div>
      </section>

      ${related.length ? `<section class="container section--tight related-tools">
        <h2>Related tools</h2>
        <div class="tool-grid">
          ${relatedHTML}
        </div>
      </section>` : ""}

      ${renderAdSlot("Advertisement")}
    `;

    const extraScripts = isQr
      ? `<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" defer></script>\n  <script src="/assets/js/calculators.js" defer></script>`
      : `<script src="/assets/js/calculators.js" defer></script>`;

    write(
      `tools/${t.slug}/index.html`,
      page({
        title: `${t.title} — Free Online Tool | ${SITE.name}`,
        description: t.metaDescription,
        canonicalPath: t.url,
        jsonLd,
        keywords: t.keywords,
        main,
        extraScripts,
      })
    );
  });
}

// ---------------------------------------------------------------------
// Search page
function buildSearch() {
  const main = `
    ${breadcrumbHTML([{ name: "Home", url: "/" }, { name: "Search", url: "/search/" }])}
    <section class="container section--tight">
      <p class="eyebrow">Find a tool</p>
      <h1 data-search-heading>All tools</h1>
      <form data-search-page-form role="search" style="max-width:560px;margin:18px 0 8px;">
        <div class="search-box" data-search-root-noop>
          <span class="search-box__icon" aria-hidden="true">${icon("search")}</span>
          <label for="search-page" class="visually-hidden">Search tools</label>
          <input type="search" id="search-page" class="search-box__field" placeholder="Search all tools…" data-search-page-input autocomplete="off">
        </div>
      </form>
    </section>
    <section class="container section--tight">
      <div class="tool-grid" data-search-results></div>
    </section>
    ${renderAdSlot("Advertisement")}
  `;
  write(
    "search/index.html",
    page({
      title: `Search all tools — ${SITE.name}`,
      description: "Search every free calculator and tool on Aaj Kya? — money, dates, food, travel, shopping, converters and everyday tools.",
      canonicalPath: "/search/",
      main,
    })
  );
}

// ---------------------------------------------------------------------
// Static pages
function buildStatic() {
  const staticPages = [
    {
      slug: "about",
      title: "About",
      main: `
        <h1>About Aaj Kya?</h1>
        <p><strong>Aaj Kya?</strong> — Hindi for "what today?" — is a small collection of fast, free, everyday tools built for the maths that comes up constantly in Indian life: working out a discount, checking GST on a bill, calculating an EMI, or counting the days until something important.</p>
        <h2>Why we built this</h2>
        <p>Most calculator sites are slow, cluttered, or ask you to sign up for something that should take ten seconds. Aaj Kya? is built the other way round: open a tool, type your numbers, get your answer — on any phone, on a slow connection, without an app.</p>
        <h2>How it works</h2>
        <p>Every calculation runs directly in your browser. Nothing you type is sent to a server to be processed — the maths happens on your device, instantly, as you type.</p>
        <h2>More tools, regularly</h2>
        <p>Aaj Kya? is built so new tools can be added quickly and consistently. If there's a calculator or converter you wish existed, <a href="/contact/">let us know</a>.</p>`,
    },
    {
      slug: "contact",
      title: "Contact",
      main: `
        <h1>Contact us</h1>
        <p>Found a bug, have a tool suggestion, or want to talk about advertising on Aaj Kya?? We'd like to hear from you.</p>
        <h2>Email</h2>
        <p>Write to us at <a href="mailto:hello@aajkya.in">hello@aajkya.in</a> — replace this with your real support address before launch.</p>
        <h2>Tool requests</h2>
        <p>Tell us what calculator or converter you were searching for and couldn't find — that's usually exactly what we build next.</p>
        <h2>Advertising</h2>
        <p>For ad placements and sponsorships, email <a href="mailto:ads@aajkya.in">ads@aajkya.in</a>.</p>`,
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      main: `
        <h1>Privacy Policy</h1>
        <p>Last updated: ${SITE.buildDate}</p>
        <p>This Privacy Policy explains how Aaj Kya? ("we", "us", "the site") handles information when you use ${SITE.domain}.</p>
        <h2>Calculations happen in your browser</h2>
        <p>The numbers and dates you enter into our tools (discount amounts, dates of birth, loan figures, and so on) are processed entirely on your own device using JavaScript. We do not collect, store, or transmit the values you enter into a calculator.</p>
        <h2>Currency converter</h2>
        <p>The currency converter sends the amount and currency codes you select to a third-party exchange-rate API directly from your browser, in order to fetch a live rate. No account or personally identifying information is required for this request.</p>
        <h2>Cookies and advertising</h2>
        <p>Like most websites, we may use cookies and similar technologies for analytics and to serve ads, including through Google AdSense. Google and its partners may use cookies to serve ads based on your prior visits to this or other websites. You can opt out of personalised advertising by visiting Google's <a href="https://adssettings.google.com" rel="noopener nofollow">Ads Settings</a>.</p>
        <h2>Analytics</h2>
        <p>We may use standard web analytics tools to understand aggregate traffic patterns — such as which pages are visited and roughly where visitors are located — to improve the site. This data is not linked to your identity.</p>
        <h2>Third-party links</h2>
        <p>Our pages may link to third-party sites. We are not responsible for the privacy practices of those sites.</p>
        <h2>Children's privacy</h2>
        <p>Aaj Kya? is a general-audience utility site and does not knowingly collect personal information from children.</p>
        <h2>Changes to this policy</h2>
        <p>We may update this policy from time to time. Continued use of the site after changes means you accept the updated policy.</p>
        <h2>Contact</h2>
        <p>Questions about this policy can be sent to <a href="mailto:hello@aajkya.in">hello@aajkya.in</a>.</p>`,
    },
    {
      slug: "terms",
      title: "Terms of Use",
      main: `
        <h1>Terms of Use</h1>
        <p>Last updated: ${SITE.buildDate}</p>
        <p>By using ${SITE.domain}, you agree to the following terms.</p>
        <h2>No professional advice</h2>
        <p>The tools on Aaj Kya? (including calculators for GST, EMI, interest, BMI and similar) provide general estimates for informational purposes only. They are not financial, medical, tax, or legal advice. Always verify important figures with a qualified professional, your bank, or the relevant authority before making decisions.</p>
        <h2>Accuracy</h2>
        <p>We aim for accurate calculations using standard, publicly documented formulas, but we make no guarantee that results are error-free or suitable for any particular purpose. Use of any result is at your own risk.</p>
        <h2>Acceptable use</h2>
        <p>You agree not to misuse the site — including attempting to disrupt its operation, scrape it at disproportionate volume, or use it for any unlawful purpose.</p>
        <h2>Advertising</h2>
        <p>This site may display third-party advertisements, including through Google AdSense, to support free access to our tools.</p>
        <h2>Changes</h2>
        <p>We may update these terms or the site's tools at any time without prior notice.</p>
        <h2>Contact</h2>
        <p>Questions about these terms can be sent to <a href="mailto:hello@aajkya.in">hello@aajkya.in</a>.</p>`,
    },
  ];

  staticPages.forEach((p) => {
    write(
      `${p.slug}/index.html`,
      page({
        title: `${p.title} — ${SITE.name}`,
        description: `${p.title} for Aaj Kya? — free everyday calculators and tools for India.`,
        canonicalPath: `/${p.slug}/`,
        bodyClass: "static-page",
        main: `${breadcrumbHTML([{ name: "Home", url: "/" }, { name: p.title, url: `/${p.slug}/` }])}
        <section class="container section page-content prose">${p.main}</section>`,
      })
    );
  });
}

// ---------------------------------------------------------------------
// tools-data.js (browser-facing registry powering search)
function buildToolsDataJs() {
  const slim = tools.map((t) => ({
    slug: t.slug,
    title: t.title,
    tagline: t.tagline,
    category: t.category,
    categoryTitle: t.categoryTitle,
    keywords: t.keywords,
  }));
  write("assets/js/tools-data.js", `window.TOOLS = ${JSON.stringify(slim, null, 0)};\n`);
}

// ---------------------------------------------------------------------
// sitemap.xml + robots.txt
function buildSitemapAndRobots() {
  const urls = [
    "/",
    "/search/",
    "/about/",
    "/contact/",
    "/privacy-policy/",
    "/terms/",
    ...categories.map((c) => `/categories/${c.slug}/`),
    ...tools.map((t) => t.url),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${SITE.domain}${u}</loc>\n    <lastmod>${SITE.buildDate}</lastmod>\n    <changefreq>${u === "/" ? "daily" : "weekly"}</changefreq>\n    <priority>${u === "/" ? "1.0" : u.startsWith("/tools/") ? "0.8" : "0.6"}</priority>\n  </url>`).join("\n")}
</urlset>
`;
  write("sitemap.xml", xml);

  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE.domain}/sitemap.xml
`;
  write("robots.txt", robots);
}

function buildFavicon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#10151f"/><text x="32" y="42" font-family="Georgia, serif" font-size="30" font-weight="700" fill="#e8a33d" text-anchor="middle">आ</text></svg>`;
  write("assets/icons/favicon.svg", svg);
}

function build404() {
  const main = `
    <section class="container section text-center">
      <p class="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The page you're looking for may have moved. Try searching for the tool you need.</p>
      <div style="max-width:480px;margin:18px auto;">${renderSearchBox({ variant: "404", placeholder: "Search tools…" })}</div>
      <a class="btn" href="/">Back to homepage</a>
    </section>`;
  write(
    "404.html",
    page({
      title: `Page not found — ${SITE.name}`,
      description: "The page you're looking for doesn't exist.",
      canonicalPath: "/404.html",
      main,
    })
  );
}

// ---------------------------------------------------------------------
function run() {
  if (fs.existsSync(DIST)) {
    // wipe generated HTML/XML but keep hand-authored assets (css/js)
    const keep = new Set(["assets"]);
    for (const entry of fs.readdirSync(DIST)) {
      if (!keep.has(entry)) fs.rmSync(path.join(DIST, entry), { recursive: true, force: true });
    }
  }
  buildToolsDataJs();
  buildFavicon();
  buildHome();
  buildCategories();
  buildTools();
  buildSearch();
  buildStatic();
  buildSitemapAndRobots();
  build404();
  console.log(`Built ${tools.length} tool pages, ${categories.length} category pages + core pages into /dist`);
}

run();
