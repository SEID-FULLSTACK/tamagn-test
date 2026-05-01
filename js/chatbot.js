/**
 * Global Tamagn Bet AI chat widget — same behavior as legacy index main.js handlers.
 * Mounts once; toggleChat / sendMessage stay on window for onclick compatibility.
 */

const PAGE_CONTEXT_MAP = {
    "banks.html":
        "The user is on the Bank Auctions & Services page. Prioritize bank property auctions, foreclosure sales, financing through banks, and how to bid or register.",
    "fhc.html":
        "The user is on the Federal Housing Corporation (FHC) page. Prioritize FHC programs, government housing listings, announcements, and official procedures.",
    "agent-portal.html":
        "The user is on the Agent Portal. Prioritize agent workflows, listings, leads, and professional use of Tamagn Bet.",
    "buy.html":
        "The user is browsing listings to buy properties. Prioritize search, filters, viewing homes, favorites, and next steps toward purchase or contact.",
    "sell.html":
        "The user is in the seller workspace. Prioritize posting listings, pricing, media, and seller responsibilities.",
    "dashboard.html":
        "The user is on their personal dashboard (saved homes, messages, account). Prioritize saved listings, chat, and account actions.",
    "login.html":
        "The user is on the login or sign-up page. Prioritize account access, roles (buyer/seller), and security basics.",
    "about.html":
        "The user is on the About page. Prioritize Tamagn Bet mission, team story, and trust.",
    "pricing.html":
        "The user is on the Pricing page. Prioritize plans, posting fees, and premium options.",
    "privacy.html": "The user is reading the Privacy Policy. Answer only within policy topics; defer legal specifics to the page content.",
    "terms.html": "The user is reading the Terms of Service. Answer only within terms topics; defer legal specifics to the page content.",
    "reserve.html":
        "The user is on the property reservation / posting flow. Prioritize listing submission steps and payment placeholders mentioned on the page.",
    "index.html":
        "The user is on the Tamagn Bet home page. Prioritize marketplace overview, featured areas, mortgage teaser, and navigation to buy/sell.",
};

/**
 * Express serves POST /chat on port 3000 by default (see server.js).
 * Live Server / static hosts (e.g. 127.0.0.1:5505) must call this URL, not origin/chat.
 */
const CHAT_API_LOCAL_NODE = "http://localhost:3000/chat";

function getChatUrl() {
    const override = typeof window.__TAMAGN_CHAT_API__ === "string" ? window.__TAMAGN_CHAT_API__.trim() : "";
    if (override) {
        return override;
    }

    if (window.location.protocol === "file:") {
        return CHAT_API_LOCAL_NODE;
    }

    const host = (window.location.hostname || "").toLowerCase();
    const port = window.location.port || "";
    const isLoopback = host === "localhost" || host === "127.0.0.1";

    if (isLoopback && port === "3000") {
        return `${window.location.origin}/chat`;
    }

    if (isLoopback && port !== "3000") {
        return CHAT_API_LOCAL_NODE;
    }

    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
        return `${window.location.origin}/chat`;
    }

    return CHAT_API_LOCAL_NODE;
}

function resolvePageFile() {
    const parts = window.location.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    let file = parts.length ? parts[parts.length - 1] : "index.html";
    if (!file.includes(".")) file = "index.html";
    return file.toLowerCase();
}

function resolvePageContext() {
    const fromBody = document.body?.dataset?.tamagnChatContext?.trim();
    if (fromBody) return fromBody;
    const file = resolvePageFile();
    return PAGE_CONTEXT_MAP[file] || `The user is on Tamagn Bet (page file: ${file}). Give concise real-estate help aligned with Tamagn Bet services.`;
}

const WIDGET_HTML = `
<div class="chatbot-wrapper" id="tamagn-chatbot-root" aria-live="polite">
    <div class="chat-box" id="chatBox">
        <div class="chat-header">
            <span>Tamagn-Bet AI</span>
            <button type="button" class="chat-close" aria-label="Close chat">&times;</button>
        </div>
        <div class="chat-body" id="chatBody">
            <div class="bot-msg" id="tamagnChatWelcome">Welcome! How can we help you today?</div>
        </div>
        <div class="chat-footer">
            <input type="text" id="chatInput" placeholder="Ask a question..." autocomplete="off" />
            <button type="button" class="send-btn" id="tamagnChatSendText">ላክ</button>
            <button type="button" class="send-icon" id="tamagnChatSendIcon" aria-label="Send message">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
        </div>
    </div>
    <button type="button" class="chat-trigger" id="tamagnChatTrigger" aria-label="Open chat">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </button>
</div>
`;

function mountWidget() {
    if (document.getElementById("tamagn-chatbot-root")) return;
    document.body.insertAdjacentHTML("beforeend", WIDGET_HTML);

    const input = document.getElementById("chatInput");
    input?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") window.sendMessage();
    });

    document.getElementById("tamagnChatTrigger")?.addEventListener("click", () => window.toggleChat());
    document.querySelector(".chat-close")?.addEventListener("click", () => window.toggleChat());
    document.getElementById("tamagnChatSendText")?.addEventListener("click", () => window.sendMessage());
    document.getElementById("tamagnChatSendIcon")?.addEventListener("click", () => window.sendMessage());
}

window.toggleChat = function toggleChat() {
    const chatBox = document.getElementById("chatBox");
    if (chatBox) chatBox.classList.toggle("active");
};

window.sendMessage = async function sendMessage() {
    const input = document.getElementById("chatInput");
    const bodyEl = document.getElementById("chatBody");

    if (!input || !bodyEl || !input.value.trim()) return;

    const userText = input.value.trim();

    const userDiv = document.createElement("div");
    userDiv.className = "user-msg";
    userDiv.textContent = userText;
    bodyEl.appendChild(userDiv);

    input.value = "";
    bodyEl.scrollTop = bodyEl.scrollHeight;

    const botDiv = document.createElement("div");
    botDiv.className = "bot-msg";
    botDiv.textContent = "በማሰብ ላይ...";
    bodyEl.appendChild(botDiv);

    const pageContext = resolvePageContext();

    try {
        const response = await fetch(getChatUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userText, pageContext }),
        });

        if (!response.ok) throw new Error(`Server Error: ${response.status}`);

        const data = await response.json();
        botDiv.textContent = data.reply || "ምንም ምላሽ የለም";
    } catch (error) {
        console.error("Fetch Error:", error);
        botDiv.textContent = "ይቅርታ፣ ከሰርቨሩ ጋር መገናኘት አልቻልኩም።";
    }

    bodyEl.scrollTop = bodyEl.scrollHeight;
    input.focus();
};

mountWidget();
