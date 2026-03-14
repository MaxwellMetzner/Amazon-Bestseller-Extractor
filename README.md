# Amazon Bestseller Extractor

> A focused Chrome extension for reading Amazon Best Sellers Rank data directly from product pages, without asking for access to the rest of the web.

Amazon Bestseller Extractor watches supported Amazon product pages, surfaces the strongest Best Sellers Rank as a toolbar badge, and opens a compact popup with the full category breakdown.

## Highlights

- Shows the best BSR value as a toolbar badge when rank data exists.
- Lists every detected BSR category and link in a clean popup.
- Adds a quick CamelCamelCamel shortcut for the current ASIN.
- Supports multiple Amazon storefronts.
- Stays disabled outside supported Amazon domains.
- Avoids broad page access permissions.

## How It Works

1. Open a supported Amazon storefront.
2. Visit a product page with a `/dp/` or `/gp/product/` URL.
3. The extension scans the page for Best Sellers Rank data.
4. If rank data exists, the toolbar badge shows the best rank found.
5. Click the extension icon to open the full BSR breakdown.

## What You See

### Toolbar badge

The red badge shows the best available rank on the page, meaning the lowest numeric rank found across all categories.

- Badge visible: rank data was found on the current product page.
- No badge: the page is not a supported Amazon product page, or Amazon did not expose BSR data.

### Popup

The popup includes:

- A card list of detected BSR categories and links.
- A direct CamelCamelCamel link for the current product.
- Three built-in visual themes: Amazon, Dark, and Slate.

## Permission Model

This project is intentionally scoped down.

- The toolbar action is disabled by default.
- It only lights up on supported Amazon storefront domains.
- Content scripts run only on supported Amazon domains.
- The popup reads data from the Amazon content script instead of injecting code into arbitrary active tabs.
- No extracted data is sent to external servers.

## Supported Amazon Domains

- amazon.com
- amazon.ca
- amazon.com.mx
- amazon.com.br
- amazon.com.au
- amazon.co.uk
- amazon.de
- amazon.fr
- amazon.it
- amazon.es
- amazon.nl
- amazon.se
- amazon.pl
- amazon.com.tr
- amazon.ae
- amazon.sa
- amazon.sg
- amazon.co.jp
- amazon.in
- amazon.eg
- amazon.com.be

## Install Locally

1. Clone or download this repository.
2. Open `chrome://extensions/` in Chrome.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select this project folder.
6. Pin the extension if you want the badge visible at all times.

## Privacy

- Reads only the currently open supported Amazon page.
- Extracts BSR links from the DOM already present in the page.
- Sends nothing to a backend, database, or third-party API.
- Does not request broad temporary access to every site you browse.

## Development Notes

- Built as a Manifest V3 Chrome extension.
- Badge state is maintained per tab.
- Action availability is controlled declaratively for supported Amazon hosts.

## Roadmap Ideas

- Add storefront coverage for additional Amazon domains if needed.
- Improve extraction resilience for alternate Amazon product layouts.
- Add lightweight test fixtures for multiple product page formats.
