// Default rates as fallback
const DEFAULT_RATES = {
  USD: 0.0067,
  EUR: 0.0062
};

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
  const symbols = { USD: '$', EUR: '€' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseYenAmount(text) {
  // Extract number from text like "4,200 yen" or "440yen"
  const cleaned = text.replace(/[^\d]/g, '');
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

async function convertMainBid() {
  const rates = await getRates();

  // Target: <div class="display current-bid notranslate"> 4,200 <span>yen</span></div>
  const mainBidElements = document.querySelectorAll('div.display.current-bid.notranslate');

  mainBidElements.forEach(element => {
    if (element.dataset.yenToFreedomConverted === 'true') return;

    const yenAmount = parseYenAmount(element.textContent);
    if (!yenAmount || yenAmount <= 0) return;

    const usdAmount = yenAmount * rates.USD;
    const eurAmount = yenAmount * rates.EUR;

    // Create conversion element (block, below)
    const conversion = document.createElement('div');
    conversion.className = 'yen-to-freedom-conversion';
    conversion.style.cssText = `
      margin-top: 4px;
      font-size: 0.85em;
      color: #2e7d32;
      line-height: 1.4;
    `;
    conversion.innerHTML = `
      <div>≈ ${formatCurrency(usdAmount, 'USD')} USD</div>
      <div>≈ ${formatCurrency(eurAmount, 'EUR')} EUR</div>
    `;

    // Insert after the bid element
    element.parentNode.insertBefore(conversion, element.nextSibling);
    element.dataset.yenToFreedomConverted = 'true';
  });
}

async function convertShippingFee() {
  const rates = await getRates();

  // Find rows containing "shipping fee" or "warehouse"
  const rows = document.querySelectorAll('td.notranslate');

  rows.forEach(row => {
    const rowText = row.textContent.toLowerCase();
    if (!rowText.includes('shipping') && !rowText.includes('warehouse')) return;

    // Find the article element with yen amount inside .fr.notranslate
    const frDiv = row.querySelector('div.fr.notranslate');
    if (!frDiv) return;

    const article = frDiv.querySelector('article');
    if (!article) return;
    if (article.dataset.yenToFreedomConverted === 'true') return;

    const articleText = article.textContent.trim();
    if (!articleText.toLowerCase().includes('yen')) return;

    const yenAmount = parseYenAmount(articleText);
    if (!yenAmount || yenAmount <= 0) return;

    const usdAmount = yenAmount * rates.USD;
    const eurAmount = yenAmount * rates.EUR;

    // Create inline conversion (same line)
    const conversion = document.createElement('span');
    conversion.className = 'yen-to-freedom-conversion';
    conversion.style.cssText = `
      margin-left: 8px;
      font-size: 0.9em;
      color: #2e7d32;
    `;
    conversion.textContent = `≈ ${formatCurrency(usdAmount, 'USD')} / ${formatCurrency(eurAmount, 'EUR')}`;

    // Append inline after the yen text
    article.appendChild(conversion);
    article.dataset.yenToFreedomConverted = 'true';
  });
}

async function convertAllPrices() {
  await convertMainBid();
  await convertShippingFee();
}

// Listen for rate updates from background
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.rates) {
    cachedRates = changes.rates.newValue;
    updateExistingConversions();
  }
});

function updateExistingConversions() {
  // Remove existing conversions
  document.querySelectorAll('.yen-to-freedom-conversion').forEach(el => el.remove());
  document.querySelectorAll('[data-yen-to-freedom-converted]').forEach(el => {
    delete el.dataset.yenToFreedomConverted;
  });
  convertAllPrices();
}

// Initial conversion
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', convertAllPrices);
} else {
  convertAllPrices();
}

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
    clearTimeout(window.yenToFreedomTimeout);
    window.yenToFreedomTimeout = setTimeout(convertAllPrices, 100);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('Yen to Freedom content script loaded');
