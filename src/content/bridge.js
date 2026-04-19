(() => {
	'use strict';

	const originalFetch = window.fetch;

	window.fetch = async (...args) => {
		const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
		const opts = args[1] || {};

		const response = await originalFetch.apply(window, args);

		// Intercept conversation data
		if (url.includes('/chat_conversations/') && url.includes('tree=')) {
			const match = url.match(/organizations\/([^/]+)\/chat_conversations\/([^/?]+)/);
			if (match) {
				try {
					const cloned = response.clone();
					const data = await cloned.json();
					window.postMessage({
						cc: 'ClaudeCounter',
						type: 'cc:conversation',
						payload: { orgId: match[1], conversationId: match[2], data }
					}, '*');
				} catch (e) {}
			}
		}

		return response;
	};

	// Handle requests from bridge-client
	window.addEventListener('message', async (event) => {
		if (event.source !== window || !event.data || event.data.cc !== 'ClaudeCounter') return;
		if (event.data.type !== 'cc:request') return;

		const { requestId, kind, payload } = event.data;

		try {
			if (kind === 'conversation' && payload.orgId && payload.conversationId) {
				let orgId = payload.orgId;
				if (orgId === 'dummy-org') {
					const orgRes = await originalFetch('https://claude.ai/api/organizations', { method: 'GET', credentials: 'include' });
					const orgs = await orgRes.json();
					if (orgs && orgs.length > 0) {
						orgId = orgs[0].uuid || orgs[0].id || orgs[0].organization_id;
					} else {
						throw new Error('No org found');
					}
				}
				const url = `https://claude.ai/api/organizations/${orgId}/chat_conversations/${payload.conversationId}?tree=true&rendering_mode=messages&render_all_tools=true`;
				const res = await originalFetch(url, { method: 'GET', credentials: 'include' });
				const json = await res.json();
				window.postMessage({ cc: 'ClaudeCounter', type: 'cc:response', requestId, ok: true, payload: json }, '*');
			}
		} catch (e) {
			window.postMessage({ cc: 'ClaudeCounter', type: 'cc:response', requestId, ok: false, error: e.message }, '*');
		}
	});
})();