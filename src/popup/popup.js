(async () => {
	'use strict';

	const DEFAULTS = {
		'Claude':     { limit: 200000,  cost: 0.015 },
		'ChatGPT':    { limit: 128000,  cost: 0.010 },
		'Gemini':     { limit: 1000000, cost: 0.003 },
		'Grok':       { limit: 131072,  cost: 0.015 },
		'Kimi':       { limit: 2000000, cost: 0.003 },
		'Perplexity': { limit: 200000,  cost: 0.010 },
		'AI':         { limit: 200000,  cost: 0.010 }
	};

	const SITE_NAMES = Object.keys(DEFAULTS);

	function renderContainer(parentId, field, formatter) {
		const container = document.getElementById(parentId);
		container.innerHTML = '';
		for (const name of SITE_NAMES) {
			const row = document.createElement('div');
			row.className = 'site-row';

			const label = document.createElement('span');
			label.className = 'site-name';
			label.textContent = name;

			const input = document.createElement('input');
			input.className = 'site-input';
			input.type = 'text';
			input.dataset.site = name;
			input.dataset.field = field;
			input.value = formatter(DEFAULTS[name][field]);

			row.append(label, input);
			container.appendChild(row);
		}
	}

	function formatLimit(v) { return v.toLocaleString(); }
	function parseLimit(s) { return parseInt(s.replace(/,/g, ''), 10); }
	function formatCost(v) { return v.toFixed(4); }
	function parseCost(s) { return parseFloat(s); }

	renderContainer('limits-container', 'limit', formatLimit);
	renderContainer('pricing-container', 'cost', formatCost);

	// Load saved settings
	try {
		const data = await chrome.storage.local.get(['cc_custom_limits', 'cc_custom_pricing', 'cc_preferences']);
		const limits = data.cc_custom_limits || {};
		const pricing = data.cc_custom_pricing || {};
		const prefs = data.cc_preferences || {};

		if (prefs.showCost !== undefined) document.getElementById('toggleCost').checked = prefs.showCost;
		if (prefs.showThreshold !== undefined) document.getElementById('toggleThreshold').checked = prefs.showThreshold;
		if (prefs.showNotifications !== undefined) document.getElementById('toggleNotifications').checked = prefs.showNotifications;

		for (const name of SITE_NAMES) {
			const limInput = document.querySelector(`#limits-container input[data-site="${name}"]`);
			if (limInput && limits[name] != null) limInput.value = formatLimit(limits[name]);

			const costInput = document.querySelector(`#pricing-container input[data-site="${name}"]`);
			if (costInput && pricing[name] != null) costInput.value = formatCost(pricing[name]);
		}
	} catch (e) {
		console.warn('[Popup] Failed to load settings:', e);
	}

	// Save
	document.getElementById('saveBtn').addEventListener('click', async () => {
		try {
			const limits = {};
			const pricing = {};

			for (const name of SITE_NAMES) {
				const limInput = document.querySelector(`#limits-container input[data-site="${name}"]`);
				if (limInput) {
					const v = parseLimit(limInput.value);
					if (!isNaN(v) && v > 0) limits[name] = v;
				}
				const costInput = document.querySelector(`#pricing-container input[data-site="${name}"]`);
				if (costInput) {
					const v = parseCost(costInput.value);
					if (!isNaN(v) && v >= 0) pricing[name] = v;
				}
			}

			const prefs = {
				showCost: document.getElementById('toggleCost').checked,
				showThreshold: document.getElementById('toggleThreshold').checked,
				showNotifications: document.getElementById('toggleNotifications').checked
			};

			await chrome.storage.local.set({
				cc_custom_limits: limits,
				cc_custom_pricing: pricing,
				cc_preferences: prefs
			});

			const status = document.getElementById('status');
			status.textContent = 'Settings saved! Reload the AI page to apply.';
			setTimeout(() => { status.textContent = ''; }, 3000);
		} catch (e) {
			document.getElementById('status').textContent = 'Error saving: ' + e.message;
		}
	});

	// Reset to defaults
	document.getElementById('resetBtn').addEventListener('click', async () => {
		try {
			await chrome.storage.local.remove(['cc_custom_limits', 'cc_custom_pricing', 'cc_preferences']);
			renderContainer('limits-container', 'limit', formatLimit);
			renderContainer('pricing-container', 'cost', formatCost);
			document.getElementById('toggleCost').checked = true;
			document.getElementById('toggleThreshold').checked = true;
			document.getElementById('toggleNotifications').checked = true;
			document.getElementById('status').textContent = 'Reset to defaults.';
			setTimeout(() => { document.getElementById('status').textContent = ''; }, 2000);
		} catch (e) {
			document.getElementById('status').textContent = 'Error: ' + e.message;
		}
	});
})();
