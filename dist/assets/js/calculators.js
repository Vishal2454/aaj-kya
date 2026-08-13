/* ==========================================================================
   Aaj Kya? — calculators.js
   Every tool's real calculation logic lives here, keyed by slug.
   To add a new tool: write CALC.<slug> = function(ctx) {...} and it will be
   auto-wired to any <form data-tool="<slug>"> on the page.
   ========================================================================== */
(function () {
  "use strict";

  var fmtINR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  var fmtNum = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
  var fmtInt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

  function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Builds the standard ticket markup: big value + eyebrow + optional rows. */
  function ticketHTML(opts) {
    var rows = (opts.rows || [])
      .map(function (r) { return '<div class="ticket__row"><span>' + esc(r[0]) + "</span><b>" + esc(r[1]) + "</b></div>"; })
      .join("");
    return (
      '<p class="ticket__eyebrow">' + esc(opts.eyebrow || "Result") + "</p>" +
      '<p class="ticket__value">' + opts.value + "</p>" +
      (opts.sub ? '<p class="ticket__sub">' + esc(opts.sub) + "</p>" : "") +
      (rows ? '<div class="ticket__rows">' + rows + "</div>" : "")
    );
  }

  // ---------------------------------------------------------------------
  var CALC = {};

  CALC["discount-calculator"] = function (ctx) {
    var price = num(ctx.get("price"));
    var discount = num(ctx.get("discount"));
    if (price <= 0) return ctx.empty("Enter the original price to see the sale price.");
    var saveAmt = (price * discount) / 100;
    var salePrice = price - saveAmt;
    ctx.setTicket(
      ticketHTML({
        eyebrow: "Sale price",
        value: fmtINR.format(salePrice),
        sub: "You save " + fmtINR.format(saveAmt) + " (" + fmtNum.format(discount) + "%)",
        rows: [
          ["Original price", fmtINR.format(price)],
          ["Discount", fmtNum.format(discount) + "%"],
          ["You save", fmtINR.format(saveAmt)],
        ],
      })
    );
  };

  CALC["gst-calculator"] = function (ctx) {
    var amount = num(ctx.get("amount"));
    var rate = num(ctx.get("rate"));
    var mode = ctx.get("mode") || "add";
    if (amount <= 0) return ctx.empty("Enter an amount to calculate GST.");

    var base, gstAmt, total;
    if (mode === "add") {
      base = amount;
      gstAmt = (base * rate) / 100;
      total = base + gstAmt;
    } else {
      total = amount;
      base = total / (1 + rate / 100);
      gstAmt = total - base;
    }
    var half = gstAmt / 2;
    ctx.setTicket(
      ticketHTML({
        eyebrow: mode === "add" ? "Total (incl. GST)" : "Base amount (excl. GST)",
        value: mode === "add" ? fmtINR.format(total) : fmtINR.format(base),
        sub: "GST @ " + fmtNum.format(rate) + "% = " + fmtINR.format(gstAmt),
        rows: [
          ["Base amount", fmtINR.format(base)],
          ["GST amount", fmtINR.format(gstAmt)],
          ["CGST (" + fmtNum.format(rate / 2) + "%)", fmtINR.format(half)],
          ["SGST (" + fmtNum.format(rate / 2) + "%)", fmtINR.format(half)],
          ["Total", fmtINR.format(base + gstAmt)],
        ],
      })
    );
  };

  CALC["emi-calculator"] = function (ctx) {
    var principal = num(ctx.get("principal"));
    var annualRate = num(ctx.get("rate"));
    var tenureVal = num(ctx.get("tenure"));
    var tenureUnit = ctx.get("tenureUnit") || "years";
    var months = tenureUnit === "years" ? tenureVal * 12 : tenureVal;
    if (principal <= 0 || months <= 0) return ctx.empty("Enter loan amount and tenure to see your EMI.");

    var r = annualRate / 12 / 100;
    var emi;
    if (r === 0) {
      emi = principal / months;
    } else {
      var f = Math.pow(1 + r, months);
      emi = (principal * r * f) / (f - 1);
    }
    var totalPayment = emi * months;
    var totalInterest = totalPayment - principal;

    ctx.setTicket(
      ticketHTML({
        eyebrow: "Monthly EMI",
        value: fmtINR.format(emi),
        sub: "over " + fmtInt.format(months) + " months",
        rows: [
          ["Principal", fmtINR.format(principal)],
          ["Total interest", fmtINR.format(totalInterest)],
          ["Total payment", fmtINR.format(totalPayment)],
        ],
      })
    );
  };

  CALC["simple-interest-calculator"] = function (ctx) {
    var p = num(ctx.get("principal"));
    var r = num(ctx.get("rate"));
    var t = num(ctx.get("time"));
    if (p <= 0 || t <= 0) return ctx.empty("Enter principal, rate and time to calculate interest.");
    var interest = (p * r * t) / 100;
    var total = p + interest;
    ctx.setTicket(
      ticketHTML({
        eyebrow: "Maturity amount",
        value: fmtINR.format(total),
        sub: "Interest earned: " + fmtINR.format(interest),
        rows: [
          ["Principal", fmtINR.format(p)],
          ["Rate", fmtNum.format(r) + "% / year"],
          ["Time", fmtNum.format(t) + " year(s)"],
          ["Interest", fmtINR.format(interest)],
        ],
      })
    );
  };

  CALC["compound-interest-calculator"] = function (ctx) {
    var p = num(ctx.get("principal"));
    var r = num(ctx.get("rate")) / 100;
    var t = num(ctx.get("time"));
    var n = num(ctx.get("frequency")) || 1;
    if (p <= 0 || t <= 0) return ctx.empty("Enter principal, rate and time to calculate compound interest.");
    var amount = p * Math.pow(1 + r / n, n * t);
    var interest = amount - p;
    ctx.setTicket(
      ticketHTML({
        eyebrow: "Final amount",
        value: fmtINR.format(amount),
        sub: "Interest earned: " + fmtINR.format(interest),
        rows: [
          ["Principal", fmtINR.format(p)],
          ["Rate", fmtNum.format(r * 100) + "% / year"],
          ["Compounding", fmtInt.format(n) + "x / year"],
          ["Interest earned", fmtINR.format(interest)],
        ],
      })
    );
  };

  CALC["age-calculator"] = function (ctx) {
    var dobStr = ctx.get("dob");
    var asOfStr = ctx.get("asof");
    if (!dobStr) return ctx.empty("Enter a date of birth to calculate age.");
    var dob = new Date(dobStr + "T00:00:00");
    var asOf = asOfStr ? new Date(asOfStr + "T00:00:00") : new Date(new Date().toDateString());
    if (dob > asOf) return ctx.empty("Date of birth is after the 'as of' date — check the dates.");

    var years = asOf.getFullYear() - dob.getFullYear();
    var months = asOf.getMonth() - dob.getMonth();
    var days = asOf.getDate() - dob.getDate();
    if (days < 0) {
      months -= 1;
      var prevMonth = new Date(asOf.getFullYear(), asOf.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    var totalDays = Math.round((asOf - dob) / 86400000);

    var nextBday = new Date(asOf.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBday < asOf) nextBday.setFullYear(asOf.getFullYear() + 1);
    var daysToNext = Math.round((nextBday - asOf) / 86400000);

    ctx.setTicket(
      ticketHTML({
        eyebrow: "Exact age",
        value: years + "y " + months + "m " + days + "d",
        sub: fmtInt.format(totalDays) + " days lived",
        rows: [
          ["Total days lived", fmtInt.format(totalDays)],
          ["Next birthday in", daysToNext === 0 ? "Today 🎉" : fmtInt.format(daysToNext) + " days"],
        ],
      })
    );
  };

  CALC["date-difference"] = function (ctx) {
    var startStr = ctx.get("start");
    var endStr = ctx.get("end");
    if (!startStr || !endStr) return ctx.empty("Pick both dates to see the difference.");
    var start = new Date(startStr + "T00:00:00");
    var end = new Date(endStr + "T00:00:00");
    var a = start < end ? start : end;
    var b = start < end ? end : start;

    var totalDays = Math.round((b - a) / 86400000);
    var years = b.getFullYear() - a.getFullYear();
    var months = b.getMonth() - a.getMonth();
    var days = b.getDate() - a.getDate();
    if (days < 0) {
      months -= 1;
      days += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    ctx.setTicket(
      ticketHTML({
        eyebrow: "Difference",
        value: fmtInt.format(totalDays) + " days",
        sub: years + " years, " + months + " months, " + days + " days",
        rows: [
          ["Total days", fmtInt.format(totalDays)],
          ["Total weeks", fmtNum.format(totalDays / 7)],
          ["Years / Months / Days", years + "y " + months + "m " + days + "d"],
        ],
      })
    );
  };

  CALC["days-until"] = function (ctx) {
    var targetStr = ctx.get("target");
    if (!targetStr) return ctx.empty("Pick a date to start the countdown.");
    var target = new Date(targetStr + "T00:00:00");
    var today = new Date(new Date().toDateString());
    var diffDays = Math.round((target - today) / 86400000);

    var isPast = diffDays < 0;
    var abs = Math.abs(diffDays);
    ctx.setTicket(
      ticketHTML({
        eyebrow: isPast ? "Days since" : "Days until",
        value: fmtInt.format(abs) + (diffDays === 0 ? "" : " days"),
        sub: diffDays === 0 ? "That's today!" : target.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
        rows: [
          ["Weeks", fmtNum.format(abs / 7)],
          ["Months (approx.)", fmtNum.format(abs / 30.44)],
        ],
      })
    );
  };

  CALC["percentage-calculator"] = function (ctx) {
    var mode = ctx.get("mode") || "of";
    var x = num(ctx.get("x"));
    var y = num(ctx.get("y"));

    if (mode === "of") {
      if (!ctx.get("x") || !ctx.get("y")) return ctx.empty("Enter both values.");
      var result = (x * y) / 100;
      ctx.setTicket(ticketHTML({ eyebrow: x + "% of " + y, value: fmtNum.format(result) }));
    } else if (mode === "isWhatPercent") {
      if (y === 0) return ctx.empty("Enter both values (second value can't be 0).");
      var pct = (x / y) * 100;
      ctx.setTicket(ticketHTML({ eyebrow: x + " is what % of " + y, value: fmtNum.format(pct) + "%" }));
    } else {
      if (x === 0) return ctx.empty("Enter both values (first value can't be 0).");
      var change = ((y - x) / x) * 100;
      ctx.setTicket(
        ticketHTML({
          eyebrow: change >= 0 ? "Increase" : "Decrease",
          value: (change >= 0 ? "+" : "") + fmtNum.format(change) + "%",
          sub: "from " + x + " to " + y,
        })
      );
    }
  };

  CALC["bmi-calculator"] = function (ctx) {
    var unit = ctx.get("unit") || "metric";
    var weight, heightM;
    if (unit === "metric") {
      weight = num(ctx.get("weightKg"));
      heightM = num(ctx.get("heightCm")) / 100;
    } else {
      weight = num(ctx.get("weightLb")) * 0.453592;
      var ft = num(ctx.get("heightFt"));
      var inch = num(ctx.get("heightIn"));
      heightM = (ft * 12 + inch) * 0.0254;
    }
    if (weight <= 0 || heightM <= 0) return ctx.empty("Enter height and weight to calculate BMI.");

    var bmi = weight / (heightM * heightM);
    var category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal weight" : bmi < 30 ? "Overweight" : "Obese";

    ctx.setTicket(
      ticketHTML({
        eyebrow: "Your BMI",
        value: fmtNum.format(bmi),
        sub: category,
        rows: [
          ["Healthy BMI range", "18.5 – 24.9"],
          ["Healthy weight for your height", fmtNum.format(18.5 * heightM * heightM) + " – " + fmtNum.format(24.9 * heightM * heightM) + " kg"],
        ],
      })
    );
  };

  CALC["fuel-cost-calculator"] = function (ctx) {
    var distance = num(ctx.get("distance"));
    var mileage = num(ctx.get("mileage"));
    var price = num(ctx.get("price"));
    if (distance <= 0 || mileage <= 0 || price <= 0) return ctx.empty("Enter distance, mileage and fuel price.");

    var litres = distance / mileage;
    var cost = litres * price;
    ctx.setTicket(
      ticketHTML({
        eyebrow: "Estimated fuel cost",
        value: fmtINR.format(cost),
        sub: fmtNum.format(litres) + " litres for " + fmtNum.format(distance) + " km",
        rows: [
          ["Fuel needed", fmtNum.format(litres) + " L"],
          ["Cost per km", fmtINR.format(cost / distance)],
        ],
      })
    );
  };

  CALC["unit-converter"] = function (ctx) {
    var category = ctx.get("category") || "length";
    var from = ctx.get("from");
    var to = ctx.get("to");
    var value = num(ctx.get("value"));
    if (!from || !to) return ctx.empty("Choose units to convert.");

    var UNITS = {
      length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254 },
      weight: { kg: 1, g: 0.001, mg: 0.000001, tonne: 1000, pound: 0.453592, ounce: 0.0283495 },
      volume: { litre: 1, ml: 0.001, gallon: 3.78541, cup: 0.24, tablespoon: 0.0147868, teaspoon: 0.00492892 },
    };

    var result;
    if (category === "temperature") {
      result = convertTemp(value, from, to);
    } else {
      var table = UNITS[category];
      if (!table || !(from in table) || !(to in table)) return ctx.empty("Choose valid units.");
      result = (value * table[from]) / table[to];
    }

    ctx.setTicket(
      ticketHTML({
        eyebrow: fmtNum.format(value) + " " + unitLabel(from),
        value: fmtNum.format(result) + " " + unitLabel(to),
        sub: "1 " + unitLabel(from) + " = " + fmtNum.format(category === "temperature" ? convertTemp(1, from, to) : table[from] / table[to]) + " " + unitLabel(to),
      })
    );

    function convertTemp(v, f, t) {
      var celsius = f === "celsius" ? v : f === "fahrenheit" ? ((v - 32) * 5) / 9 : v - 273.15;
      if (t === "celsius") return celsius;
      if (t === "fahrenheit") return (celsius * 9) / 5 + 32;
      return celsius + 273.15;
    }
    function unitLabel(u) {
      var labels = { m: "m", km: "km", cm: "cm", mm: "mm", mile: "mi", yard: "yd", foot: "ft", inch: "in", kg: "kg", g: "g", mg: "mg", tonne: "t", pound: "lb", ounce: "oz", litre: "L", ml: "mL", gallon: "gal", cup: "cup", tablespoon: "tbsp", teaspoon: "tsp", celsius: "°C", fahrenheit: "°F", kelvin: "K" };
      return labels[u] || u;
    }
  };

  CALC["tip-calculator"] = function (ctx) {
    var bill = num(ctx.get("bill"));
    var tipPct = num(ctx.get("tipPct"));
    var people = Math.max(1, num(ctx.get("people")) || 1);
    if (bill <= 0) return ctx.empty("Enter the bill amount.");

    var tip = (bill * tipPct) / 100;
    var total = bill + tip;
    ctx.setTicket(
      ticketHTML({
        eyebrow: "Total incl. tip",
        value: fmtINR.format(total),
        sub: "Tip: " + fmtINR.format(tip) + " (" + fmtNum.format(tipPct) + "%)",
        rows: [
          ["Per person (total)", fmtINR.format(total / people)],
          ["Per person (tip only)", fmtINR.format(tip / people)],
        ],
      })
    );
  };

  CALC["bill-split-calculator"] = function (ctx) {
    var bill = num(ctx.get("bill"));
    var taxPct = num(ctx.get("taxPct"));
    var tipPct = num(ctx.get("tipPct"));
    var people = Math.max(1, num(ctx.get("people")) || 1);
    if (bill <= 0) return ctx.empty("Enter the bill amount.");

    var tax = (bill * taxPct) / 100;
    var tip = (bill * tipPct) / 100;
    var grand = bill + tax + tip;
    ctx.setTicket(
      ticketHTML({
        eyebrow: "Each person pays",
        value: fmtINR.format(grand / people),
        sub: fmtInt.format(people) + " people splitting " + fmtINR.format(grand),
        rows: [
          ["Subtotal", fmtINR.format(bill)],
          ["Tax", fmtINR.format(tax)],
          ["Tip", fmtINR.format(tip)],
          ["Grand total", fmtINR.format(grand)],
        ],
      })
    );
  };

  // ---------------------------------------------------------------------
  // Currency converter — live rates via a free, keyless exchange-rate API.
  CALC["currency-converter"] = function (ctx, meta) {
    var amount = num(ctx.get("amount"));
    var from = (ctx.get("from") || "USD").toUpperCase();
    var to = (ctx.get("to") || "INR").toUpperCase();
    if (amount <= 0) return ctx.empty("Enter an amount to convert.");

    if (from === to) {
      ctx.setTicket(ticketHTML({ eyebrow: "Converted amount", value: fmtNum.format(amount) + " " + to, sub: "Same currency" }));
      return;
    }

    var cacheKey = "rates:" + from;
    var cached = meta.rateCache[cacheKey];
    var now = Date.now();

    if (cached && now - cached.time < 10 * 60 * 1000) {
      renderWithRates(cached.rates);
      return;
    }

    ctx.setTicket(ticketHTML({ eyebrow: "Fetching live rate…", value: "…", sub: "Getting the latest exchange rate" }));

    fetch("https://open.er-api.com/v6/latest/" + from)
      .then(function (r) {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.json();
      })
      .then(function (data) {
        if (!data || data.result !== "success" || !data.rates) throw new Error("Bad response");
        meta.rateCache[cacheKey] = { time: now, rates: data.rates };
        renderWithRates(data.rates);
      })
      .catch(function () {
        ctx.setTicket(
          ticketHTML({
            eyebrow: "Couldn't fetch live rate",
            value: "—",
            sub: "Check your connection and try again in a moment.",
          })
        );
      });

    function renderWithRates(rates) {
      var rate = rates[to];
      if (!rate) {
        ctx.setTicket(ticketHTML({ eyebrow: "Unsupported currency", value: "—", sub: to + " isn't available right now." }));
        return;
      }
      var converted = amount * rate;
      ctx.setTicket(
        ticketHTML({
          eyebrow: fmtNum.format(amount) + " " + from,
          value: fmtNum.format(converted) + " " + to,
          sub: "1 " + from + " = " + fmtNum.format(rate) + " " + to,
        })
      );
    }
  };

  // ---------------------------------------------------------------------
  // QR generator — uses the qrcode.js library (loaded on this page only).
  CALC["qr-generator"] = function (ctx, meta, form) {
    var text = ctx.get("text");
    var size = parseInt(ctx.get("size"), 10) || 260;
    var layout = form.closest(".tool-layout") || document;
    var out = layout.querySelector("[data-qr-out]");
    var actions = layout.querySelector("[data-qr-actions]");
    if (!out) return;

    if (!text || !text.trim()) {
      out.innerHTML = '<p class="ticket__placeholder">Your QR code will appear here.</p>';
      if (actions) actions.style.display = "none";
      return;
    }
    if (typeof QRCode === "undefined") {
      out.innerHTML = '<p class="ticket__placeholder">Loading QR engine…</p>';
      return;
    }

    out.innerHTML = "";
    /* eslint-disable no-new */
    new QRCode(out, {
      text: text,
      width: size,
      height: size,
      correctLevel: QRCode.CorrectLevel.M,
    });

    if (actions) {
      actions.style.display = "flex";
      var downloadBtn = actions.querySelector("[data-qr-download]");
      if (downloadBtn) {
        downloadBtn.onclick = function () {
          setTimeout(function () {
            var img = out.querySelector("img");
            var canvas = out.querySelector("canvas");
            var url = img && img.src ? img.src : canvas ? canvas.toDataURL("image/png") : null;
            if (!url) return;
            var a = document.createElement("a");
            a.href = url;
            a.download = "aaj-kya-qr-code.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
          }, 50);
        };
      }
    }
  };

  // ---------------------------------------------------------------------
  // Populate dependent <select> elements before the first calculation runs.

  function populateCurrencySelects() {
    var form = document.querySelector('form[data-tool="currency-converter"]');
    if (!form) return;
    var currencies = [
      ["INR", "INR — Indian Rupee"], ["USD", "USD — US Dollar"], ["EUR", "EUR — Euro"],
      ["GBP", "GBP — British Pound"], ["AED", "AED — UAE Dirham"], ["AUD", "AUD — Australian Dollar"],
      ["CAD", "CAD — Canadian Dollar"], ["SGD", "SGD — Singapore Dollar"], ["JPY", "JPY — Japanese Yen"],
      ["CNY", "CNY — Chinese Yuan"], ["SAR", "SAR — Saudi Riyal"], ["CHF", "CHF — Swiss Franc"],
    ];
    var fromSel = form.querySelector('select[name="from"]');
    var toSel = form.querySelector('select[name="to"]');
    if (!fromSel || !toSel || fromSel.options.length) return;
    currencies.forEach(function (c) {
      fromSel.add(new Option(c[1], c[0]));
      toSel.add(new Option(c[1], c[0]));
    });
    fromSel.value = "USD";
    toSel.value = "INR";
  }

  function populateUnitSelects() {
    var form = document.querySelector('form[data-tool="unit-converter"]');
    if (!form) return;
    var categorySel = form.querySelector("[data-unit-category]");
    var fromSel = form.querySelector("[data-unit-from]");
    var toSel = form.querySelector("[data-unit-to]");
    if (!categorySel || !fromSel || !toSel) return;

    var OPTIONS = {
      length: [["m", "Metres"], ["km", "Kilometres"], ["cm", "Centimetres"], ["mm", "Millimetres"], ["mile", "Miles"], ["yard", "Yards"], ["foot", "Feet"], ["inch", "Inches"]],
      weight: [["kg", "Kilograms"], ["g", "Grams"], ["mg", "Milligrams"], ["tonne", "Tonnes"], ["pound", "Pounds"], ["ounce", "Ounces"]],
      volume: [["litre", "Litres"], ["ml", "Millilitres"], ["gallon", "Gallons"], ["cup", "Cups"], ["tablespoon", "Tablespoons"], ["teaspoon", "Teaspoons"]],
      temperature: [["celsius", "Celsius"], ["fahrenheit", "Fahrenheit"], ["kelvin", "Kelvin"]],
    };
    var DEFAULTS = {
      length: ["km", "mile"],
      weight: ["kg", "pound"],
      volume: ["litre", "gallon"],
      temperature: ["celsius", "fahrenheit"],
    };

    function fill(category) {
      fromSel.innerHTML = "";
      toSel.innerHTML = "";
      OPTIONS[category].forEach(function (o) {
        fromSel.add(new Option(o[1], o[0]));
        toSel.add(new Option(o[1], o[0]));
      });
      fromSel.value = DEFAULTS[category][0];
      toSel.value = DEFAULTS[category][1];
    }

    fill(categorySel.value || "length");
    categorySel.addEventListener("change", function () {
      fill(categorySel.value);
      form.dispatchEvent(new Event("change"));
    });
  }

  populateCurrencySelects();
  populateUnitSelects();

  // ---------------------------------------------------------------------
  // Generic runtime: wires every <form data-tool="slug"> to CALC[slug].
  var meta = { rateCache: {} };

  function wireForm(form) {
    var slug = form.getAttribute("data-tool");
    var fn = CALC[slug];
    if (!fn) return;

    var panel = form.closest(".tool-layout") || document;
    var ticket = panel.querySelector("[data-ticket]");
    var errorEl = panel.querySelector("[data-error]");

    function get(name) {
      var el = form.querySelector('[name="' + name + '"]:checked, [name="' + name + '"]');
      if (!el) return "";
      if (el.type === "radio") {
        var checked = form.querySelector('[name="' + name + '"]:checked');
        return checked ? checked.value : "";
      }
      return el.value;
    }

    var ctx = {
      get: get,
      setTicket: function (html) {
        if (errorEl) errorEl.classList.remove("is-visible");
        if (ticket) ticket.innerHTML = html;
      },
      empty: function (msg) {
        if (ticket) {
          ticket.innerHTML = ticketHTML({ eyebrow: "Result", value: "—", sub: msg });
        }
      },
    };

    function run() {
      try {
        fn(ctx, meta, form);
      } catch (e) {
        if (ticket) ticket.innerHTML = ticketHTML({ eyebrow: "Something's off", value: "—", sub: "Check the values and try again." });
      }
    }

    var debounceTimer;
    form.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(run, 120);
    });
    form.addEventListener("change", run);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      run();
    });

    run();
  }

  document.querySelectorAll("form[data-tool]").forEach(wireForm);
})();
