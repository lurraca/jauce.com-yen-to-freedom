const API_URL = 'https://api.exchangerate-api.com/v4/latest/JPY';
const ALARM_NAME = 'refreshRates';
const ONE_DAY_IN_MINUTES = 24 * 60;

async function fetchConversionRates() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data?.rates?.USD && data?.rates?.EUR) {
      const rateData = {
        rates: {
          USD: data.rates.USD,
          EUR: data.rates.EUR
        },
        lastFetch: Date.now()
      };

      await chrome.storage.local.set(rateData);
      console.log('Rates updated:', rateData.rates);
      return rateData;
    }
  } catch (error) {
    console.error('Error fetching conversion rates:', error);
  }
  return null;
}

// Fetch rates on extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Yen to Freedom installed');
  fetchConversionRates();

  // Set up daily alarm for rate refresh
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: ONE_DAY_IN_MINUTES,
    periodInMinutes: ONE_DAY_IN_MINUTES
  });
});

// Handle alarm for daily refresh
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('Daily rate refresh triggered');
    fetchConversionRates();
  }
});

// Listen for manual refresh requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'refreshRates') {
    fetchConversionRates().then((data) => {
      sendResponse({ success: true, data });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }

  if (message.action === 'getRates') {
    chrome.storage.local.get(['rates', 'lastFetch']).then((data) => {
      sendResponse(data);
    });
    return true;
  }
});

// Fetch rates on service worker startup (in case alarm was missed)
chrome.storage.local.get(['lastFetch']).then(({ lastFetch }) => {
  const oneDayMs = ONE_DAY_IN_MINUTES * 60 * 1000;
  if (!lastFetch || (Date.now() - lastFetch > oneDayMs)) {
    console.log('Rates stale or missing, fetching...');
    fetchConversionRates();
  }
});
