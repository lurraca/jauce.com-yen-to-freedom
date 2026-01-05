document.addEventListener('DOMContentLoaded', async () => {
  const usdRateEl = document.getElementById('usd-rate');
  const eurRateEl = document.getElementById('eur-rate');
  const lastUpdateEl = document.getElementById('last-update');
  const refreshBtn = document.getElementById('refresh-btn');

  async function loadRates() {
    try {
      const data = await chrome.storage.local.get(['rates', 'lastFetch']);

      if (data.rates) {
        usdRateEl.textContent = data.rates.USD.toFixed(6);
        eurRateEl.textContent = data.rates.EUR.toFixed(6);
      } else {
        usdRateEl.textContent = 'N/A';
        eurRateEl.textContent = 'N/A';
      }

      if (data.lastFetch) {
        const date = new Date(data.lastFetch);
        lastUpdateEl.textContent = date.toLocaleString();
      } else {
        lastUpdateEl.textContent = 'Never';
      }
    } catch (error) {
      console.error('Error loading rates:', error);
      usdRateEl.textContent = 'Error';
      eurRateEl.textContent = 'Error';
    }
  }

  async function refreshRates() {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing...';

    try {
      const response = await chrome.runtime.sendMessage({ action: 'refreshRates' });

      if (response?.success) {
        await loadRates();
        refreshBtn.textContent = 'Updated!';
        setTimeout(() => {
          refreshBtn.textContent = 'Refresh Rates';
          refreshBtn.disabled = false;
        }, 1500);
      } else {
        throw new Error(response?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error refreshing rates:', error);
      refreshBtn.textContent = 'Error - Try Again';
      refreshBtn.disabled = false;
    }
  }

  refreshBtn.addEventListener('click', refreshRates);

  // Load rates on popup open
  await loadRates();
});
