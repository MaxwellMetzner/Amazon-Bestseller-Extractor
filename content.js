(() => {
  let extractionTimeout;
  let hasResults = false;
  let resultsFound = false; // Track if results have ever been found

  function isAmazonProductPage() {
    const { pathname } = window.location;
    const pathOk = /(\/dp\/|\/gp\/product\/)/i.test(pathname);
    return pathOk;
  }

  function updateBadge() {
    const links = window.__bsr_links || [];
    const count = links.length;
    const foundResults = count > 0;

    // Once results are found, keep badge on until page reload
    if (foundResults) {
      resultsFound = true;
    }

    // Calculate the lowest (best) rank number
    let lowestRank = null;
    if (links.length > 0) {
      const rankNumbers = links.map(link => {
        // Extract numeric value from rank string like "#3" or "#142"
        const match = link.rank.match(/#?(\d+)/);
        return match ? parseInt(match[1], 10) : Infinity;
      }).filter(n => n !== Infinity);
      
      if (rankNumbers.length > 0) {
        lowestRank = Math.min(...rankNumbers);
      }
    }

    const shouldShow = resultsFound;

    // Always reassert badge if we should show; clear only on state change
    if (shouldShow || shouldShow !== hasResults) {
      hasResults = shouldShow;
      chrome.runtime.sendMessage({
        type: 'UPDATE_BADGE',
        hasResults: shouldShow,
        lowestRank: lowestRank
      }).catch(err => {
        // Extension might be updating, silently fail
        console.debug('Badge update failed:', err);
      });
    }
  }

  function toAbsolute(hrefVal) {
    if (!hrefVal) return null;
    try {
      return new URL(hrefVal, window.location.origin).href;
    } catch (e) {
      return null; // Ignore malformed URLs
    }
  }

  function extractBSRLinks() {
    if (!isAmazonProductPage()) {
      window.__bsr_links = [];
      return;
    }
    try {
      const result = [];
      const seen = new Set();
      const thElements = document.querySelectorAll('th.prodDetSectionEntry');

      thElements.forEach(th => {
        if (th.textContent.trim().includes('Best Sellers Rank')) {
          const td = th.nextElementSibling;
          if (td) {
            const spans = td.querySelectorAll('span');
            spans.forEach(span => {
              const link = span.querySelector('a');
              const match = link?.parentElement?.textContent?.match(/#(\d+) in ([^\(]+)/);
              const hrefVal = link?.getAttribute('href');
              const absoluteHref = toAbsolute(hrefVal);
              if (match && link && absoluteHref) {
                const key = `#${match[1]}|${match[2].trim()}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  result.push({
                    rank: `#${match[1]}`,
                    category: match[2].trim(),
                    href: absoluteHref,
                    anchorText: link.textContent.trim()
                  });
                }
              }
            });
          }
        }
      });

      // Additional fallback: product detail bullets style
      const bulletsLi = Array.from(document.querySelectorAll("#detailBulletsWrapper_feature_div li"));
      bulletsLi.forEach(li => {
        if (li.textContent.includes("Best Sellers Rank")) {
          const anchors = li.querySelectorAll("a");

          anchors.forEach(anchor => {
            const match = anchor.parentElement?.textContent?.match(/#(\d+[\d,]*) in ([^\(]+)/);
            const hrefVal = anchor.getAttribute('href');
            const absoluteHref = toAbsolute(hrefVal);
            if (match && absoluteHref) {
              const rank = `#${match[1].replace(/,/g, '')}`;
              const category = match[2].trim();
              const key = `${rank}|${category}`;
              if (!seen.has(key)) {
                seen.add(key);
                result.push({
                  rank: `#${match[1]}`,
                  category,
                  href: absoluteHref,
                  anchorText: anchor.textContent.trim()
                });
              }
            }
          });

          const textMatch = li.innerText.match(/#(\d+[\d,]*) in [^\n]+/);
          if (textMatch) {
            const rankText = textMatch[0];
            const match = rankText.match(/#(\d+[\d,]*) in ([^\(]+)/);
            if (match) {
              const rank = `#${match[1].replace(/,/g, '')}`;
              const category = match[2].trim();
              const key = `${rank}|${category}`;
              if (!seen.has(key)) {
                seen.add(key);
                result.push({
                  rank: `#${match[1]}`,
                  category,
                  href: window.location.href,
                  anchorText: category
                });
              }
            }
          }
        }
      });

      window.__bsr_links = result;
      updateBadge();
    } catch (e) {
      console.error('BSR extraction failed:', e);
      window.__bsr_links = [];
      updateBadge();
    }
  }

  // Initial extraction
  if (isAmazonProductPage()) {
    extractBSRLinks();
  }

  // Debounced MutationObserver to handle dynamic content efficiently
  const targetNode = document.getElementById('detailBulletsWrapper_feature_div') || document.body;
  const observer = new MutationObserver(() => {
    clearTimeout(extractionTimeout);
    extractionTimeout = setTimeout(() => {
      extractBSRLinks();
    }, 300); // Debounce to avoid excessive extractions
  });

  if (isAmazonProductPage()) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  }
})();
