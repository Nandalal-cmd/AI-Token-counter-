(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	CC.SITES = {
		'claude.ai':     { name: 'Claude',     contextLimit: 200000,  sessionHours: 5,  supportsCache: true },
		'chatgpt.com':   { name: 'ChatGPT',    contextLimit: 128000,  sessionHours: 3,  supportsCache: false },
		'chat.openai.com':{ name: 'ChatGPT',   contextLimit: 128000,  sessionHours: 3,  supportsCache: false },
		'gemini.google.com': { name: 'Gemini', contextLimit: 1000000, sessionHours: 5,  supportsCache: false },
		'grok.com':      { name: 'Grok',       contextLimit: 131072,  sessionHours: 9,  supportsCache: false },
		'grok.x.ai':     { name: 'Grok',       contextLimit: 131072,  sessionHours: 9,  supportsCache: false },
		'x.com':         { name: 'Grok',       contextLimit: 131072,  sessionHours: 9,  supportsCache: false },
		'kimi.com':      { name: 'Kimi',       contextLimit: 2000000, sessionHours: 24, supportsCache: false },
		'kimi.moonshot.cn': { name: 'Kimi',    contextLimit: 2000000, sessionHours: 24, supportsCache: false },
		'perplexity.ai': { name: 'Perplexity', contextLimit: 200000,  sessionHours: 24, supportsCache: false }
	};

	CC.getCurrentSiteAsync = async () => {
		const host = window.location.hostname;
		let siteConfig = { name: 'AI', contextLimit: 200000, sessionHours: 5, supportsCache: false };
		
		for (const [domain, config] of Object.entries(CC.SITES)) {
			if (host.includes(domain)) {
				siteConfig = { domain, ...config };
				break;
			}
		}

		try {
			const overrides = await chrome.storage.local.get('cc_custom_limits');
			if (overrides && overrides.cc_custom_limits && overrides.cc_custom_limits[siteConfig.name]) {
				siteConfig.contextLimit = overrides.cc_custom_limits[siteConfig.name];
			}
		} catch (e) {
			console.warn('[AI Token Counter] Failed to read custom limits from storage:', e);
		}

		return siteConfig;
	};

	// Keep synchronous method for generic safe access early on if needed
	CC.getCurrentSite = () => {
		const host = window.location.hostname;
		for (const [domain, config] of Object.entries(CC.SITES)) {
			if (host.includes(domain)) return { domain, ...config };
		}
		return { name: 'AI', contextLimit: 200000, sessionHours: 5, supportsCache: false };
	};
})();