document.addEventListener('DOMContentLoaded', async () => {
  applySavedTheme();
  wireThemeToggle();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const container = document.getElementById('links');

  // Disallow chrome:// pages
  if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
    container.textContent = 'Not available on this page.';
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.__bsr_links || []
  }, (results) => {
    const links = results?.[0]?.result || [];
    container.innerHTML = '';
    if (!Array.isArray(links) || links.length === 0) {
      container.textContent = 'No Best Sellers Rank links found.';
      return;
    }

    const currentTabUrl = tab.url; // Get current tab URL

    links.forEach(({ rank, category, href, anchorText }) => {
      if (href === currentTabUrl) return; // Skip self-link
      if (!href) return;

      const card = document.createElement('a');
      card.className = 'link-card';
      card.href = href;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.innerHTML = `<span class="rank">${rank}</span> in ${category} (${anchorText})`;
      container.appendChild(card);
    });
  });

  // Add CamelCamelCamel link
  const currentTabUrl = tab.url;
  if (currentTabUrl && currentTabUrl.match(/\/dp\/|\/gp\/product\//)) {
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

const THEMES = ['amazon', 'dark', 'slate'];
const THEME_LABELS = {
  amazon: 'Amazon',
  dark: 'Dark',
  slate: 'Slate'
};

function applySavedTheme() {
  const saved = localStorage.getItem('bsr_theme') || 'amazon';
  applyTheme(saved);
}

function applyTheme(theme) {
  const next = THEMES.includes(theme) ? theme : 'amazon';
  document.body.setAttribute('data-theme', next);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = THEME_LABELS[next] || 'Theme';
  localStorage.setItem('bsr_theme', next);
}

function wireThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') || 'amazon';
    const idx = THEMES.indexOf(current);
    const next = THEMES[(idx + 1) % THEMES.length];
    applyTheme(next);
  });
}
