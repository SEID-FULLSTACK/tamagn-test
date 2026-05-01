import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, or, query, serverTimestamp, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, db } from "../core/firebase.js";
import { byId, onClickActions, setDisplay } from "./page-utils.js";
import { createLanguageToggle } from "./i18n-utils.js";
import { mountHybridMortgageCalculator } from "../hybrid-mortgage-calculator.js";
import { ensurePropertyStatusBadgeStyles, renderPropertyStatusBadge } from "../utils/ui-helpers.js";
import { resolveListingImageUrl, escapeAttrUrl, listingImageOnerrorAttr } from "../listing-image-utils.js";

let currentUser = auth.currentUser;
let currentListings = [];
let currentSavedListings = [];
let hasResolvedInitialAuth = false;

const sidebar = byId("sidebar");
const listingsList = byId("listings-list");
const listingsLoading = byId("listings-loading");
const listingsError = byId("listings-error");
const listingsSuccess = byId("listings-success");
const listingsEmpty = byId("listings-empty");
const savedLoading = byId("saved-loading");
const savedError = byId("saved-error");
const savedEmpty = byId("saved-empty");
const savedList = byId("saved-list");
const activeAssetsCount = byId("active-assets-count");
const profilePhoto = document.querySelector(".profile-photo");
let listingsSuccessTimer = null;

/** Must match buy.html heart favorites key */
const FAVORITES_LOCAL_STORAGE_KEY = "tamagn_favorite_listing_ids";

function readFavoriteIdsFromLocalStorage() {
    try {
        const raw = localStorage.getItem(FAVORITES_LOCAL_STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(arr) ? arr : []);
    } catch {
        return new Set();
    }
}

function toggleSidebar() {
    if (!sidebar) {
        return;
    }
    if (window.matchMedia("(min-width: 768px)").matches) {
        sidebar.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        return;
    }
    sidebar.classList.toggle("is-open");
    const open = sidebar.classList.contains("is-open");
    const backdrop = byId("sidebar-backdrop");
    if (backdrop) {
        backdrop.classList.toggle("opacity-0", !open);
        backdrop.classList.toggle("pointer-events-none", !open);
    }
}

function showCalculatorOnOverview() {
    showSection("overview", { skipMobileSync: true });
    const anchor = byId("dashboard-hybrid-calculator-anchor");
    if (anchor) {
        window.requestAnimationFrame(() => {
            anchor.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }
    syncDashboardMobileNav("calculator");
}

function syncDashboardMobileNav(kind, sectionId) {
    const inner = document.querySelector(".tb-mobile-nav__inner");
    if (!inner) {
        return;
    }
    inner.querySelectorAll(".tb-mobile-nav__active").forEach((el) => el.classList.remove("tb-mobile-nav__active"));
    if (kind === "calculator") {
        inner.querySelector("[data-nav-active=\"calculator\"]")?.classList.add("tb-mobile-nav__active");
        return;
    }
    if (sectionId) {
        inner.querySelector(`[data-section-id="${sectionId}"]`)?.classList.add("tb-mobile-nav__active");
    }
}

function showSection(id, options = {}) {
    document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
    const section = byId(id);
    if (section) {
        section.classList.add("active");
    }
    if (!options.skipMobileSync) {
        syncDashboardMobileNav("section", id);
    }
    if (window.innerWidth < 768 && sidebar?.classList.contains("is-open")) {
        toggleSidebar();
    }
}

function sendMessage() {
    const input = byId("message-input");
    const history = byId("chat-history");
    if (!input || !history) {
        return;
    }

    if (input.value.trim() !== "") {
        const msg = document.createElement("div");
        msg.className =
            "message-bubble my-message w-fit max-w-[85%] self-end rounded-2xl rounded-br-md bg-zillow px-4 py-2 text-sm font-medium text-white shadow-sm";
        msg.innerText = input.value.trim();
        history.appendChild(msg);
        input.value = "";
        history.scrollTop = history.scrollHeight;
    }
}

function escapeHtml(value) {
    const text = String(value ?? "");
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function toMillis(value) {
    if (!value) {
        return 0;
    }
    if (typeof value.toMillis === "function") {
        return value.toMillis();
    }
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function isOwnedByCurrentUser(listing, user = currentUser) {
    const uid = user?.uid;
    if (!uid || !listing) {
        return false;
    }

    return listing.userId === uid || listing.ownerId === uid;
}

function isSavedByCurrentUser(listing, user = currentUser) {
    const uid = user?.uid;
    if (!uid || !listing) {
        return false;
    }

    const normalizedStatus = String(listing.status || "").toLowerCase();
    if (normalizedStatus === "saved" || listing.scope === "saved" || listing.saved === true || listing.isSaved === true) {
        return true;
    }

    if (listing.savedBy === uid || listing.savedUserId === uid || listing.savedOwnerId === uid) {
        return true;
    }

    if (Array.isArray(listing.savedBy) && listing.savedBy.includes(uid)) {
        return true;
    }

    return false;
}

function isListingInUserFavorites(listing, user = currentUser) {
    if (!listing?.id) {
        return false;
    }
    if (isSavedByCurrentUser(listing, user)) {
        return true;
    }
    return readFavoriteIdsFromLocalStorage().has(listing.id);
}

function formatPrice(price) {
    const parsed = Number(price);
    if (Number.isNaN(parsed)) {
        return "--- ETB";
    }

    return `${parsed.toLocaleString()} ETB`;
}

const translations = {
    am: {
        post_property: "+ ንብረት ይለጥፉ",
        dashboard: "ዳሽቦርድ",
        listings: "የእኔ ማስታወቂያዎች",
        saved: "የተቀመጡ ቤቶች",
        messages: "መልእክቶች",
        appointments: "የቀጠሮ ማሳወቂያ",
        loan: "ብድር ማስያ",
        budget_calculator: "የበጀት ካልኩሌተር",
        budget_calculator_heading: "የበጀት እና የብድር ካልኩሌተር",
        budget_calculator_sub: "መደበኛ እና ከወለድ ነፃ (ሙራባሐ) ግምቶች።",
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
        lang: "English",
        loading_listings: "ንብረቶች በመጫን ላይ...",
        loading_failed: "የንብረት ዝርዝር መጫን አልተቻለም። እባክዎ ደግመው ይሞክሩ።",
        retry: "ደግመው ይሞክሩ",
        no_listings_title: "ምንም ንብረት አልተገኘም",
        no_listings_message: "እስካሁን የለጠፉት ንብረት የለም።",
        create_listing_cta: "የመጀመሪያ ንብረትዎን ይለጥፉ",
        no_saved_title: "ምንም የተቀመጠ ንብረት አልተገኘም",
        no_saved_message: "እስካሁን የተቀመጠ ንብረት የለም።",
        browse_properties_cta: "ንብረቶችን ያስሱ",
        loading_saved: "የተቀመጡ ንብረቶች በመጫን ላይ...",
        loading_saved_failed: "የተቀመጡ ንብረቶችን መጫን አልተቻለም።",
        status_selling: "ሽያጭ",
        status_renting: "ኪራይ",
        status_sold: "ተሽጧል",
        mark_as_sold: "ተሽጧል ምልክት አድርግ",
        already_sold: "ተሽጧል",
        mark_sold_success: "ንብረቱ በተሳካ ሁኔታ 'ተሽጧል' ተብሎ ተዘምኗል።",
        mark_sold_failed: "ንብረቱን እንደ 'ተሽጧል' ማዘመን አልተቻለም።",
        already_sold_message: "ይህ ንብረት አስቀድሞ ተሽጧል።",
        auth_required_title: "ወደ ዳሽቦርድ ለመግባት ይግቡ",
        auth_required_message: "የእርስዎን ንብረቶች ለማየት እባክዎ ወደ መለያዎ ይግቡ።",
        go_login: "ወደ Login ገጽ ሂድ",
        listed_on: "የተለጠፈበት",
        location_unknown: "ቦታ አልተገለጸም",
        title_unknown: "ያልተሰየመ ንብረት",
        date_unknown: "ያልታወቀ",
        delete_confirm: "ይህን ንብረት መሰረዝ እርግጠኛ ነዎት?",
        delete_success: "ንብረቱ በተሳካ ሁኔታ ተሰርዟል።",
        delete_failed: "ንብረቱን መሰረዝ አልተቻለም።",
        not_allowed: "የራስዎን ንብረት ብቻ ማስተካከል/መሰረዝ ይችላሉ።",
        no_notifications: "ምንም አዲስ ማሳወቂያ የለም",
        logged_out: "ተሳክቷል ወጥተዋል።",
        close_menu: "ዝጋ",
        overview_sub: "የእርስዎ የግል የሪል እስቴት ዳሽቦርድ።",
        card_saved_searches_title: "የተቀመጡ ፍለጋዎች",
        card_saved_searches_desc: "የቅርብ ጊዜ ማጣሪያዎን እንደገና ይቀጥሉ።",
        card_cta: "ክፈት",
        card_favorites_title: "የምትወዷቸው",
        card_favorites_desc: "የመረጧቸው ቤቶች በአንድ ቦታ።",
        card_cta_fav: "የተወደዱን ይመልከቱ",
        card_account_title: "የመለያ ቅንብሮች",
        card_account_desc: "መገለጫ፣ ደህንነት እና ማሳወቂያዎች።",
        card_cta_acct: "መለያ ያቀናብሩ",
        saved_searches_nav: "የተቀመጡ ፍለጋዎች",
        account_nav: "መለያ",
        saved_searches_heading: "የተቀመጡ ፍለጋዎች",
        saved_searches_placeholder: "ገና የተቀመጠ ፍለጋ የለም። ንብረት በ«ግዛ» ገጽ ይፈልጉ (በቅርቡ እዚህ ይቀመጣል)።",
        browse_buy: "ንብረቶች ያስሱ",
        account_heading: "የመለያ ቅንብሮች",
        account_profile: "መገለጫ",
        account_profile_desc: "የመግቢያ ኢሜይል",
        account_security: "ደህንነት",
        account_security_desc: "የይለፍ ቃል ለመቀየር ወደ መግቢያ ይሂዱ።",
        nav_home: "መነሻ",
        nav_listings: "ማስታወቂያ",
        nav_saved: "የተቀመጡ",
        nav_messages: "ጽሁፍ",
        nav_menu: "ማውጫ",
        nav_budget: "በጀት",
        appointments_placeholder: "የቀጠሮ የለም።",
        auctions_placeholder: "የባንክ ጨረታ ግብዣዎች ይመልከቱ።",
        payments_placeholder: "ምንም ክፍያ አልተመዘገበም።"
    },
    en: {
        post_property: "+ Post Property",
        dashboard: "Dashboard",
        listings: "My Listings",
        saved: "Saved Properties",
        messages: "Messages",
        appointments: "Appointments",
        loan: "Loan Calculator",
        budget_calculator: "Budget Calculator",
        budget_calculator_heading: "Budget & loan calculator",
        budget_calculator_sub: "Conventional and interest-free (Murabaha-style) estimates.",
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
        lang: "አማርኛ",
        loading_listings: "Loading listings...",
        loading_failed: "Failed to load listings. Please try again.",
        retry: "Retry",
        no_listings_title: "No listings found",
        no_listings_message: "You have not posted any property yet.",
        create_listing_cta: "Post your first property",
        no_saved_title: "No saved properties found",
        no_saved_message: "You have not saved any property yet.",
        browse_properties_cta: "Browse properties",
        loading_saved: "Loading saved properties...",
        loading_saved_failed: "Failed to load saved properties.",
        status_selling: "Selling",
        status_renting: "Renting",
        status_sold: "Sold",
        mark_as_sold: "Mark as Sold",
        already_sold: "Sold",
        mark_sold_success: "Listing updated to sold successfully.",
        mark_sold_failed: "Failed to update listing status to sold.",
        already_sold_message: "This listing is already marked as sold.",
        auth_required_title: "Login required",
        auth_required_message: "Please log in to view and manage your listings.",
        go_login: "Go to Login",
        listed_on: "Listed on",
        location_unknown: "Location not specified",
        title_unknown: "Untitled property",
        date_unknown: "Unknown",
        delete_confirm: "Are you sure you want to delete this listing?",
        delete_success: "Listing deleted successfully.",
        delete_failed: "Failed to delete listing.",
        not_allowed: "You can only manage your own listings.",
        no_notifications: "No new notifications",
        logged_out: "You have been logged out.",
        close_menu: "Close",
        overview_sub: "Your personalized real estate command center.",
        card_saved_searches_title: "Saved searches",
        card_saved_searches_desc: "Resume your latest filters and alerts.",
        card_cta: "Open",
        card_favorites_title: "Favorites",
        card_favorites_desc: "Homes you love, synced and ready to compare.",
        card_cta_fav: "View favorites",
        card_account_title: "Account settings",
        card_account_desc: "Profile, security, and notification preferences.",
        card_cta_acct: "Manage account",
        saved_searches_nav: "Saved searches",
        account_nav: "Account",
        saved_searches_heading: "Saved searches",
        saved_searches_placeholder: "No saved searches yet. Run a search on the Buy page, then save it here (coming soon).",
        browse_buy: "Browse properties",
        account_heading: "Account settings",
        account_profile: "Profile",
        account_profile_desc: "Signed-in email",
        account_security: "Security",
        account_security_desc: "Use login to change password or connect Google.",
        nav_home: "Home",
        nav_listings: "Listings",
        nav_saved: "Saved",
        nav_messages: "Chat",
        nav_menu: "Menu",
        nav_budget: "Budget",
        appointments_placeholder: "No upcoming appointments.",
        auctions_placeholder: "Connect to bank auction feeds from your region.",
        payments_placeholder: "No payments recorded."
    }
};

const { toggleLanguage, refreshUI, getCurrentLanguage } = createLanguageToggle({
    translations,
    toggleButtonId: "langBtn",
    selector: "[data-key]",
    keyAttribute: "data-key",
    getToggleButtonText: (language, dictionary) => dictionary[language].lang
});

let hybridMortgageCalc = null;

function t(key) {
    const language = getCurrentLanguage();
    return translations[language]?.[key] ?? translations.am[key] ?? key;
}

function formatListingDate(createdAt) {
    const millis = toMillis(createdAt);
    if (!millis) {
        return t("date_unknown");
    }

    const locale = getCurrentLanguage() === "en" ? "en-US" : "am-ET";
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(new Date(millis));
}

function updateActiveAssetsCount() {
    if (activeAssetsCount) {
        activeAssetsCount.innerText = String(currentListings.length);
    }
}

function hideFeedbackBlocks() {
    setDisplay(listingsError, "none");
    setDisplay(listingsEmpty, "none");
}

function hideListingsSuccess() {
    if (!listingsSuccess) {
        return;
    }
    setDisplay(listingsSuccess, "none");
}

function showListingsLoading(isLoading) {
    if (!listingsLoading) {
        return;
    }
    listingsLoading.innerText = t("loading_listings");
    setDisplay(listingsLoading, isLoading ? "block" : "none");
}

function showListingsError(message) {
    if (!listingsError) {
        return;
    }

    listingsError.innerHTML = `
        <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">${escapeHtml(message)}</div>
        <button type="button" class="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-zillow ring-2 ring-zillow transition hover:bg-zillow-light" data-action="dashboard-retry-listings">${escapeHtml(t("retry"))}</button>
    `;
    setDisplay(listingsError, "block");
}

function hideSavedFeedback() {
    setDisplay(savedError, "none");
    setDisplay(savedEmpty, "none");
}

function showSavedLoading(isLoading) {
    if (!savedLoading) {
        return;
    }

    savedLoading.innerText = t("loading_saved");
    setDisplay(savedLoading, isLoading ? "block" : "none");
}

function showSavedError(message) {
    if (!savedError) {
        return;
    }

    savedError.innerHTML = `
        <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">${escapeHtml(message)}</div>
        <button type="button" class="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-zillow ring-2 ring-zillow transition hover:bg-zillow-light" data-action="dashboard-retry-saved">${escapeHtml(t("retry"))}</button>
    `;
    setDisplay(savedError, "block");
}

function showListingsSuccess(message) {
    if (!listingsSuccess) {
        return;
    }

    listingsSuccess.innerText = message;
    setDisplay(listingsSuccess, "block");

    if (listingsSuccessTimer) {
        window.clearTimeout(listingsSuccessTimer);
    }
    listingsSuccessTimer = window.setTimeout(() => {
        hideListingsSuccess();
    }, 3000);
}

function renderAuthRequiredState() {
    if (!listingsEmpty) {
        return;
    }
    hideFeedbackBlocks();
    hideListingsSuccess();
    listingsList.innerHTML = "";
    listingsEmpty.innerHTML = `
        <div class="text-center">
            <i class="fa-solid fa-user-lock text-3xl text-slate-300" aria-hidden="true"></i>
            <h3 class="mt-4 text-lg font-bold text-slate-900">${escapeHtml(t("auth_required_title"))}</h3>
            <p class="mt-2 text-sm text-slate-600">${escapeHtml(t("auth_required_message"))}</p>
            <a href="login.html" class="mt-6 inline-flex rounded-full bg-zillow px-6 py-3 text-sm font-bold text-white shadow hover:bg-zillow-dark">${escapeHtml(t("go_login"))}</a>
        </div>`;
    setDisplay(listingsEmpty, "block");
    updateActiveAssetsCount();
}

function renderEmptyListingsState() {
    if (!listingsEmpty) {
        return;
    }
    hideFeedbackBlocks();
    hideListingsSuccess();
    listingsList.innerHTML = "";
    listingsEmpty.innerHTML = `
        <div class="text-center">
            <i class="fa-solid fa-building-circle-xmark text-3xl text-slate-300" aria-hidden="true"></i>
            <h3 class="mt-4 text-lg font-bold text-slate-900">${escapeHtml(t("no_listings_title"))}</h3>
            <p class="mt-2 text-sm text-slate-600">${escapeHtml(t("no_listings_message"))}</p>
            <a href="sell.html" class="mt-6 inline-flex rounded-full bg-zillow px-6 py-3 text-sm font-bold text-white shadow hover:bg-zillow-dark">${escapeHtml(t("create_listing_cta"))}</a>
        </div>`;
    setDisplay(listingsEmpty, "block");
    updateActiveAssetsCount();
}

function renderSavedEmptyState() {
    if (!savedEmpty) {
        return;
    }

    hideSavedFeedback();
    if (savedList) {
        savedList.innerHTML = "";
    }

    savedEmpty.innerHTML = `
        <div class="text-center">
            <i class="fa-regular fa-heart text-3xl text-slate-300" aria-hidden="true"></i>
            <h3 class="mt-4 text-lg font-bold text-slate-900">${escapeHtml(t("no_saved_title"))}</h3>
            <p class="mt-2 text-sm text-slate-600">${escapeHtml(t("no_saved_message"))}</p>
            <a href="buy.html" class="mt-6 inline-flex rounded-full bg-zillow px-6 py-3 text-sm font-bold text-white shadow hover:bg-zillow-dark">${escapeHtml(t("browse_properties_cta"))}</a>
        </div>`;
    setDisplay(savedEmpty, "block");
}

function renderListingsCards() {
    if (!listingsList) {
        return;
    }

    if (!currentUser) {
        renderAuthRequiredState();
        return;
    }

    if (currentListings.length === 0) {
        renderEmptyListingsState();
        return;
    }

    hideFeedbackBlocks();

    listingsList.innerHTML = currentListings
        .map((listing) => {
            const title = escapeHtml(listing.title || t("title_unknown"));
            const location = escapeHtml(listing.location || t("location_unknown"));
            const imageUrl = escapeAttrUrl(resolveListingImageUrl(listing));
            const price = escapeHtml(formatPrice(listing.price));
            const listedOn = escapeHtml(formatListingDate(listing.createdAt));
            const isSold = String(listing.status || "").toLowerCase() === "sold";
            const statusBadge = renderPropertyStatusBadge(listing.status, {
                labels: {
                    selling: t("status_selling"),
                    renting: t("status_renting"),
                    sold: t("status_sold")
                }
            });

            return `
                <article class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    ${statusBadge}
                    <div class="relative aspect-[16/10] overflow-hidden bg-slate-100">
                        <img src="${imageUrl}" alt="${title}" ${listingImageOnerrorAttr()} class="relative z-0 block h-full w-full object-cover opacity-100 transition duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                    </div>
                    <div class="flex flex-1 flex-col p-4 sm:p-5">
                        <p class="text-xl font-extrabold text-slate-900 sm:text-2xl">${price}</p>
                        <h3 class="mt-2 line-clamp-2 text-base font-bold text-slate-900">${title}</h3>
                        <p class="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">${location}</p>
                        <p class="mt-2 text-xs font-medium text-slate-500">${escapeHtml(t("listed_on"))}: ${listedOn}</p>
                        <div class="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                            <button type="button" class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50" data-action="dashboard-mark-sold" data-listing-id="${listing.id}" ${isSold ? "disabled aria-disabled='true'" : ""}>
                                ${escapeHtml(isSold ? t("already_sold") : t("mark_as_sold"))}
                            </button>
                            <button type="button" class="rounded-lg border-2 border-zillow bg-zillow-light px-3 py-2 text-xs font-bold text-zillow transition hover:bg-zillow hover:text-white" data-action="dashboard-edit-listing" data-listing-id="${listing.id}">
                                ${escapeHtml(t("edit"))}
                            </button>
                            <button type="button" class="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700" data-action="dashboard-delete-listing" data-listing-id="${listing.id}">
                                ${escapeHtml(t("delete"))}
                            </button>
                        </div>
                    </div>
                </article>
            `;
        })
        .join("");

    updateActiveAssetsCount();
}

function renderSavedCards() {
    if (!savedList) {
        return;
    }

    if (currentSavedListings.length === 0) {
        renderSavedEmptyState();
        return;
    }

    hideSavedFeedback();
    savedList.innerHTML = currentSavedListings
        .map((listing) => {
            const title = escapeHtml(listing.title || t("title_unknown"));
            const location = escapeHtml(listing.location || t("location_unknown"));
            const imageUrl = escapeAttrUrl(resolveListingImageUrl(listing));
            const price = escapeHtml(formatPrice(listing.price));
            const listedOn = escapeHtml(formatListingDate(listing.createdAt));
            const statusBadge = renderPropertyStatusBadge(listing.status, {
                labels: {
                    selling: t("status_selling"),
                    renting: t("status_renting"),
                    sold: t("status_sold")
                }
            });

            return `
                <article class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    ${statusBadge}
                    <div class="relative aspect-[16/10] overflow-hidden bg-slate-100">
                        <img src="${imageUrl}" alt="${title}" ${listingImageOnerrorAttr()} class="relative z-0 block h-full w-full object-cover opacity-100 transition duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                    </div>
                    <div class="flex flex-1 flex-col p-4 sm:p-5">
                        <p class="text-xl font-extrabold text-slate-900 sm:text-2xl">${price}</p>
                        <h3 class="mt-2 line-clamp-2 text-base font-bold text-slate-900">${title}</h3>
                        <p class="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">${location}</p>
                        <p class="mt-2 text-xs font-medium text-slate-500">${escapeHtml(t("listed_on"))}: ${listedOn}</p>
                    </div>
                </article>
            `;
        })
        .join("");
}

async function fetchListingsFromBuyPageLogic() {
    // Migrated directly from buy-page.js query logic
    const q = query(
        collection(db, "tamagn_listings"),
        or(where("scope", "==", "all"), where("scope", "==", "dashboard")),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }));
}

async function loadUserListings() {
    console.log("[Dashboard] loadUserListings() called", {
        hasResolvedInitialAuth,
        currentUserUid: currentUser?.uid || null
    });

    if (!hasResolvedInitialAuth) {
        console.log("[Dashboard] Auth state not resolved yet. Skipping fetch.");
        return;
    }

    if (!currentUser) {
        console.log("[Dashboard] No logged in user. Rendering auth-required state.");
        currentListings = [];
        renderAuthRequiredState();
        return;
    }

    const ownerUid = currentUser.uid;
    showListingsLoading(true);
    hideFeedbackBlocks();
    hideListingsSuccess();

    try {
        console.log("[Dashboard] Querying Firestore listings by userId and ownerId", { ownerUid });
        const qByUserId = query(
            collection(db, "tamagn_listings"),
            where("userId", "==", ownerUid)
        );
        const qByOwnerId = query(
            collection(db, "tamagn_listings"),
            where("ownerId", "==", ownerUid)
        );

        const [snapshotByUserId, snapshotByOwnerId] = await Promise.all([
            getDocs(qByUserId),
            getDocs(qByOwnerId)
        ]);

        console.log("[Dashboard] Snapshot sizes", {
            byUserId: snapshotByUserId.size,
            byOwnerId: snapshotByOwnerId.size
        });

        const mergedById = new Map();
        snapshotByUserId.docs.forEach((docSnapshot) => {
            mergedById.set(docSnapshot.id, { id: docSnapshot.id, ...docSnapshot.data() });
        });
        snapshotByOwnerId.docs.forEach((docSnapshot) => {
            if (!mergedById.has(docSnapshot.id)) {
                mergedById.set(docSnapshot.id, { id: docSnapshot.id, ...docSnapshot.data() });
            }
        });

        currentListings = Array.from(mergedById.values())
            .filter((listing) => isOwnedByCurrentUser(listing))
            .filter((listing) => String(listing.status || "selling").toLowerCase() === "selling")
            .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        console.log("[Dashboard] Listings fetched and filtered", {
            totalListings: currentListings.length,
            listingIds: currentListings.map((listing) => listing.id)
        });

        renderListingsCards();
    } catch (error) {
        console.error("[Dashboard] Failed to load dashboard listings:", error);
        currentListings = [];
        listingsList.innerHTML = "";
        showListingsError(t("loading_failed"));
        updateActiveAssetsCount();
    } finally {
        showListingsLoading(false);
    }
}

async function loadSavedListings() {
    console.log("[Dashboard] loadSavedListings() called", {
        hasResolvedInitialAuth,
        currentUserUid: currentUser?.uid || null
    });

    if (!hasResolvedInitialAuth) {
        console.log("[Dashboard] Auth state not resolved yet. Skipping saved fetch.");
        return;
    }

    showSavedLoading(true);
    hideSavedFeedback();

    try {
        console.log("[Dashboard] Querying Firestore for Saved / localStorage favorites.");
        const fetchedListings = await fetchListingsFromBuyPageLogic();
        currentSavedListings = fetchedListings
            .filter((listing) => isListingInUserFavorites(listing))
            .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        console.log("[Dashboard] Saved listings fetched and filtered", {
            totalSaved: currentSavedListings.length,
            savedListingIds: currentSavedListings.map((listing) => listing.id),
            localFavoriteCount: readFavoriteIdsFromLocalStorage().size
        });

        renderSavedCards();
    } catch (error) {
        console.error("[Dashboard] Failed to load saved listings:", error);
        currentSavedListings = [];
        if (savedList) {
            savedList.innerHTML = "";
        }
        showSavedError(t("loading_saved_failed"));
    } finally {
        showSavedLoading(false);
    }
}

async function markListingAsSold(listingId) {
    if (!listingId) {
        return;
    }

    const listing = currentListings.find((item) => item.id === listingId);
    if (!currentUser || !listing || !isOwnedByCurrentUser(listing)) {
        alert(t("not_allowed"));
        return;
    }

    if (String(listing.status || "").toLowerCase() === "sold") {
        showListingsSuccess(t("already_sold_message"));
        return;
    }

    try {
        const listingRef = doc(db, "tamagn_listings", listingId);
        const listingSnapshot = await getDoc(listingRef);

        if (!listingSnapshot.exists()) {
            throw new Error("Listing not found");
        }

        const latestData = listingSnapshot.data();
        if (!isOwnedByCurrentUser(latestData)) {
            alert(t("not_allowed"));
            return;
        }

        await updateDoc(listingRef, {
            status: "sold",
            updatedAt: serverTimestamp()
        });

        currentListings = currentListings.map((item) =>
            item.id === listingId
                ? { ...item, status: "sold", updatedAt: new Date().toISOString() }
                : item
        );
        currentSavedListings = currentSavedListings.map((item) =>
            item.id === listingId
                ? { ...item, status: "sold", updatedAt: new Date().toISOString() }
                : item
        );

        renderListingsCards();
        renderSavedCards();
        showListingsSuccess(t("mark_sold_success"));
    } catch (error) {
        console.error("Failed to mark listing as sold:", error);
        showListingsError(t("mark_sold_failed"));
    }
}

function editListing(listingId) {
    if (!listingId) {
        return;
    }

    const listing = currentListings.find((item) => item.id === listingId);
    if (!currentUser || !listing || !isOwnedByCurrentUser(listing)) {
        alert(t("not_allowed"));
        return;
    }

    window.location.href = `sell.html?edit=${encodeURIComponent(listingId)}&returnTo=${encodeURIComponent("dashboard.html")}`;
}

async function deleteListing(listingId) {
    if (!listingId) {
        return;
    }

    const listing = currentListings.find((item) => item.id === listingId);
    if (!currentUser || !listing || !isOwnedByCurrentUser(listing)) {
        alert(t("not_allowed"));
        return;
    }

    if (!confirm(t("delete_confirm"))) {
        return;
    }

    try {
        await deleteDoc(doc(db, "tamagn_listings", listingId));
        currentListings = currentListings.filter((item) => item.id !== listingId);
        currentSavedListings = currentSavedListings.filter((item) => item.id !== listingId);
        renderListingsCards();
        renderSavedCards();
        alert(t("delete_success"));
    } catch (error) {
        console.error("Failed to delete listing:", error);
        alert(t("delete_failed"));
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        alert(t("logged_out"));
        window.location.href = "login.html";
    } catch (error) {
        console.error("Failed to logout:", error);
    }
}

function syncProfileIdentity(user) {
    if (profilePhoto) {
        if (!user) {
            profilePhoto.innerText = "U";
        } else {
            const fallbackName = user.email || "User";
            const displayName = user.displayName || fallbackName;
            profilePhoto.innerText = displayName.charAt(0).toUpperCase();
        }
    }

    const emailEl = byId("dashboard-user-email");
    if (emailEl) {
        emailEl.textContent = user?.email || "—";
    }
}

onAuthStateChanged(auth, async (user) => {
    hasResolvedInitialAuth = true;
    currentUser = user;
    console.log("[Dashboard] Auth state changed", {
        isLoggedIn: Boolean(user),
        uid: user?.uid || null
    });
    syncProfileIdentity(user);
    await Promise.all([loadUserListings(), loadSavedListings()]);
});

ensurePropertyStatusBadgeStyles();
refreshUI();
showListingsLoading(true);
showSavedLoading(true);

onClickActions({
    "dashboard-toggle-sidebar": () => {
        toggleSidebar();
    },
    "dashboard-show-calculator": () => {
        showCalculatorOnOverview();
    },
    "dashboard-notification-alert": () => {
        alert(t("no_notifications"));
    },
    "dashboard-toggle-language": () => {
        toggleLanguage();
        renderListingsCards();
        renderSavedCards();
        if (listingsLoading?.style.display !== "none") {
            listingsLoading.innerText = t("loading_listings");
        }
        if (listingsError?.style.display !== "none") {
            showListingsError(t("loading_failed"));
        }
        if (savedLoading?.style.display !== "none") {
            savedLoading.innerText = t("loading_saved");
        }
        if (savedError?.style.display !== "none") {
            showSavedError(t("loading_saved_failed"));
        }
        hybridMortgageCalc?.refreshLanguage();
    },
    "dashboard-navigate": ({ actionEl }) => {
        const href = actionEl.getAttribute("data-href") || actionEl.dataset.href;
        if (href) {
            window.location.href = href;
        }
    },
    "dashboard-show-section": ({ actionEl }) => {
        const sectionId =
            actionEl.getAttribute("data-section-id") ||
            (actionEl.dataset.sectionId != null ? String(actionEl.dataset.sectionId) : "");
        if (sectionId) {
            showSection(sectionId);
        }
    },
    "dashboard-logout-alert": () => {
        handleLogout();
    },
    "dashboard-edit-listing": ({ actionEl }) => {
        editListing(actionEl.dataset.listingId);
    },
    "dashboard-delete-listing": ({ actionEl }) => {
        deleteListing(actionEl.dataset.listingId);
    },
    "dashboard-mark-sold": ({ actionEl }) => {
        markListingAsSold(actionEl.dataset.listingId);
    },
    "dashboard-send-message": () => {
        sendMessage();
    },
    "dashboard-open-url": ({ actionEl }) => {
        const url = actionEl.dataset.url;
        if (url) {
            window.open(url, "_blank");
        }
    },
    "dashboard-retry-listings": () => {
        loadUserListings();
    },
    "dashboard-retry-saved": () => {
        loadSavedListings();
    }
});

byId("sidebar-backdrop")?.addEventListener("click", () => {
    if (sidebar?.classList.contains("is-open")) {
        toggleSidebar();
    }
});

try {
    const hybridRoot = byId("hybrid-calculator-container");
    if (hybridRoot) {
        hybridMortgageCalc = mountHybridMortgageCalculator(hybridRoot, {
            showLangToggle: true,
            getLanguage: getCurrentLanguage
        });
        console.log("Calculator Loaded");
    }
} catch (err) {
    console.error("[Dashboard] Calculator mount failed:", err);
}
