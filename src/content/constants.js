(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	CC.DOM = Object.freeze({
		CHAT_MENU_TRIGGER: '[data-testid="chat-menu-trigger"]',
		MODEL_SELECTOR_DROPDOWN: '[data-testid="model-selector-dropdown"]',
		CHAT_PROJECT_WRAPPER: '.chat-project-wrapper'
	});

	CC.COLORS = Object.freeze({
		PROGRESS_FILL_DARK: '#2c84db',
		PROGRESS_FILL_LIGHT: '#5aa6ff',
		RED_WARNING: '#ce2029',
		BOLD_LIGHT: '#141413',
		BOLD_DARK: '#faf9f5'
	});

	CC.THRESHOLDS = Object.freeze({
		WARN: 0.80,
		CRITICAL: 0.90,
		DANGER: 0.95
	});

	CC.LIMIT_PRESETS = Object.freeze({
		'Claude':     [100000, 200000],
		'ChatGPT':    [32000, 128000],
		'Gemini':     [200000, 1000000],
		'Grok':       [131072],
		'Kimi':       [200000, 2000000],
		'Perplexity': [200000],
		'AI':         [200000]
	});
})();