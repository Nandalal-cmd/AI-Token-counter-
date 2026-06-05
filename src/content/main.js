(async () => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});
	if (CC.__started) return;
	CC.__started = true;

	// Load limits asynchronously from storage
	await CC.getCurrentSiteAsync();

	// Load preferences
	try {
		const prefData = await chrome.storage.local.get('cc_preferences');
		CC.prefs = prefData.cc_preferences || {};
	} catch (_) {
		CC.prefs = {};
	}

	const ui = new CC.ui.CounterUI();
	ui.initialize();

	let currentConversationId = null;

	// Helper to recursively pull text breaking through Shadow DOM barriers
	function getDeepText(node) {
		let text = '';
		if (node.nodeType === Node.TEXT_NODE) {
			text += node.textContent + ' ';
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			if (node.tagName.toLowerCase() === 'script' || node.tagName.toLowerCase() === 'style') return '';
			if (node.shadowRoot) text += getDeepText(node.shadowRoot);
			for (const child of node.childNodes) {
				text += getDeepText(child);
			}
		}
		return text;
	}

	// Generic token scraper and token persistence tracker
	let lastGenericText = '';
	async function refreshGenericMetrics() {
		const site = CC.getCurrentSite();
		if (site.name === 'Claude') return; 

		let mainText = getDeepText(document.body) || '';
		
		const inputs = Array.from(document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"], rich-textarea, .chat-input'));
		for (const input of inputs) {
			if (input.value) mainText += '\n' + input.value;
			else if (input.isContentEditable) mainText += '\n' + input.textContent;
		}

		if (mainText.length === lastGenericText.length && mainText.length > 0) return;
		lastGenericText = mainText;

		let tokens = 0;
		if (CC.tokens && typeof CC.tokens.countTokens === 'function') {
			tokens = CC.tokens.countTokens(mainText);
		} else {
			tokens = Math.floor(mainText.length / 4);
		}
		
		// Remove roughly 150 generic noise tokens
		tokens = Math.max(0, tokens - 150);
		
		// Cache logic for persistence
		const urlKey = window.location.pathname;
		try {
			const data = await chrome.storage.local.get('cc_token_cache');
			const cache = data.cc_token_cache || {};
			const sessionData = cache[urlKey];

			// Validate if session expired based on AI provider
			if (sessionData && sessionData.lastUpdated) {
				const hoursSinceLast = (Date.now() - sessionData.lastUpdated) / 3600000;
				if (hoursSinceLast > site.sessionHours) {
					// Session timer expired, force reset to exactly what is scanned now
					delete cache[urlKey];
				}
			}
			
			// Retain historical high water mark for short term lazy loading resets
			if (cache[urlKey] && cache[urlKey].tokens > tokens) {
				tokens = cache[urlKey].tokens; // Recover lost tokens visually
			}
			
			// Save new high
			cache[urlKey] = { tokens, lastUpdated: Date.now() };
			await chrome.storage.local.set({ cc_token_cache: cache });
			
		} catch(e) { /* ignore storage errors */ }

		ui.setConversationMetrics({ totalTokens: tokens });
	}

	// Listen to user typing natively for immediate updates
	document.addEventListener('input', () => {
		if (CC.getCurrentSite().name !== 'Claude') {
			refreshGenericMetrics();
		}
	}, { passive: true, capture: true });

	async function refreshConversation() {
		const site = CC.getCurrentSite();
		if (site.name !== 'Claude') {
			refreshGenericMetrics();
			return;
		}

		if (!currentConversationId) {
			ui.setConversationMetrics({ unsupported: false, totalTokens: 0 });
			return;
		}

		try {
			const data = await CC.bridge.requestConversation('dummy-org', currentConversationId);
			if (data) {
				const metrics = await CC.tokens.computeConversationMetrics(data);
				ui.setConversationMetrics(metrics);
			}
		} catch (e) {
			console.warn('[AI Token Counter] Conversation fetch error:', e);
		}
	}

	function getConversationId() {
		const match = window.location.pathname.match(/\/chat\/([^/?]+)/);
		return match ? match[1] : null;
	}

	async function handleUrlChange() {
		currentConversationId = getConversationId();
		ui.attachHeader();
		ui.attachUsageRow();

		if (currentConversationId || CC.getCurrentSite().name !== 'Claude') {
			await refreshConversation();
		} else {
			ui.setConversationMetrics();
		}
	}

	// SPA robust DOM observer for attachment and generic counting
	let mutateTimeout = null;
	const observer = new MutationObserver(() => {
		clearTimeout(mutateTimeout);
		mutateTimeout = setTimeout(() => {
			// Ensure UI didn't detach in SPA route transitions
			if (!document.contains(ui.usageRow)) {
				ui.attachUsageRow();
			}
			if (!document.contains(ui.headerContainer)) {
				ui.attachHeader();
			}
			// Trigger local scraping
			if (CC.getCurrentSite().name !== 'Claude') {
				refreshGenericMetrics();
			}
		}, 1000);
	});
	observer.observe(document.body, { childList: true, subtree: true, characterData: true });

	// URL change detection
	let lastPath = window.location.pathname;
	const checkUrl = () => {
		if (window.location.pathname !== lastPath) {
			lastPath = window.location.pathname;
			handleUrlChange();
		}
	};

	function setupHistoryEvent(name) {
		const original = history[name];
		history[name] = function () {
			const result = original.apply(this, arguments);
			window.dispatchEvent(new Event(name.toLowerCase()));
			return result;
		};
	}

	setupHistoryEvent('pushState');
	setupHistoryEvent('replaceState');

	window.addEventListener('popstate', checkUrl);
	window.addEventListener('pushstate', checkUrl);
	window.addEventListener('replacestate', checkUrl);
	
	// Real-time backend conversation listener (Claude Native Network Overrides)
	window.addEventListener('message', async (event) => {
		if (event.source !== window || !event.data || event.data.cc !== 'ClaudeCounter') return;
		if (event.data.type === 'cc:conversation') {
			if (CC.getCurrentSite().name === 'Claude') {
				const data = event.data.payload.data;
				const metrics = await CC.tokens.computeConversationMetrics(data);
				ui.setConversationMetrics(metrics);
			}
		}
	});

	// Initial load
	handleUrlChange();

	// Usage history tracking
	async function trackUsage(tokens) {
		if (!tokens) return;
		try {
			const today = new Date().toISOString().slice(0, 10);
			const site = CC.getCurrentSite().name;
			const data = await chrome.storage.local.get('cc_usage_history');
			const history = data.cc_usage_history || {};
			if (!history[today]) history[today] = {};
			if (!history[today][site]) history[today][site] = { tokens: 0, conversations: 0 };
			history[today][site].tokens = Math.max(history[today][site].tokens, tokens);
			history[today][site].conversations++;
			await chrome.storage.local.set({ cc_usage_history: history });
			updateHistoryDisplay();
		} catch (_) {}
	}

	async function updateHistoryDisplay() {
		try {
			const today = new Date().toISOString().slice(0, 10);
			const data = await chrome.storage.local.get('cc_usage_history');
			const history = data.cc_usage_history || {};
			const todayData = history[today];
			if (todayData) {
				let totalTokens = 0;
				let totalConvs = 0;
				for (const siteData of Object.values(todayData)) {
					totalTokens += siteData.tokens || 0;
					totalConvs += siteData.conversations || 0;
				}
				ui.setHistoryStats({ totalTokens, conversations: totalConvs });
			}
		} catch (_) {}
	}

	// Track after each metric update
	const origSetMetrics = ui.setConversationMetrics.bind(ui);
	ui.setConversationMetrics = (metrics) => {
		origSetMetrics(metrics);
		if (metrics && metrics.totalTokens) trackUsage(metrics.totalTokens);
	};

	// Real-time tick for cache timer
	setInterval(() => {
		ui.tick();
	}, 1000);
})();