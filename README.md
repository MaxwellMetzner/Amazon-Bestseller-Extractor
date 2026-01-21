# Amazon Bestseller Extractor

Extract Best Sellers Rank (BSR) categories and links from any Amazon product page.

## Why BSR matters

- Shows how a product ranks within its categories, helping you gauge demand and competition at a glance.
- Lets you click through to category pages so you can explore neighboring products and niches.
- Useful for quick product research and tracking whether rankings move over time.

## What the extension can access

- Runs only on amazon.com product pages you open.
- Reads the page content to find BSR categories and links; nothing is sent to external servers.
- Uses Chrome permissions `activeTab` and `scripting` to run its content script on the current tab.

## Load as an unpacked extension

1. Clone or download this repository.
2. In Chrome, open `chrome://extensions/` and turn on Developer mode.
3. Click **Load unpacked** and select the folder that contains this project.
4. Visit an Amazon product page. If matches are found, the extension badge will highlight it; click the icon to see the detected BSR categories in the popup.