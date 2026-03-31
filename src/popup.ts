((): void => {
  const THEMES = ['amazon', 'dark', 'slate'] as const;
  type ThemeName = (typeof THEMES)[number];
  const DEFAULT_THEME: ThemeName = 'amazon';
  const THEME_STORAGE_KEY = 'bsr_theme';
  const GET_BSR_DATA_REQUEST: GetBsrDataRequest = { type: 'GET_BSR_DATA' };

  const THEME_LABELS: Record<ThemeName, string> = {
    amazon: 'Amazon',
    dark: 'Dark',
    slate: 'Slate'
  };

  function isRecordValue(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  function isBsrLink(value: unknown): value is BsrLink {
    return (
      isRecordValue(value) &&
      typeof value.rank === 'string' &&
      typeof value.category === 'string' &&
      typeof value.href === 'string' &&
      typeof value.anchorText === 'string'
    );
  }

  function isGetBsrDataResponse(value: unknown): value is GetBsrDataResponse {
    return (
      isRecordValue(value) &&
      typeof value.isAmazonProductPage === 'boolean' &&
      typeof value.pageUrl === 'string' &&
      Array.isArray(value.links) &&
      value.links.every(isBsrLink)
    );
  }

  function isThemeName(value: string | null): value is ThemeName {
    return value === 'amazon' || value === 'dark' || value === 'slate';
  }

  function getCamelCamelCamelUrl(amazonUrl: string): string | null {
    const match = amazonUrl.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})(?:[/?]|$)/i);
    if (match === null) {
      return null;
    }

    const asin = match[1];
    if (asin === undefined) {
      return null;
    }

    return `https://camelcamelcamel.com/product/${asin.toUpperCase()}`;
  }

  function applyTheme(theme: ThemeName): void {
    document.body.setAttribute('data-theme', theme);

    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton instanceof HTMLButtonElement) {
      toggleButton.textContent = THEME_LABELS[theme];
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  function applySavedTheme(): void {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    applyTheme(isThemeName(savedTheme) ? savedTheme : DEFAULT_THEME);
  }

  function wireThemeToggle(): void {
    const toggleButton = document.getElementById('theme-toggle');
    if (!(toggleButton instanceof HTMLButtonElement)) {
      return;
    }

    toggleButton.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme');
      const currentIndex = isThemeName(currentTheme) ? THEMES.indexOf(currentTheme) : 0;
      const nextTheme = THEMES[(currentIndex + 1) % THEMES.length] ?? DEFAULT_THEME;
      applyTheme(nextTheme);
    });
  }

  function renderLinks(container: HTMLElement, links: BsrLink[], pageUrl: string): void {
    const fragment = document.createDocumentFragment();
    let visibleLinkCount = 0;

    for (const link of links) {
      if (link.href === pageUrl || link.href.length === 0) {
        continue;
      }

      const card = document.createElement('a');
      const rank = document.createElement('span');

      card.className = 'link-card';
      card.href = link.href;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';

      rank.className = 'rank';
      rank.textContent = link.rank;

      card.append(rank, document.createTextNode(` in ${link.category} (${link.anchorText})`));
      fragment.appendChild(card);
      visibleLinkCount += 1;
    }

    if (visibleLinkCount === 0) {
      container.textContent = 'No Best Sellers Rank links found.';
      return;
    }

    container.replaceChildren(fragment);
  }

  function renderCamelLink(container: HTMLElement, pageUrl: string): void {
    container.textContent = '';

    const camelUrl = getCamelCamelCamelUrl(pageUrl);
    if (camelUrl === null) {
      return;
    }

    const camelLink = document.createElement('a');
    camelLink.href = camelUrl;
    camelLink.target = '_blank';
    camelLink.rel = 'noopener noreferrer';
    camelLink.textContent = 'View Price History on CamelCamelCamel';
    container.appendChild(camelLink);
  }

  async function initializePopup(): Promise<void> {
    applySavedTheme();
    wireThemeToggle();

    const linksContainer = document.getElementById('links');
    const camelContainer = document.getElementById('camel-link-container');

    if (!(linksContainer instanceof HTMLElement) || !(camelContainer instanceof HTMLElement)) {
      return;
    }

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id == null) {
      linksContainer.textContent = 'Not available on this page.';
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, GET_BSR_DATA_REQUEST, (response) => {
      const responseValue: unknown = response;

      if (chrome.runtime.lastError || !isGetBsrDataResponse(responseValue)) {
        linksContainer.textContent = 'Available only on Amazon product pages.';
        camelContainer.textContent = '';
        return;
      }

      if (!responseValue.isAmazonProductPage) {
        linksContainer.textContent = 'Open an Amazon product page to view BSR links.';
        renderCamelLink(camelContainer, responseValue.pageUrl);
        return;
      }

      renderLinks(linksContainer, responseValue.links, responseValue.pageUrl);
      renderCamelLink(camelContainer, responseValue.pageUrl);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    void initializePopup();
  });
})();