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
    links.forEach(({ rank, category, href, anchorText }) => {
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
});
