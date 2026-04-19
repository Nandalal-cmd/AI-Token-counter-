(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	function makeRequestId() {
		return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}

	class BridgeClient {
		constructor() {
			this._pending = new Map();

			// Inject bridge script directly into main page context to bypass isolated world barriers
			const script = document.createElement('script');
			script.src = chrome.runtime.getURL('src/content/bridge.js');
			script.onload = () => script.remove();
			(document.head || document.documentElement).appendChild(script);

			window.addEventListener('message', (event) => {
				if (event.source !== window) return;
				const data = event.data;
				if (!data || data.cc !== 'ClaudeCounter') return;

				if (data.type === 'cc:response') {
					const pending = this._pending.get(data.requestId);
					if (!pending) return;
					this._pending.delete(data.requestId);
					clearTimeout(pending.timeoutId);
					if (data.ok) pending.resolve(data.payload);
					else pending.reject(new Error(data.error || 'Failed'));
				}
			});
		}

		request(kind, payload, timeoutMs = 15000) {
			const requestId = makeRequestId();
			return new Promise((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					this._pending.delete(requestId);
					reject(new Error(`Timeout: ${kind}`));
				}, timeoutMs);

				this._pending.set(requestId, { resolve, reject, timeoutId });

				window.postMessage({
					cc: 'ClaudeCounter',
					type: 'cc:request',
					requestId,
					kind,
					payload
				}, '*');
			});
		}

		async requestConversation(orgId, conversationId) {
			return this.request('conversation', { orgId, conversationId }, 20000);
		}
	}

	CC.bridge = new BridgeClient();
})();