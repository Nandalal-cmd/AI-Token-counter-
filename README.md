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

## ⚙️ How to Install & Run the Extension

Follow these simple steps to install the extension directly into your browser:

### Step 1: Download the Project
Download the source folder to your local system or clone this repository using Git:
```bash
git clone https://github.com/Nandalal-cmd/AI-Token-counter-.git
```

### Step 2: Access Extension Dashboard
1. Open your browser (Google Chrome, Microsoft Edge, or Brave).
2. Type `chrome://extensions/` into your URL address bar and press **Enter**.

### Step 3: Enable Developer Mode
In the top right corner of the Extensions dashboard, you will see a toggle switch labeled **Developer mode**. Click it to turn it **ON**.

### Step 4: Load the Extension
1. Once Developer Mode is enabled, three new buttons will appear in the top left corner.
2. Click the **Load unpacked** button.
3. A file browser window will pop up. Navigate to the folder you downloaded/cloned (`AI-Token-counter-`) and select it. 
*(Make sure you select the folder containing the `manifest.json` file).*

### Step 5: Pin & Run
1. The AI Token Counter is now installed natively in your browser!
2. Click the puzzle-piece icon 🧩 in the top right of your browser toolbar.
3. Find **AI Token Counter** in the list and click the **Pin** 📌 icon to keep it visible.
4. Navigate to any supported AI website (like Claude, Gemini, or ChatGPT). The token counter will automatically launch and place itself seamlessly below your chat input box in real-time!

## 💻 Tech Stack
- Manifest V3 Architecture
- Vanilla JS (ES6/ES8)
- Real-time `MutationObserver` routines
- No heavy frameworks (React/Vue), prioritizing instantaneous rendering speeds inside heavily bloated AI environments!

## 🤝 Contributing
Found a bug with a layout update or want to add a new AI provider? Feel free to open an issue or submit a pull request!


