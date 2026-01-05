# Yen to Freedom

A Chrome extension that automatically converts Japanese Yen prices to USD and EUR on [jauce.com](https://jauce.com) auction pages.

## Features

- Converts JPY prices to USD and EUR in real-time
- Daily automatic exchange rate updates
- Manual refresh option via popup
- Lightweight and privacy-focused (only runs on jauce.com)
- Manifest V3 compliant

## Installation

### From Source (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/lurraca/jauce.com-yen-to-freedom.git
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `jauce.com-yen-to-freedom` folder

5. **Verify installation**
   - You should see the green ¥ icon in your extensions toolbar
   - Navigate to jauce.com to see price conversions

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARCHITECTURE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│  Exchange Rate   │  HTTP   │   Background     │ Storage │  Chrome Local    │
│      API         │ ──────► │   Service Worker │ ──────► │    Storage       │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └────────┬─────────┘
                                     │                             │
                                     │ chrome.alarms               │ Read
                                     │ (daily refresh)             │ Rates
                                     ▼                             ▼
                             ┌──────────────────┐         ┌──────────────────┐
                             │                  │         │                  │
                             │     Popup UI     │         │  Content Script  │
                             │  (manual refresh │         │  (DOM injection) │
                             │   + rate display)│         │                  │
                             │                  │         │                  │
                             └──────────────────┘         └────────┬─────────┘
                                                                   │
                                                                   │ Inject
                                                                   ▼
                                                          ┌──────────────────┐
                                                          │                  │
                                                          │   jauce.com      │
                                                          │   Price Display  │
                                                          │                  │
                                                          │   ¥ 32,500       │
                                                          │   ≈ $217.75 USD  │
                                                          │   ≈ €201.50 EUR  │
                                                          │                  │
                                                          └──────────────────┘
```

### Flow

1. **On Install**: Background service worker fetches current exchange rates
2. **Daily**: `chrome.alarms` triggers automatic rate refresh
3. **On Page Load**: Content script reads rates from storage and injects conversions
4. **Dynamic Content**: MutationObserver watches for new prices loaded via AJAX

## Third Party Services

### Exchange Rate API

| Service | URL | Authentication |
|---------|-----|----------------|
| ExchangeRate-API | `api.exchangerate-api.com/v4/latest/JPY` | None required |

**Details:**
- **Provider**: [ExchangeRate-API](https://www.exchangerate-api.com/)
- **Endpoint**: `/v4/latest/JPY` (free tier)
- **Rate Limit**: ~250 requests/month (no API key)
- **Update Frequency**: Rates updated daily by the API
- **Data**: Returns USD, EUR, and 150+ other currency rates

**Privacy Note**: The only external request made by this extension is to fetch exchange rates. No user data is collected or transmitted.

## File Structure

```
jauce.com-yen-to-freedom/
├── manifest.json      # Extension configuration (Manifest V3)
├── background.js      # Service worker for API calls & scheduling
├── content.js         # DOM manipulation on jauce.com
├── popup.html         # Extension popup structure
├── popup.js           # Popup interactivity
├── popup.css          # Popup styling
└── icons/
    ├── icon16.svg     # Toolbar icon
    ├── icon48.svg     # Extensions page icon
    └── icon128.svg    # Chrome Web Store icon
```

## Permissions

| Permission | Reason |
|------------|--------|
| `storage` | Store exchange rates locally |
| `alarms` | Schedule daily rate refresh |
| `host_permissions: jauce.com` | Inject content script on auction pages |

## Development

```bash
# Clone
git clone https://github.com/lurraca/jauce.com-yen-to-freedom.git

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the cloned folder

# Make changes, then reload
# Click the refresh icon on the extension card in chrome://extensions/
```

## License

MIT
