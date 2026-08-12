(function () {
  "use strict";

  // ---- Mobile nav toggle ----
  var navToggle = document.querySelector("[data-nav-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // ---- Sensible default values for date inputs (data-default-* attrs) ----
  function isoDate(d) { return d.toISOString().slice(0, 10); }
  document.querySelectorAll("[data-default-today]").forEach(function (el) {
    if (!el.value) el.value = isoDate(new Date());
  });
  document.querySelectorAll("[data-default-past-days]").forEach(function (el) {
    if (el.value) return;
    var d = new Date();
    d.setDate(d.getDate() - parseInt(el.getAttribute("data-default-past-days"), 10));
    el.value = isoDate(d);
  });
  document.querySelectorAll("[data-default-future-days]").forEach(function (el) {
    if (el.value) return;
    var d = new Date();
    d.setDate(d.getDate() + parseInt(el.getAttribute("data-default-future-days"), 10));
    el.value = isoDate(d);
  });
  document.querySelectorAll("[data-default-past-years]").forEach(function (el) {
    if (el.value) return;
    var d = new Date();
    d.setFullYear(d.getFullYear() - parseInt(el.getAttribute("data-default-past-years"), 10));
    el.value = isoDate(d);
  });

  // ---- Footer year ----
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---- Radio pill groups (visual state only, real <input> stays source of truth) ----
  document.querySelectorAll(".radio-row").forEach(function (row) {
    var pills = row.querySelectorAll(".radio-pill");
    function refresh() {
      pills.forEach(function (p) {
        var input = p.querySelector("input");
        p.classList.toggle("is-active", !!(input && input.checked));
      });
    }
    pills.forEach(function (p) {
      var input = p.querySelector("input");
      if (input) input.addEventListener("change", refresh);
    });
    refresh();
  });

  // ---- Live search (homepage hero + header search + /search/ page) ----
  // window.TOOLS is loaded from /assets/js/tools-data.js on every page.
  function initSearch(root) {
    var input = root.querySelector(".search-box__field");
    var suggestBox = root.querySelector(".search-suggest");
    if (!input || !suggestBox || !window.TOOLS) return;

    var activeIndex = -1;

    function render(query) {
      var q = query.trim().toLowerCase();
      if (!q) {
        suggestBox.classList.remove("is-open");
        suggestBox.innerHTML = "";
        return;
      }
      var matches = window.TOOLS.filter(function (t) {
        return (
          t.title.toLowerCase().indexOf(q) !== -1 ||
          t.tagline.toLowerCase().indexOf(q) !== -1 ||
          (t.keywords || []).some(function (k) { return k.toLowerCase().indexOf(q) !== -1; })
        );
      }).slice(0, 7);

      activeIndex = -1;

      if (!matches.length) {
        suggestBox.innerHTML = '<div class="search-suggest__empty">No tool found for "' + escapeHtml(query) + '" yet. <a href="/search/?q=' + encodeURIComponent(query) + '" style="color:inherit;text-decoration:underline;">See all tools →</a></div>';
        suggestBox.classList.add("is-open");
        return;
      }

      suggestBox.innerHTML = matches
        .map(function (t) {
          return (
            '<a href="/tools/' + t.slug + '/">' +
            "<strong>" + escapeHtml(t.title) + "</strong>" +
            "<small>" + escapeHtml(t.tagline) + "</small>" +
            "</a>"
          );
        })
        .join("");
      suggestBox.classList.add("is-open");
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }

    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("focus", function () { if (input.value.trim()) render(input.value); });

    input.addEventListener("keydown", function (e) {
      var items = suggestBox.querySelectorAll("a");
      if (!items.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        updateActive(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        updateActive(items);
      } else if (e.key === "Enter") {
        if (activeIndex >= 0 && items[activeIndex]) {
          e.preventDefault();
          window.location.href = items[activeIndex].getAttribute("href");
        } else {
          window.location.href = "/search/?q=" + encodeURIComponent(input.value.trim());
        }
      } else if (e.key === "Escape") {
        suggestBox.classList.remove("is-open");
      }
    });

    function updateActive(items) {
      items.forEach(function (a, i) { a.classList.toggle("is-active", i === activeIndex); });
      if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: "nearest" });
    }

    document.addEventListener("click", function (e) {
      if (!root.contains(e.target)) suggestBox.classList.remove("is-open");
    });
  }

  document.querySelectorAll("[data-search-root]").forEach(initSearch);

  // ---- Standalone search results page ----
  var resultsRoot = document.querySelector("[data-search-results]");
  if (resultsRoot && window.TOOLS) {
    var params = new URLSearchParams(window.location.search);
    var q = (params.get("q") || "").trim();
    var inputEl = document.querySelector("[data-search-page-input]");
    if (inputEl) inputEl.value = q;

    function renderResults(query) {
      var qq = query.trim().toLowerCase();
      var list = !qq
        ? window.TOOLS
        : window.TOOLS.filter(function (t) {
            return (
              t.title.toLowerCase().indexOf(qq) !== -1 ||
              t.tagline.toLowerCase().indexOf(qq) !== -1 ||
              (t.keywords || []).some(function (k) { return k.toLowerCase().indexOf(qq) !== -1; })
            );
          });

      resultsRoot.innerHTML = list.length
        ? list
            .map(function (t) {
              return (
                '<a class="tool-card" href="/tools/' + t.slug + '/">' +
                '<span class="tool-card__icon" aria-hidden="true">' + toolIcon(t.category) + "</span>" +
                "<span><span class=\"tool-card__cat\">" + t.categoryTitle + "</span><h3>" + t.title + "</h3><p>" + t.tagline + "</p></span>" +
                "</a>"
              );
            })
            .join("")
        : '<p>No tools matched "' + query + '" yet. Try a different word, or browse all tools below.</p>';

      var heading = document.querySelector("[data-search-heading]");
      if (heading) {
        heading.textContent = qq ? 'Results for "' + query + '"' : "All tools";
      }
    }

    renderResults(q);

    var form = document.querySelector("[data-search-page-form]");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var val = inputEl.value.trim();
        var url = new URL(window.location.href);
        url.searchParams.set("q", val);
        window.history.replaceState({}, "", url);
        renderResults(val);
      });
    }
  }

  function toolIcon() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-3.6-3.6"></path></svg>';
  }
})();
