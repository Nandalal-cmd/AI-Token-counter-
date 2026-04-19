# AI Token Counter Extension 🚀

A powerful, universal Chrome extension designed to seamlessly track your context limits and token usage in real-time across the world's leading AI platforms. 

Never guess how close you are to your context limits again. The AI Token Counter automatically integrates a sleek, responsive usage tracker natively beneath the prompt boxes of your favorite AI interfaces.

## 🌟 Supported Platforms
- **Anthropic Claude** (`claude.ai`)
- **OpenAI ChatGPT** (`chatgpt.com`, `chat.openai.com`)
- **Google Gemini** (`gemini.google.com`)
- **Grok** (`grok.com`, `grok.x.ai`, `x.com`)
- **Kimi** (`kimi.com`, `kimi.moonshot.cn`)
- **Perplexity** (`perplexity.ai`)

## ✨ Key Features
* **Real-Time Client-Side Tokenization**: Computes tokens instantly offline directly inside your browser window using mathematical modeling built on the `o200k_base` standard.
* **Intelligent Shadow DOM Parsing**: Engineered with recursive Deep Node Traversal to bypass complex Web Components (like Google Gemini's `<rich-textarea>`), guaranteeing 100% accurate token scraping. 
* **Native Claude API Intercepts**: Passively listens to structural network payloads explicitly on Claude to calculate attached UI assets and invisible prompt markers automatically.
* **Customizable Limits via UI**: Did you upgrade to a pro plan? Simply click the context limit number directly on your screen and drag your limit up to 1,000,000+! Custom profiles instantly sync mapped directly to your `.storage.local` environment.
* **Persistent Session Memory (Lazy-Load Proof!)**: High-water-mark caching automatically remembers your longest conversational milestones on SPAs (Single Page Applications) so refreshing your browser tab will never accidentally reset your usage counter!

## ⚙️ How to Install (Chrome / Edge / Brave)

1. **Download/Clone this Repository**
   Download the source folder or run:
   ```bash
   git clone https://github.com/your-username/ai-token-counter.git
   ```
2. **Access Extension Dashboard** 
   Open your browser and navigate directly to your extensions panel by typing `chrome://extensions/` in the URL bar.
3. **Enable Developer Mode** 
   Flip the **Developer mode** toggle switch in the top right corner of the dashboard.
4. **Load the Extension**
   Click the **Load unpacked** button in the top left and select the folder you just downloaded containing the `manifest.json` file.

## 💻 Tech Stack
- Manifest V3 Architecture
- Vanilla JS (ES6/ES8)
- Real-time `MutationObserver` routines
- No heavy frameworks (React/Vue), prioritizing instantaneous rendering speeds inside heavily bloated AI environments!

## 🤝 Contributing
Found a bug with a layout update or want to add a new AI provider? Feel free to open an issue or submit a pull request!


