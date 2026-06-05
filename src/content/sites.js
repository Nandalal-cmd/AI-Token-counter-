(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	CC.SITES = {
		'claude.ai':     { name: 'Claude',     contextLimit: 200000,  sessionHours: 5,  supportsCache: true,  costPer1k: 0.015 },
		'chatgpt.com':   { name: 'ChatGPT',    contextLimit: 128000,  sessionHours: 3,  supportsCache: false, costPer1k: 0.010 },
		'chat.openai.com':{ name: 'ChatGPT',   contextLimit: 128000,  sessionHours: 3,  supportsCache: false, costPer1k: 0.010 },
		'gemini.google.com': { name: 'Gemini', contextLimit: 1000000, sessionHours: 5,  supportsCache: false, costPer1k: 0.003 },
		'grok.com':      { name: 'Grok',       contextLimit: 131072,  sessionHours: 9,  supportsCache: false, costPer1k: 0.015 },
		'grok.x.ai':     { name: 'Grok',       contextLimit: 131072,  sessionHours: 9,  supportsCache: false, costPer1k: 0.015 },
		'x.com':         { name: 'Grok',       contextLimit: 131072,  sessionHours: 9,  supportsCache: false, costPer1k: 0.015 },
		'kimi.com':      { name: 'Kimi',       contextLimit: 2000000, sessionHours: 24, supportsCache: false, costPer1k: 0.003 },
		'kimi.moonshot.cn': { name: 'Kimi',    contextLimit: 2000000, sessionHours: 24, supportsCache: false, costPer1k: 0.003 },
		'perplexity.ai': { name: 'Perplexity', contextLimit: 200000,  sessionHours: 24, supportsCache: false, costPer1k: 0.010 }
	};

	CC.getCurrentSiteAsync = async () => {
		const host = window.location.hostname;
		let siteConfig = { name: 'AI', contextLimit: 200000, sessionHours: 5, supportsCache: false, costPer1k: 0.01 };
		
		for (const [domain, config] of Object.entries(CC.SITES)) {
			if (host.includes(domain)) {
				siteConfig = { domain, ...config };
				break;
			}
		}

		try {
			const data = await chrome.storage.local.get(['cc_custom_limits', 'cc_custom_pricing']);
			if (data.cc_custom_limits && data.cc_custom_limits[siteConfig.name]) {
				siteConfig.contextLimit = data.cc_custom_limits[siteConfig.name];
			}
			if (data.cc_custom_pricing && data.cc_custom_pricing[siteConfig.name] != null) {
				siteConfig.costPer1k = data.cc_custom_pricing[siteConfig.name];
			}
		} catch (e) {
			console.warn('[AI Token Counter] Failed to read custom settings from storage:', e);
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