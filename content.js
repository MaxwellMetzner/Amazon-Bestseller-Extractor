"use strict";
(() => {
    const PRODUCT_PAGE_PATH_PATTERN = /(\/dp\/|\/gp\/product\/)/i;
    const BEST_SELLERS_RANK_LABEL = 'Best Sellers Rank';
    const PRODUCT_DETAILS_SELECTOR = 'th.prodDetSectionEntry';
    const DETAIL_BULLETS_ID = 'detailBulletsWrapper_feature_div';
    const RANK_AND_CATEGORY_PATTERN = /#([\d,]+) in ([^\(]+)/;
    const INLINE_RANK_AND_CATEGORY_PATTERN = /#([\d,]+) in ([^\n\(]+)/;
    const EXTRACTION_DEBOUNCE_MS = 300;
    let extractionTimeout;
    let hasResults = false;
    let resultsFound = false;
    function isRecordValue(value) {
        return typeof value === 'object' && value !== null;
    }
    function isGetBsrDataRequest(message) {
        return isRecordValue(message) && message.type === 'GET_BSR_DATA';
    }
    function isAmazonProductPage() {
        return PRODUCT_PAGE_PATH_PATTERN.test(window.location.pathname);
    }
    function getStoredLinks() {
        return Array.isArray(window.__bsr_links) ? window.__bsr_links : [];
    }
    function setStoredLinks(links) {
        window.__bsr_links = links;
    }
    function parseRankValue(rankText) {
        const match = rankText.match(/#?([\d,]+)/);
        if (match === null) {
            return null;
        }
        const digits = match[1];
        if (digits === undefined) {
            return null;
        }
        const numericValue = Number.parseInt(digits.replace(/,/g, ''), 10);
        return Number.isFinite(numericValue) ? numericValue : null;
    }
    function updateBadge() {
        const links = getStoredLinks();
        const foundResults = links.length > 0;
        if (foundResults) {
            resultsFound = true;
        }
        const rankValues = links
            .map((link) => parseRankValue(link.rank))
            .filter((value) => value !== null);
        const lowestRank = rankValues.length > 0 ? Math.min(...rankValues) : null;
        const shouldShow = resultsFound;
        if (shouldShow || shouldShow !== hasResults) {
            hasResults = shouldShow;
            const message = {
                type: 'UPDATE_BADGE',
                hasResults: shouldShow,
                lowestRank
            };
            void chrome.runtime.sendMessage(message).catch((error) => {
                console.debug('Badge update failed:', error);
            });
        }
    }
    function toAbsolute(hrefValue) {
        if (hrefValue === null || hrefValue.length === 0) {
            return null;
        }
        try {
            return new URL(hrefValue, window.location.origin).href;
        }
        catch {
            return null;
        }
    }
    function pushUniqueResult(results, seen, rankDigits, categoryValue, href, anchorTextValue) {
        const category = categoryValue.trim();
        const rank = `#${rankDigits.trim()}`;
        const key = `${rank}|${category}`;
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        results.push({
            rank,
            category,
            href,
            anchorText: anchorTextValue.trim()
        });
    }
    function pushMatchedResult(results, seen, match, href, anchorTextValue) {
        const rankDigits = match[1];
        const category = match[2];
        if (rankDigits === undefined || category === undefined) {
            return;
        }
        pushUniqueResult(results, seen, rankDigits, category, href, anchorTextValue?.trim() || category.trim());
    }
    function extractFromProductDetails(results, seen) {
        const headerCells = document.querySelectorAll(PRODUCT_DETAILS_SELECTOR);
        for (const headerCell of headerCells) {
            const headerText = headerCell.textContent?.trim() ?? '';
            if (!headerText.includes(BEST_SELLERS_RANK_LABEL)) {
                continue;
            }
            const detailsCell = headerCell.nextElementSibling;
            if (!(detailsCell instanceof HTMLElement)) {
                continue;
            }
            const spans = detailsCell.querySelectorAll('span');
            for (const span of spans) {
                const link = span.querySelector('a');
                const parentText = link?.parentElement?.textContent ?? '';
                const match = parentText.match(RANK_AND_CATEGORY_PATTERN);
                const absoluteHref = toAbsolute(link?.getAttribute('href') ?? null);
                if (match === null || link === null || absoluteHref === null) {
                    continue;
                }
                pushMatchedResult(results, seen, match, absoluteHref, link.textContent ?? undefined);
            }
        }
    }
    function extractFromDetailBullets(results, seen) {
        const bulletItems = document.querySelectorAll(`#${DETAIL_BULLETS_ID} li`);
        for (const bulletItem of bulletItems) {
            const bulletText = bulletItem.textContent ?? '';
            if (!bulletText.includes(BEST_SELLERS_RANK_LABEL)) {
                continue;
            }
            const anchors = bulletItem.querySelectorAll('a');
            for (const anchor of anchors) {
                const parentText = anchor.parentElement?.textContent ?? '';
                const match = parentText.match(RANK_AND_CATEGORY_PATTERN);
                const absoluteHref = toAbsolute(anchor.getAttribute('href'));
                if (match === null || absoluteHref === null) {
                    continue;
                }
                pushMatchedResult(results, seen, match, absoluteHref, anchor.textContent ?? undefined);
            }
            const textMatch = bulletItem.innerText.match(INLINE_RANK_AND_CATEGORY_PATTERN);
            if (textMatch !== null) {
                pushMatchedResult(results, seen, textMatch, window.location.href);
            }
        }
    }
    function extractBsrLinks() {
        if (!isAmazonProductPage()) {
            setStoredLinks([]);
            return;
        }
        try {
            const results = [];
            const seen = new Set();
            extractFromProductDetails(results, seen);
            extractFromDetailBullets(results, seen);
            setStoredLinks(results);
            updateBadge();
        }
        catch (error) {
            console.error('BSR extraction failed:', error);
            setStoredLinks([]);
            updateBadge();
        }
    }
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        const incomingMessage = message;
        if (!isGetBsrDataRequest(incomingMessage)) {
            return;
        }
        sendResponse({
            isAmazonProductPage: isAmazonProductPage(),
            pageUrl: window.location.href,
            links: getStoredLinks()
        });
    });
    if (!isAmazonProductPage()) {
        return;
    }
    extractBsrLinks();
    const targetNode = document.getElementById(DETAIL_BULLETS_ID) ?? document.body;
    const observer = new MutationObserver(() => {
        if (extractionTimeout !== undefined) {
            window.clearTimeout(extractionTimeout);
        }
        extractionTimeout = window.setTimeout(() => {
            extractBsrLinks();
        }, EXTRACTION_DEBOUNCE_MS);
    });
    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });
})();
