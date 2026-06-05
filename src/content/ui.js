(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	function formatSeconds(s) {
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${String(sec).padStart(2, '0')}`;
	}

	function formatReset(timeMs) {
		const diff = timeMs - Date.now();
		if (diff <= 0) return 'now';
		const min = Math.round(diff / 60000);
		if (min < 60) return `${min}m`;
		const h = Math.floor(min / 60);
		const m = min % 60;
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}

	class CounterUI {
		constructor() {
			this.headerContainer = null;
			this.tokenHeader = null;
			this.cacheDisplay = null;
			this.tokenBarFill = null;
			this.aiBarFill = null;
			this.lastCacheMs = null;
			this.site = null;
			this.lastThresholdLevel = null;
		}

		initialize() {
			this.site = CC.getCurrentSite();

			// Header
		this.headerContainer = document.createElement('div');
		this.headerContainer.className = 'cc-header';

		this.compactToggle = document.createElement('span');
		this.compactToggle.className = 'cc-compact-toggle';
		this.compactToggle.textContent = '−';
		this.compactToggle.title = 'Toggle compact mode';

		this.tokenHeader = document.createElement('span');
		this.cacheDisplay = document.createElement('span');

			// Usage Row
			this.usageRow = document.createElement('div');
			this.usageRow.className = 'cc-usage-row';

			// Token Used / Remaining
			this.tokenInfo = document.createElement('span');
			this.tokenInfo.className = 'cc-token-info';

			this.thresholdLabel = document.createElement('span');
			this.thresholdLabel.className = 'cc-threshold-label';

			const tokenBarContainer = document.createElement('div');
			tokenBarContainer.className = 'cc-bar';
			this.tokenBarFill = document.createElement('div');
			this.tokenBarFill.className = 'cc-bar-fill';
			tokenBarContainer.appendChild(this.tokenBarFill);

			this.historyDisplay = document.createElement('span');
		this.historyDisplay.className = 'cc-history-info';

		this.usageRow.append(this.tokenInfo, tokenBarContainer, this.thresholdLabel, this.historyDisplay);
		}

		attachHeader() {
			let anchor = null;
			if (this.site.name === 'Claude') {
				const trigger = document.querySelector(CC.DOM.CHAT_MENU_TRIGGER);
				if (trigger) anchor = trigger.closest(CC.DOM.CHAT_PROJECT_WRAPPER) || trigger.parentElement;
			}
			
			if (anchor) {
				this.headerContainer.classList.remove('cc-floating-header', 'cc-floating-row-header-offset');
				anchor.after(this.headerContainer);
			} else {
				this.headerContainer.classList.add('cc-floating-header');
				this.headerContainer.classList.add('cc-floating-row-header-offset');
				document.body.appendChild(this.headerContainer);
			}
		}

		attachUsageRow() {
			let container = null;
			if (this.site.name === 'Claude') {
				const dropdown = document.querySelector(CC.DOM.MODEL_SELECTOR_DROPDOWN);
				if (dropdown) container = dropdown.closest('[data-testid="chat-input-grid-container"]') || dropdown.parentElement;
			} else if (this.site.name === 'Grok') {
				const grokInput = document.querySelector('textarea');
				if (grokInput) container = grokInput.closest('.min-h-[44px]') || grokInput.closest('.flex-col') || grokInput.parentElement;
			}
			
			if (!container) {
				const inputs = Array.from(document.querySelectorAll('textarea, rich-textarea, [contenteditable="true"], #prompt-textarea, .chat-input'));
				let bestInput = null;
				let maxH = -1;
				for (const el of inputs) {
					const h = el.getBoundingClientRect().height;
					if (h > maxH && el.offsetParent !== null) { // Check visibility
						maxH = h;
						bestInput = el;
					}
				}
				if (bestInput) {
					container = bestInput.closest('form') || bestInput.parentElement;
				}
			}
			
			if (container) {
				this.usageRow.classList.remove('cc-floating-row');
				container.after(this.usageRow);
			} else {
				this.usageRow.classList.add('cc-floating-row');
				document.body.appendChild(this.usageRow);
			}
			this.loadCompactState();
		}

		setConversationMetrics({ totalTokens = 0, cachedUntil = null, unsupported = false } = {}) {
			const prefs = CC.prefs || {};
			const limit = this.site.contextLimit;
			const used = Math.min(totalTokens, limit);
			const pct = Math.min(100, Math.round((used / limit) * 100));
			const cost = (used / 1000) * (this.site.costPer1k || 0.01);

			const createLimitHTML = (l) => `<span class="cc-editable-limit" title="Click to edit max context limit">${l.toLocaleString()}</span>`;
			const createCostHTML = (c) => `<span class="cc-editable-cost" title="Click to edit cost per 1K tokens">$${c.toFixed(4)}</span>`;

			// Header
			if (unsupported) {
				this.tokenHeader.textContent = `Live token count not available for ${this.site.name}`;
				this.headerContainer.innerHTML = '';
				this.headerContainer.appendChild(this.tokenHeader);
				this.tokenInfo.innerHTML = `Context limit: ${createLimitHTML(limit)} tokens`;
				this.tokenBarFill.style.width = '0%';
				this.tokenBarFill.style.background = CC.COLORS.PROGRESS_FILL_DARK;
			} else {
				const costDisplay = (prefs.showCost !== false && cost > 0.0001) ? ` ~${createCostHTML(cost)}` : '';
				this.tokenHeader.innerHTML = `~${used.toLocaleString()} tokens${costDisplay}`;
				this.headerContainer.innerHTML = '';
				this.headerContainer.appendChild(this.compactToggle);
		this.headerContainer.appendChild(this.tokenHeader);

		this.compactToggle.onclick = () => this.toggleCompact();

				if (cachedUntil && Date.now() < cachedUntil) {
					this.lastCacheMs = cachedUntil;
					const secLeft = Math.ceil((cachedUntil - Date.now()) / 1000);
					this.cacheDisplay.innerHTML = ` cached for <span class="cc-cache-time">${formatSeconds(secLeft)}</span>`;
					this.headerContainer.appendChild(this.cacheDisplay);
				}

				// Token Used / Remaining
				this.tokenInfo.innerHTML = `Tokens: ${used.toLocaleString()} / ${createLimitHTML(limit)}`;
				this.tokenBarFill.style.width = `${pct}%`;

				// Threshold warnings
				const pctDecimal = pct / 100;
				if (prefs.showThreshold !== false) {
					let thresholdLevel = 'ok';
					let thresholdText = '';
					let barColor = CC.COLORS.PROGRESS_FILL_DARK;

					if (pctDecimal >= CC.THRESHOLDS.DANGER) {
						thresholdLevel = 'danger';
						thresholdText = '⚠ DANGER';
						barColor = CC.COLORS.RED_WARNING;
					} else if (pctDecimal >= CC.THRESHOLDS.CRITICAL) {
						thresholdLevel = 'critical';
						thresholdText = '⚠ CRITICAL';
						barColor = CC.COLORS.RED_WARNING;
					} else if (pctDecimal >= CC.THRESHOLDS.WARN) {
						thresholdLevel = 'warn';
						thresholdText = '⚠ WARNING';
						barColor = '#d4a017';
					}

					this.tokenBarFill.style.background = barColor;
					this.usageRow.className = `cc-usage-row cc-threshold-${thresholdLevel}`;
					this.thresholdLabel.textContent = thresholdText;
					this.thresholdLabel.style.display = thresholdText ? '' : 'none';

					// Fire notification on new threshold breach
					if (prefs.showNotifications !== false && thresholdLevel !== 'ok' && thresholdLevel !== this.lastThresholdLevel) {
						this.lastThresholdLevel = thresholdLevel;
						try {
							const n = new Notification(`AI Token Counter — ${thresholdLevel.toUpperCase()}`, {
								body: `${this.site.name}: ${pct}% context limit used (${used.toLocaleString()} / ${limit.toLocaleString()} tokens)`,
								icon: chrome.runtime.getURL('icons/icon128.png')
							});
							setTimeout(() => n.close(), 5000);
						} catch (_) {}
					}
					if (thresholdLevel === 'ok') this.lastThresholdLevel = null;
				} else {
					this.tokenBarFill.style.background = CC.COLORS.PROGRESS_FILL_DARK;
					this.usageRow.className = 'cc-usage-row';
					this.thresholdLabel.textContent = '';
					this.thresholdLabel.style.display = 'none';
				}
			}
			
			// Attach listener to editable limit
			const editSpan = this.tokenInfo.querySelector('.cc-editable-limit');
			if (editSpan) {
				editSpan.onclick = () => {
					const newLimitStr = prompt(`Enter new maximum context limit for ${this.site.name}:`, limit);
					if (newLimitStr !== null) {
						const newLimit = parseInt(newLimitStr.replace(/,/g, ''), 10);
						if (!isNaN(newLimit) && newLimit > 0) {
							chrome.storage.local.get('cc_custom_limits', (data) => {
								const overrides = data.cc_custom_limits || {};
								overrides[this.site.name] = newLimit;
								chrome.storage.local.set({ cc_custom_limits: overrides }, () => {
									this.site.contextLimit = newLimit;
									this.setConversationMetrics({ totalTokens, cachedUntil, unsupported });
								});
							});
						}
					}
				};
			}

			// Attach listener to editable cost
			const editCost = this.tokenHeader.querySelector('.cc-editable-cost');
			if (editCost) {
				editCost.onclick = (e) => {
					e.stopPropagation();
					const currentRate = this.site.costPer1k || 0.01;
					const newRateStr = prompt(`Enter cost per 1,000 tokens for ${this.site.name} (e.g. 0.015):`, currentRate);
					if (newRateStr !== null) {
						const newRate = parseFloat(newRateStr);
						if (!isNaN(newRate) && newRate >= 0) {
							chrome.storage.local.get('cc_custom_pricing', (data) => {
								const pricing = data.cc_custom_pricing || {};
								pricing[this.site.name] = newRate;
								chrome.storage.local.set({ cc_custom_pricing: pricing }, () => {
									this.site.costPer1k = newRate;
									this.setConversationMetrics({ totalTokens, cachedUntil, unsupported });
								});
							});
						}
					}
				};
			}
		}

		async toggleCompact() {
			this.usageRow.classList.toggle('cc-collapsed');
			this.compactToggle.textContent = this.usageRow.classList.contains('cc-collapsed') ? '+' : '−';
			try {
				const key = `cc_compact_${this.site.name}`;
				const data = await chrome.storage.local.get('cc_compact_states');
				const states = data.cc_compact_states || {};
				states[this.site.name] = this.usageRow.classList.contains('cc-collapsed');
				await chrome.storage.local.set({ cc_compact_states: states });
			} catch (_) {}
		}

		async loadCompactState() {
			try {
				const data = await chrome.storage.local.get('cc_compact_states');
				const states = data.cc_compact_states || {};
				if (states[this.site.name]) {
					this.usageRow.classList.add('cc-collapsed');
					this.compactToggle.textContent = '+';
				}
			} catch (_) {}
		}

		setHistoryStats({ totalTokens = 0, conversations = 0 } = {}) {
			if (totalTokens > 0) {
				this.historyDisplay.textContent = `Today: ${totalTokens.toLocaleString()} tokens (${conversations} convos)`;
				this.historyDisplay.style.display = '';
			} else {
				this.historyDisplay.style.display = 'none';
			}
		}

		tick() {
			if (this.lastCacheMs && this.lastCacheMs > Date.now()) {
				const sec = Math.ceil((this.lastCacheMs - Date.now()) / 1000);
				const el = this.cacheDisplay.querySelector('.cc-cache-time');
				if (el) el.textContent = formatSeconds(sec);
			} else if (this.lastCacheMs) {
				this.lastCacheMs = null;
				this.cacheDisplay.textContent = '';
			}
		}
	}

	CC.ui = { CounterUI };
})();