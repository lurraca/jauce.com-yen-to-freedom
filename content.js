// Default rates as fallback
const DEFAULT_RATES = {
  USD: 0.0067,
  EUR: 0.0062
};

// Selectors for price elements on jauce.com
const PRICE_SELECTORS = [
  'div.display.current-bid.notranslate',
  'div.fr.notranslate'
];

let cachedRates = null;

async function getRates() {
  if (cachedRates) {
    return cachedRates;
  }

  try {
    const data = await chrome.storage.local.get(['rates']);
    cachedRates = data.rates || DEFAULT_RATES;
    return cachedRates;
  } catch (error) {
    console.error('Error getting rates:', error);
    return DEFAULT_RATES;
  }
}

function formatCurrency(amount, currency) {
  const symbols = { USD: '$', EUR: '\u20ac' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function createConversionElement(yenAmount, rates) {
  const usdAmount = yenAmount * rates.USD;
  const eurAmount = yenAmount * rates.EUR;

  const container = document.createElement('div');
  container.className = 'yen-to-freedom-conversion';
  container.style.cssText = `
    margin-top: 4px;
    font-size: 0.85em;
    color: #2e7d32;
    line-height: 1.4;
  `;

  container.innerHTML = `
    <div>\u2248 ${formatCurrency(usdAmount, 'USD')} USD</div>
    <div>\u2248 ${formatCurrency(eurAmount, 'EUR')} EUR</div>
  `;

  return container;
}

function parseYenAmount(text) {
  // Remove currency symbols, commas, spaces, and extract number
  const cleaned = text.replace(/[^\d.-]/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

async function convertPriceElements() {
  const rates = await getRates();

  PRICE_SELECTORS.forEach(selector => {
    const elements = document.querySelectorAll(selector);

    elements.forEach(element => {
      // Skip if already converted
      if (element.dataset.yenToFreedomConverted === 'true') {
        return;
      }

      const yenAmount = parseYenAmount(element.textContent);

      if (yenAmount !== null && yenAmount > 0) {
        const conversionEl = createConversionElement(yenAmount, rates);

        // Insert after the price element
        if (element.nextSibling) {
          element.parentNode.insertBefore(conversionEl, element.nextSibling);
        } else {
          element.parentNode.appendChild(conversionEl);
        }

        // Mark as converted
        element.dataset.yenToFreedomConverted = 'true';
      }
    });
  });
}

// Listen for rate updates from background
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.rates) {
    cachedRates = changes.rates.newValue;
    // Optionally update existing conversions
    updateExistingConversions();
  }
});

function updateExistingConversions() {
  // Remove existing conversions and reconvert
  document.querySelectorAll('.yen-to-freedom-conversion').forEach(el => el.remove());
  PRICE_SELECTORS.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.dataset.yenToFreedomConverted = 'false';
    });
  });
  convertPriceElements();
}

// Initial conversion
convertPriceElements();

// Observe DOM for dynamically loaded content
const observer = new MutationObserver((mutations) => {
  let shouldConvert = false;

  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldConvert = true;
      break;
    }
  }

  if (shouldConvert) {
    // Debounce to avoid excessive calls
    clearTimeout(window.yenToFreedomTimeout);
    window.yenToFreedomTimeout = setTimeout(convertPriceElements, 100);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('Yen to Freedom content script loaded');
