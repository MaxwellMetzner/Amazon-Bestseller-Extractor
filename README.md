# Amazon Bestseller Extractor

A Chrome extension that instantly shows you the Best Sellers Rank (BSR) of any product while you browse Amazon.

## What it does

When you visit an Amazon product page, the extension automatically scans the page for Best Sellers Rank information. If the product has BSR data, you'll see a **red badge** appear on the extension icon in your toolbar showing the product's best (lowest) rank number across all of its categories.

Click the extension icon to open a popup listing every BSR category the product ranks in, along with its rank and a direct link to that category page on Amazon. The popup also includes a link to view the product's price history on CamelCamelCamel.

### The badge

The red numbered badge on the extension icon is the product's **best rank** — i.e., the lowest rank number found across all of its BSR categories. A lower number means the product sells better in that category. For example, a badge showing **3** means the product is the #3 best seller in at least one of its categories.

- **Badge visible** — the product has BSR data; click the icon to see the full breakdown.
- **No badge** — the current page is not an Amazon product page, or the product has no BSR information.

### Theme options

The popup supports three visual themes — Amazon, Dark, and Slate — which you can cycle through using the theme button inside the popup.

## Recommended: pin the extension

To see the badge at a glance while browsing Amazon, **pin the extension** to your toolbar:

1. Click the puzzle-piece icon (Extensions) in the Chrome toolbar.
2. Find **Amazon BSR Extractor** in the list.
3. Click the pin icon next to it.

The extension icon will now always be visible, and you'll see the red rank badge appear automatically whenever you land on an Amazon product page.

## Privacy

- Runs only on amazon.com product pages you open.
- Reads the page content to find BSR categories and links; **nothing is sent to external servers**.
- Uses Chrome permissions `activeTab` and `scripting` solely to read the current page.

## Install as an unpacked extension

1. Clone or download this repository.
2. In Chrome, open `chrome://extensions/` and turn on **Developer mode**.
3. Click **Load unpacked** and select the folder containing this project.
4. Pin the extension (see above) and visit any Amazon product page.