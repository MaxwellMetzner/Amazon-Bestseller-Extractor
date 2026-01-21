const tabState = {};

function setBadge(tabId, on) {
  if (on) {
    chrome.action.setBadgeText({
      text: ' ', // Blank text renders the badge; Chrome size is fixed
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

    tabState[tabId] = {
      hasResults,
      url
    };

    setBadge(tabId, hasResults);
    sendResponse({ success: true });
  }
});

// Restore badge when switching tabs based on stored state
chrome.tabs.onActivated.addListener((activeInfo) => {
  const state = tabState[activeInfo.tabId];
  setBadge(activeInfo.tabId, state?.hasResults);
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
