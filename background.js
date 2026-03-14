const tabState = {};
const AMAZON_HOSTS = [
  'www.amazon.com',
  'www.amazon.ca',
  'www.amazon.com.mx',
  'www.amazon.com.br',
  'www.amazon.com.au',
  'www.amazon.co.uk',
  'www.amazon.de',
  'www.amazon.fr',
  'www.amazon.it',
  'www.amazon.es',
  'www.amazon.nl',
  'www.amazon.se',
  'www.amazon.pl',
  'www.amazon.com.tr',
  'www.amazon.ae',
  'www.amazon.sa',
  'www.amazon.sg',
  'www.amazon.co.jp',
  'www.amazon.in',
  'www.amazon.eg',
  'www.amazon.com.be'
];

function registerActionRules() {
  chrome.action.disable();

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    const rules = AMAZON_HOSTS.map((host) => ({
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            hostEquals: host,
            schemes: ['http', 'https']
          }
        })
      ],
      actions: [new chrome.declarativeContent.ShowAction()]
    }));

    chrome.declarativeContent.onPageChanged.addRules(rules);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  registerActionRules();
});

chrome.runtime.onStartup.addListener(() => {
  registerActionRules();
});

function setBadge(tabId, on, lowestRank = null) {
  if (on) {
    chrome.action.setBadgeText({
      text: lowestRank ? String(lowestRank) : ' ',
      tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#FF0000',
      tabId
    });
  } else {
    chrome.action.setBadgeText({
      text: '',
      tabId
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_BADGE') {
    const tabId = sender.tab?.id;
    if (tabId == null) return;

    const hasResults = !!message.hasResults;
    const url = sender.tab?.url;
    const lowestRank = message.lowestRank || null;

    tabState[tabId] = {
      hasResults,
      url,
      lowestRank
    };

    setBadge(tabId, hasResults, lowestRank);
    sendResponse({ success: true });
  }
});

// Restore badge when switching tabs based on stored state
chrome.tabs.onActivated.addListener((activeInfo) => {
  const state = tabState[activeInfo.tabId];
  setBadge(activeInfo.tabId, state?.hasResults, state?.lowestRank);
});

// Clear badge only on true navigation to a new URL (ignoring hash changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const prev = tabState[tabId]?.url;
    const prevNoHash = prev ? prev.split('#')[0] : null;
    const nextNoHash = changeInfo.url.split('#')[0];

    if (!prevNoHash || prevNoHash !== nextNoHash) {
      tabState[tabId] = { hasResults: false, url: changeInfo.url };
      setBadge(tabId, false);
    }
  }
});
