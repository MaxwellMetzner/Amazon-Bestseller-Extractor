document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.__bsr_links || []
  }, (results) => {
    const container = document.getElementById('links');
    container.innerHTML = '';
    const links = results?.[0]?.result || [];
    if (!Array.isArray(links) || links.length === 0) {
      container.textContent = 'No Best Sellers Rank links found.';
      return;
    }

    const currentTabUrl = tab.url; // Get current tab URL

    links.forEach(({ rank, category, href, anchorText }) => {
      // Check if the link href is the same as the current tab's URL
      if (href === currentTabUrl) {
        return; // Skip this link
      }
      const div = document.createElement('div');
      div.className = 'link-card';
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.innerHTML = `<span class="rank">${rank}</span> in ${category} (${anchorText})`;
      div.appendChild(a);
      container.appendChild(div);
    });
  });

  // Add CamelCamelCamel link
  const currentTabUrl = tab.url;
  if (currentTabUrl && currentTabUrl.includes('amazon.com')) {
    const camelUrl = getCamelCamelCamelUrl(currentTabUrl);
    if (camelUrl) {
      const camelContainer = document.getElementById('camel-link-container');
      const camelLink = document.createElement('a');
      camelLink.href = camelUrl;
      camelLink.target = '_blank';
      camelLink.textContent = 'View Price History on CamelCamelCamel';
      camelContainer.appendChild(camelLink);
    }
  }
});

function getCamelCamelCamelUrl(amazonUrl) {
  const match = amazonUrl.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/);
  if (match) {
    const asin = match[1];
    return `https://camelcamelcamel.com/product/${asin}`;
  }
  return null;
}
