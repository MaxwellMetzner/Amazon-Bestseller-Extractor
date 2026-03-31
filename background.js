"use strict";
(() => {
    const manifest = chrome.runtime.getManifest();
    const CONTENT_SCRIPT_HOST_PATTERN = /^\*:\/\/([^/]+)\/\*$/;
    const BADGE_BACKGROUND_COLOR = manifest.action?.default_badge_background_color ?? '#FF0000';
    const tabState = new Map();
    function isRecordValue(value) {
        return typeof value === 'object' && value !== null;
    }
    function isUpdateBadgeRequest(message) {
        return (isRecordValue(message) &&
            message.type === 'UPDATE_BADGE' &&
            typeof message.hasResults === 'boolean' &&
            (typeof message.lowestRank === 'number' || message.lowestRank === null));
    }
    function getSupportedAmazonHosts() {
        const hosts = new Set();
        for (const contentScript of manifest.content_scripts ?? []) {
            for (const matchPattern of contentScript.matches ?? []) {
                const host = matchPattern.match(CONTENT_SCRIPT_HOST_PATTERN)?.[1];
                if (host !== undefined) {
                    hosts.add(host);
                }
            }
        }
        return [...hosts];
    }
    function registerActionRules() {
        const amazonHosts = getSupportedAmazonHosts();
        chrome.action.disable();
        chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
            const rules = amazonHosts.map((host) => ({
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
            if (rules.length > 0) {
                chrome.declarativeContent.onPageChanged.addRules(rules);
            }
        });
    }
    function setBadge(tabId, isVisible, lowestRank = null) {
        if (isVisible) {
            const badgeText = lowestRank === null ? ' ' : String(lowestRank);
            chrome.action.setBadgeText({
                text: badgeText,
                tabId
            });
            chrome.action.setBadgeBackgroundColor({
                color: BADGE_BACKGROUND_COLOR,
                tabId
            });
            return;
        }
        chrome.action.setBadgeText({
            text: '',
            tabId
        });
    }
    chrome.runtime.onInstalled.addListener(registerActionRules);
    chrome.runtime.onStartup.addListener(registerActionRules);
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const incomingMessage = message;
        if (!isUpdateBadgeRequest(incomingMessage)) {
            return;
        }
        const tabId = sender.tab?.id;
        if (tabId == null) {
            return;
        }
        const nextState = {
            hasResults: incomingMessage.hasResults,
            lowestRank: incomingMessage.lowestRank,
            ...(typeof sender.tab?.url === 'string' ? { url: sender.tab.url } : {})
        };
        tabState.set(tabId, nextState);
        setBadge(tabId, nextState.hasResults, nextState.lowestRank);
        sendResponse({ success: true });
    });
    chrome.tabs.onActivated.addListener(({ tabId }) => {
        const state = tabState.get(tabId);
        setBadge(tabId, state?.hasResults ?? false, state?.lowestRank ?? null);
    });
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (typeof changeInfo.url !== 'string') {
            return;
        }
        const previousUrl = tabState.get(tabId)?.url;
        const previousUrlWithoutHash = previousUrl?.split('#')[0] ?? null;
        const nextUrlWithoutHash = changeInfo.url.split('#')[0];
        if (previousUrlWithoutHash === nextUrlWithoutHash) {
            return;
        }
        tabState.set(tabId, {
            hasResults: false,
            url: changeInfo.url,
            lowestRank: null
        });
        setBadge(tabId, false);
    });
    chrome.tabs.onRemoved.addListener((tabId) => {
        tabState.delete(tabId);
    });
})();
