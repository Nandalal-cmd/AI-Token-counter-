(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	const ROOT_MESSAGE_ID = '00000000-0000-4000-8000-000000000000';

	function getTokenizer() {
		return globalThis.GPTTokenizer_o200k_base || null;
	}

	function countTokens(text) {
		if (!text) return 0;
		const tokenizer = getTokenizer();
		try {
			return tokenizer?.countTokens(text) || 0;
		} catch {
			return 0;
		}
	}

	function buildTrunk(conversation) {
		const messages = Array.isArray(conversation?.chat_messages) ? conversation.chat_messages : [];
		const byId = new Map(messages.map(m => [m.uuid, m]));
		const leaf = conversation?.current_leaf_message_uuid;
		if (!leaf) return [];

		const trunk = [];
		let current = leaf;
		while (current && current !== ROOT_MESSAGE_ID) {
			const msg = byId.get(current);
			if (!msg) break;
			trunk.push(msg);
			current = msg.parent_message_uuid;
		}
		trunk.reverse();
		return trunk;
	}

	function stringifyMessage(msg) {
		if (!msg) return '';
		let text = '';

		if (Array.isArray(msg.content)) {
			for (const block of msg.content) {
				if (block.type === 'text' && block.text) {
					text += block.text + '\n';
				} else if (block.type === 'tool_use' || block.type === 'tool_result') {
					text += JSON.stringify(block) + '\n';
				}
			}
		} else if (typeof msg.content === 'string') {
			text = msg.content;
		}

		// Attachments
		if (Array.isArray(msg.attachments)) {
			for (const att of msg.attachments) {
				if (att.extracted_content) text += att.extracted_content + '\n';
			}
		}

		return text.trim();
	}

	async function computeConversationMetrics(conversation) {
		const trunk = buildTrunk(conversation);
		let totalTokens = 0;
		let charCount = 0;
		let wordCount = 0;
		let lastAssistantMs = null;

		for (const msg of trunk) {
			if (msg.sender === 'assistant' && msg.created_at) {
				const ms = Date.parse(msg.created_at);
				if (!lastAssistantMs || ms > lastAssistantMs) lastAssistantMs = ms;
			}

			const text = stringifyMessage(msg);
			totalTokens += countTokens(text);
			charCount += text.length;
			wordCount += text.split(/\s+/).filter(Boolean).length;
		}

		const cachedUntil = lastAssistantMs ? lastAssistantMs + (5 * 60 * 1000) : null;

		return { totalTokens, charCount, wordCount, cachedUntil };
	}

	CC.tokens = { computeConversationMetrics, countTokens };
})();