// Raw form markup per tool slug. Kept separate from tools.js so the SEO
// registry stays clean data while this stays presentation.
module.exports = {
  "discount-calculator": `
    <div class="field">
      <label for="price">Original price (₹)</label>
      <input type="number" inputmode="decimal" id="price" name="price" min="0" step="0.01" value="1999" required>
    </div>
    <div class="field">
      <label for="discount">Discount (%)</label>
      <input type="number" inputmode="decimal" id="discount" name="discount" min="0" max="100" step="0.5" value="30" required>
    </div>`,

  "gst-calculator": `
    <div class="field">
      <label for="amount">Amount (₹)</label>
      <input type="number" inputmode="decimal" id="amount" name="amount" min="0" step="0.01" value="10000" required>
    </div>
    <div class="field">
      <label for="rate">GST rate</label>
      <select id="rate" name="rate">
        <option value="5">5%</option>
        <option value="12">12%</option>
        <option value="18" selected>18%</option>
        <option value="28">28%</option>
      </select>
    </div>
    <div class="field">
      <label>GST is</label>
      <div class="radio-row">
        <label class="radio-pill is-active"><input type="radio" name="mode" value="add" checked> Add to amount</label>
        <label class="radio-pill"><input type="radio" name="mode" value="remove"> Already included</label>
      </div>
    </div>`,

  "emi-calculator": `
    <div class="field">
      <label for="principal">Loan amount (₹)</label>
      <input type="number" inputmode="decimal" id="principal" name="principal" min="0" step="1000" value="1000000" required>
    </div>
    <div class="field">
      <label for="rate">Interest rate (% per year)</label>
      <input type="number" inputmode="decimal" id="rate" name="rate" min="0" step="0.05" value="8.5" required>
    </div>
    <div class="field field-row">
      <div>
        <label for="tenure">Tenure</label>
        <input type="number" inputmode="decimal" id="tenure" name="tenure" min="1" step="1" value="20" required>
      </div>
      <div>
        <label for="tenureUnit">&nbsp;</label>
        <select id="tenureUnit" name="tenureUnit">
          <option value="years" selected>Years</option>
          <option value="months">Months</option>
        </select>
      </div>
    </div>`,

  "simple-interest-calculator": `
    <div class="field">
      <label for="principal">Principal (₹)</label>
      <input type="number" inputmode="decimal" id="principal" name="principal" min="0" step="100" value="50000" required>
    </div>
    <div class="field">
      <label for="rate">Rate (% per year)</label>
      <input type="number" inputmode="decimal" id="rate" name="rate" min="0" step="0.1" value="7" required>
    </div>
    <div class="field">
      <label for="time">Time (years)</label>
      <input type="number" inputmode="decimal" id="time" name="time" min="0" step="0.5" value="3" required>
    </div>`,

  "compound-interest-calculator": `
    <div class="field">
      <label for="principal">Principal (₹)</label>
      <input type="number" inputmode="decimal" id="principal" name="principal" min="0" step="100" value="100000" required>
    </div>
    <div class="field">
      <label for="rate">Rate (% per year)</label>
      <input type="number" inputmode="decimal" id="rate" name="rate" min="0" step="0.1" value="7.5" required>
    </div>
    <div class="field field-row">
      <div>
        <label for="time">Time (years)</label>
        <input type="number" inputmode="decimal" id="time" name="time" min="0" step="0.5" value="5" required>
      </div>
      <div>
        <label for="frequency">Compounding</label>
        <select id="frequency" name="frequency">
          <option value="1">Yearly</option>
          <option value="2">Half-yearly</option>
          <option value="4" selected>Quarterly</option>
          <option value="12">Monthly</option>
        </select>
      </div>
    </div>`,

  "age-calculator": `
    <div class="field">
      <label for="dob">Date of birth</label>
      <input type="date" id="dob" name="dob" required data-default-past-years="25">
    </div>
    <div class="field">
      <label for="asof">Calculate age as of</label>
      <input type="date" id="asof" name="asof" data-default-today>
      <p class="hint">Defaults to today. Change it to check age eligibility for a specific date.</p>
    </div>`,

  "date-difference": `
    <div class="field">
      <label for="start">Start date</label>
      <input type="date" id="start" name="start" required data-default-past-days="30">
    </div>
    <div class="field">
      <label for="end">End date</label>
      <input type="date" id="end" name="end" required data-default-today>
    </div>`,

  "days-until": `
    <div class="field">
      <label for="target">Target date</label>
      <input type="date" id="target" name="target" required data-default-future-days="60">
    </div>`,

  "percentage-calculator": `
    <div class="field">
      <label>What do you want to find?</label>
      <div class="radio-row">
        <label class="radio-pill is-active"><input type="radio" name="mode" value="of" checked> X% of Y</label>
        <label class="radio-pill"><input type="radio" name="mode" value="isWhatPercent"> X is what % of Y</label>
        <label class="radio-pill"><input type="radio" name="mode" value="change"> % change (X → Y)</label>
      </div>
    </div>
    <div class="field field-row">
      <div>
        <label for="x">X</label>
        <input type="number" inputmode="decimal" id="x" name="x" step="any" value="20" required>
      </div>
      <div>
        <label for="y">Y</label>
        <input type="number" inputmode="decimal" id="y" name="y" step="any" value="250" required>
      </div>
    </div>`,

  "bmi-calculator": `
    <div class="field">
      <label>Units</label>
      <div class="radio-row">
        <label class="radio-pill is-active"><input type="radio" name="unit" value="metric" checked> Metric (cm/kg)</label>
        <label class="radio-pill"><input type="radio" name="unit" value="imperial"> Feet-inches / lb</label>
      </div>
    </div>
    <div class="field field-row">
      <div>
        <label for="heightCm">Height (cm)</label>
        <input type="number" inputmode="decimal" id="heightCm" name="heightCm" min="0" step="0.5" value="170">
      </div>
      <div>
        <label for="weightKg">Weight (kg)</label>
        <input type="number" inputmode="decimal" id="weightKg" name="weightKg" min="0" step="0.1" value="65">
      </div>
    </div>
    <div class="field field-row">
      <div>
        <label for="heightFt">Height (ft)</label>
        <input type="number" inputmode="decimal" id="heightFt" name="heightFt" min="0" step="1" value="5">
      </div>
      <div>
        <label for="heightIn">Height (in)</label>
        <input type="number" inputmode="decimal" id="heightIn" name="heightIn" min="0" step="1" value="7">
      </div>
    </div>
    <div class="field">
      <label for="weightLb">Weight (lb)</label>
      <input type="number" inputmode="decimal" id="weightLb" name="weightLb" min="0" step="1" value="143">
    </div>`,

  "fuel-cost-calculator": `
    <div class="field">
      <label for="distance">Trip distance (km)</label>
      <input type="number" inputmode="decimal" id="distance" name="distance" min="0" step="1" value="250" required>
    </div>
    <div class="field">
      <label for="mileage">Vehicle mileage (km/litre)</label>
      <input type="number" inputmode="decimal" id="mileage" name="mileage" min="0.1" step="0.1" value="18" required>
    </div>
    <div class="field">
      <label for="price">Fuel price (₹/litre)</label>
      <input type="number" inputmode="decimal" id="price" name="price" min="0" step="0.1" value="103" required>
    </div>`,

  "currency-converter": `
    <div class="field">
      <label for="amount">Amount</label>
      <input type="number" inputmode="decimal" id="amount" name="amount" min="0" step="1" value="100" required>
    </div>
    <div class="field field-row">
      <div>
        <label for="from">From</label>
        <select id="from" name="from"></select>
      </div>
      <div>
        <label for="to">To</label>
        <select id="to" name="to"></select>
      </div>
    </div>
    <p class="hint">Rates are fetched live in your browser from a public exchange-rate API when you use the tool.</p>`,

  "unit-converter": `
    <div class="field">
      <label for="category">Category</label>
      <select id="category" name="category" data-unit-category>
        <option value="length" selected>Length</option>
        <option value="weight">Weight</option>
        <option value="volume">Volume</option>
        <option value="temperature">Temperature</option>
      </select>
    </div>
    <div class="field">
      <label for="value">Value</label>
      <input type="number" inputmode="decimal" id="value" name="value" step="any" value="10" required>
    </div>
    <div class="field field-row">
      <div>
        <label for="from">From</label>
        <select id="from" name="from" data-unit-from></select>
      </div>
      <div>
        <label for="to">To</label>
        <select id="to" name="to" data-unit-to></select>
      </div>
    </div>`,

  "qr-generator": `
    <div class="field">
      <label for="text">Text, link, phone number or message</label>
      <input type="text" id="text" name="text" value="https://" placeholder="https://example.com or any text" required>
    </div>
    <div class="field">
      <label for="size">Size</label>
      <select id="size" name="size">
        <option value="200">Small (200px)</option>
        <option value="260" selected>Medium (260px)</option>
        <option value="360">Large (360px)</option>
      </select>
    </div>`,

  "tip-calculator": `
    <div class="field">
      <label for="bill">Bill amount (₹)</label>
      <input type="number" inputmode="decimal" id="bill" name="bill" min="0" step="1" value="1200" required>
    </div>
    <div class="field">
      <label for="tipPct">Tip (%)</label>
      <input type="number" inputmode="decimal" id="tipPct" name="tipPct" min="0" max="100" step="1" value="10" required>
    </div>
    <div class="field">
      <label for="people">Number of people</label>
      <input type="number" inputmode="numeric" id="people" name="people" min="1" step="1" value="1" required>
    </div>`,

  "bill-split-calculator": `
    <div class="field">
      <label for="bill">Bill amount (₹)</label>
      <input type="number" inputmode="decimal" id="bill" name="bill" min="0" step="1" value="2400" required>
    </div>
    <div class="field field-row">
      <div>
        <label for="taxPct">Tax (%)</label>
        <input type="number" inputmode="decimal" id="taxPct" name="taxPct" min="0" step="0.5" value="5">
      </div>
      <div>
        <label for="tipPct">Tip (%)</label>
        <input type="number" inputmode="decimal" id="tipPct" name="tipPct" min="0" step="1" value="10">
      </div>
    </div>
    <div class="field">
      <label for="people">Number of people</label>
      <input type="number" inputmode="numeric" id="people" name="people" min="1" step="1" value="4" required>
    </div>`,
};
