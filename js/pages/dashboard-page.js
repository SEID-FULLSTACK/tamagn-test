import { byId, onClickActions, toggleClass } from "./page-utils.js";
import { createLanguageToggle } from "./i18n-utils.js";

function toggleSidebar() {
    toggleClass("sidebar", "active");
}

function showSection(id) {
    document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
    const section = byId(id);
    if (section) {
        section.classList.add("active");
    }
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
}

function deleteListing(btn) {
    if (confirm("እርግጠኛ ነዎት?")) btn.parentElement.parentElement.remove();
}

function editListing(btn) {
    const newName = prompt("አዲሱን ዝርዝር ያስገቡ:");
    if (newName) {
        btn.parentElement.parentElement.querySelector("span").innerText = newName;
    }
}

function sendMessage() {
    const input = byId("message-input");
    const history = byId("chat-history");
    if (input.value.trim() !== "") {
        const msg = document.createElement("div");
        msg.className = "message-bubble my-message";
        msg.innerText = input.value;
        history.appendChild(msg);
        input.value = "";
        history.scrollTop = history.scrollHeight;
    }
}

const translations = {
    am: {
        post_property: "+ ንብረት ይለጥፉ",
        dashboard: "ዳሽቦርድ",
        listings: "ንቁ ማስታወቂያዎች",
        saved: "የተቀመጡ ቤቶች",
        messages: "መልእክቶች",
        appointments: "የቀጠሮ ማሳወቂያ",
        loan: "ብድር ማስያ",
        auctions: "የባንክ ጨረታዎች",
        payments: "የክፍያ ታሪክ",
        logout: "Logout",
        welcome: "እንኳን ደህና መጡ!",
        views: "ዕይታዎች",
        leads: "ጥያቄዎች",
        active_assets: "ንቁ ንብረቶች",
        edit: "ማስተካከያ",
        delete: "ሰርዝ",
        sample_msg: "ሰላም! ይህ ቤት አሁንም ይገኛል?",
        chat_placeholder: "መልእክት ይጻፉ...",
        send: "ላክ",
        loan_amount: "የብድር መጠን",
        calculate: "አስላ",
        fhc: "የፌዴራል ቤቶች",
        fhc_news: "የቅርብ ጊዜ ማስታወቂያዎች",
        visit_official: "ኦፊሴላዊ ድረ-ገፅ ይጎብኙ",
        lang: "English"
    },
    en: {
        post_property: "+ Post Property",
        dashboard: "Dashboard",
        listings: "Active Listings",
        saved: "Saved Properties",
        messages: "Messages",
        appointments: "Appointments",
        loan: "Loan Calculator",
        auctions: "Bank Auctions",
        payments: "Payment History",
        logout: "Logout",
        welcome: "Welcome!",
        views: "Views",
        leads: "Leads",
        active_assets: "Active Assets",
        edit: "Edit",
        delete: "Delete",
        sample_msg: "Hi! Is this house still available?",
        chat_placeholder: "Type a message...",
        send: "Send",
        loan_amount: "Loan Amount",
        calculate: "Calculate",
        fhc: "Federal Housing",
        fhc_news: "Latest Announcements",
        visit_official: "Visit Official Website",
        lang: "አማርኛ"
    }
};

const { toggleLanguage } = createLanguageToggle({
    translations,
    toggleButtonId: "langBtn",
    selector: "[data-key]",
    keyAttribute: "data-key",
    getToggleButtonText: (language, dictionary) => dictionary[language].lang
});

onClickActions({
    "dashboard-toggle-sidebar": () => {
        toggleSidebar();
    },
    "dashboard-notification-alert": () => {
        alert("ምንም አዲስ ማሳወቂያ የለም");
    },
    "dashboard-toggle-language": () => {
        toggleLanguage();
    },
    "dashboard-navigate": ({ actionEl }) => {
        const href = actionEl.dataset.href;
        if (href) {
            window.location.href = href;
        }
    },
    "dashboard-show-section": ({ actionEl }) => {
        const sectionId = actionEl.dataset.sectionId;
        if (sectionId) {
            showSection(sectionId);
        }
    },
    "dashboard-logout-alert": () => {
        alert("Logged out!");
    },
    "dashboard-edit-listing": ({ actionEl }) => {
        editListing(actionEl);
    },
    "dashboard-delete-listing": ({ actionEl }) => {
        deleteListing(actionEl);
    },
    "dashboard-send-message": () => {
        sendMessage();
    },
    "dashboard-open-url": ({ actionEl }) => {
        const url = actionEl.dataset.url;
        if (url) {
            window.open(url, "_blank");
        }
    }
});
