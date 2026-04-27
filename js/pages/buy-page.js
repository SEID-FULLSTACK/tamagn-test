import { collection, getDocs, query, orderBy, where, or } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { db, auth } from "/js/core/firebase.js";
import { initSharedAuthModal } from "/js/features/auth-modal-shared.js";
import { getUserDisplayProfile } from "/js/features/auth-user-profile.js";
import { byId, onClickActions, onIfPresent, setDisplay } from "./page-utils.js";
import { ensurePropertyStatusBadgeStyles, renderPropertyStatusBadge } from "/js/utils/ui-helpers.js";

let currentUser = auth.currentUser;

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    const authActions = byId("auth-btns");
    const userProfile = byId("user-profile");
    const dashboard = byId("tamagn-display-grid");
    const loginPrompt = byId("login-prompt");
    const nameDisplay = byId("userNameDisplay");
    const avatar = byId("avatar");

    if (user) {
        setDisplay(authActions, "none");
        setDisplay(userProfile, "flex");
        setDisplay(dashboard, "grid");
        setDisplay(loginPrompt, "none");

        const { displayName, initial } = await getUserDisplayProfile(user, "ተጠቃሚ");

        if (nameDisplay) nameDisplay.innerText = displayName;
        if (avatar) avatar.innerText = initial;
    } else {
        setDisplay(authActions, "flex");
        setDisplay(userProfile, "none");
        setDisplay(dashboard, "none");
        setDisplay(loginPrompt, "block");
    }

    loadTamagnListings();
});

const sharedAuth = initSharedAuthModal({ googleRedirectPath: "buy.html" });
ensurePropertyStatusBadgeStyles();

const logoutBtn = byId("logoutBtn");
onIfPresent(logoutBtn, "click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
        alert("Logout failed. Please try again.");
    }
});

function showDetails(encodedData) {
    try {
        const item = JSON.parse(decodeURIComponent(encodedData));

        const modal = byId("propertyModal");
        const body = byId("modal-body");
        if (!modal || !body) {
            return;
        }

        body.innerHTML = `
            <h2>የንብረት ዝርዝር መረጃ</h2>
            <p><strong>የቤቱ መጠሪያ:</strong> ${item.title || "ያልተገለጸ"}</p>
            <p><strong>ዋጋ:</strong> ${item.price ? item.price.toLocaleString() : "ያልተገለጸ"} ETB</p>
            <p><strong>የሻጭ ስም:</strong> ${item.seller?.name || "አልተገለጸም"}</p>
            <p><strong>ስልክ ቁጥር:</strong> ${item.seller?.phone || "አልተገለጸም"}</p>
            <p><strong>መግለጫ:</strong> ${item.description || "ምንም"}</p>
            <p><strong>መኝታ ክፍል:</strong> ${item.details?.bedrooms || "---"}</p>
            <p><strong>መታጠቢያ ቤት:</strong> ${item.details?.bathrooms || "---"}</p>
            <p><strong>መኪና ማቆሚያ:</strong> ${item.details?.parking || "---"}</p>
            <p><strong>ስፋት:</strong> ${item.size || "---"} m²</p>
            <p><strong>ቦታ:</strong> ${item.location || "ያልተገለጸ"}</p>
        `;

        const phone = item.seller?.phone || "0000000000";

        body.innerHTML += `
            <div class="contact-container" style="display: flex; gap: 15px; margin-top: 20px; justify-content: center;">
                <a href="https://wa.me/${phone}" target="_blank" class="btn-contact" style="border-color: #25D366; color: #25D366;">
                    <i class="fa-brands fa-whatsapp"></i> WhatsApp
                </a>
                <a href="https://t.me/${phone}" target="_blank" class="btn-contact" style="border-color: #0088cc; color: #0088cc;">
                    <i class="fa-brands fa-telegram"></i> Telegram
                </a>
                <a href="tel:${phone}" class="btn-contact" style="border-color: #d4af37; color: #d4af37;">
                    <i class="fa-solid fa-phone"></i> Call Now
                </a>
            </div>
        `;
        setDisplay(modal, "block");
    } catch (error) {
        console.error("ዳታውን በማንበብ ወቅት ስህተት ተፈጥሯል:", error);
    }
}

function closePropertyModal() {
    setDisplay("propertyModal", "none");
}

async function loadTamagnListings() {
    const displayContainer = byId("tamagn-display-grid");
    if (!displayContainer) {
        return;
    }

    try {
        const q = query(
            collection(db, "tamagn_listings"),
            or(where("scope", "==", "all"), where("scope", "==", "dashboard")),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            displayContainer.innerHTML = "<p style='text-align:center;'>በአሁኑ ሰዓት ምንም ንብረት አልተመዘገበም።</p>";
            return;
        }

        let htmlCards = "";
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const dataString = encodeURIComponent(JSON.stringify(data));
            const statusBadge = renderPropertyStatusBadge(data.status, {
                labels: {
                    selling: "ሽያጭ",
                    renting: "ኪራይ",
                    sold: "ተሽጧል"
                }
            });
            const canEdit = Boolean(currentUser && data.userId && data.userId === currentUser.uid);
            const editTooltip = canEdit
                ? "ይህን ንብረት ማስተካከል ይችላሉ።"
                : currentUser
                    ? "የሌላ ተጠቃሚ ንብረት ማስተካከል አይቻልም።"
                    : "ማስተካከያ ለማድረግ እባክዎ በመጀመሪያ ይግቡ።";
            const editDisabledAttrs = canEdit ? "" : "disabled aria-disabled='true'";
            const editStateStyle = canEdit ? "" : "opacity:0.6; cursor:not-allowed;";

            htmlCards += `
    <div class="tamagn-card">
        ${statusBadge}
        <img src="${data.imageUrl || "https://placehold.co/300x200/png"}" alt="House">
        <div class="tamagn-info">
            <span class="price-text">${data.price ? Number(data.price).toLocaleString() : "---"} ETB</span>
            <h3>${data.title}</h3>
            <p class="location-text">${data.location}</p>
            <div class="contact-actions" style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="btn-details" type="button" data-action="buy-show-details" data-details="${dataString}" style="background:#3498db; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">ሙሉ መረጃ</button>
                <button class="btn-details" type="button" data-action="buy-edit-property" data-property-id="${docId}" title="${editTooltip}" style="background:#f39c12; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; ${editStateStyle}" ${editDisabledAttrs}>ማስተካከያ</button>
            </div>
        </div>
    </div>`;
        });
        displayContainer.innerHTML = htmlCards;
    } catch (error) {
        console.error("ስህተት:", error);
    }
}

window.addEventListener("DOMContentLoaded", loadTamagnListings);

onClickActions({
    "buy-open-auth-modal": ({ actionEl }) => {
        const mode = actionEl.dataset.mode || "login";
        sharedAuth.openAuthModal(mode);
    },
    "buy-auth-submit": () => {
        sharedAuth.handleAuth();
    },
    "buy-switch-auth-mode": ({ event }) => {
        event.preventDefault();
        sharedAuth.switchMode();
    },
    "buy-google-login": () => {
        sharedAuth.handleGoogleLogin();
    },
    "buy-show-details": ({ actionEl }) => {
        const encodedData = actionEl.dataset.details;
        if (encodedData) {
            showDetails(encodedData);
        }
    },
    "buy-close-property-modal": () => {
        closePropertyModal();
    },
    "buy-edit-property": ({ actionEl }) => {
        const listingId = actionEl.dataset.propertyId;
        if (!listingId) return;

        if (!currentUser) {
            alert("ንብረት ለማስተካከል እባክዎ በመጀመሪያ ይግቡ።");
            return;
        }

        const editUrl = `sell.html?edit=${encodeURIComponent(listingId)}&returnTo=${encodeURIComponent("buy.html")}`;
        window.location.href = editUrl;
    }
});
