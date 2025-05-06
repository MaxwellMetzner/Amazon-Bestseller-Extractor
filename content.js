(() => {
  function extractBSRLinks() {
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
              if (match && link) {
                const key = `#${match[1]}|${match[2].trim()}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  result.push({
                    rank: `#${match[1]}`,
                    category: match[2].trim(),
                    href: new URL(link.getAttribute('href'), window.location.origin).href,
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
            if (match) {
              const rank = `#${match[1].replace(/,/g, '')}`;
              const category = match[2].trim();
              const key = `${rank}|${category}`;
              if (!seen.has(key)) {
                seen.add(key);
                result.push({
                  rank: `#${match[1]}`,
                  category,
                  href: new URL(anchor.getAttribute('href'), window.location.origin).href,
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
    } catch (e) {
      console.error('BSR extraction failed:', e);
      window.__bsr_links = [];
    }
  }

  extractBSRLinks();

  const targetNode = document.getElementById('detailBulletsWrapper_feature_div') || document.body;
  const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.addedNodes.length > 0) {
        const hasDetailBullets = document.querySelector('#detailBulletsWrapper_feature_div li');
        if (hasDetailBullets) {
          extractBSRLinks();
          observer.disconnect();
          break;
        }
      }
    }
  });

  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });
})();
