import { doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, db } from "../core/firebase.js";
import { initSharedAuthModal } from "../features/auth-modal-shared.js";
import { getUserDisplayProfile } from "../features/auth-user-profile.js";
import { byId, getValue, onClickActions, onIfPresent, setDisplay } from "./page-utils.js";
import { publicationStateFromImageData } from "../listing-image-utils.js";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ddrhpcljy/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "snwisake";

let currentUser = auth.currentUser;
let editingListingId = null;
let hasTriedEditPrefill = false;

const editListingIdFromUrl = new URLSearchParams(window.location.search).get("edit");
const returnToFromUrl = new URLSearchParams(window.location.search).get("returnTo");
const propertyForm = byId("propertyForm");
const submitBtn = byId("btnSubmitPost");
const postTitleText = byId("postTitleText");

function getSafeReturnPath(path) {
    const fallback = "buy.html";
    if (!path) return fallback;
    if (path.includes("://") || path.startsWith("//")) return fallback;
    if (!/^[a-zA-Z0-9\-_/?.=&.#]+$/.test(path)) return fallback;
    return path;
}

const handleLogout = async () => {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (e) {
        console.error("መውጣት አልተቻለም:", e);
    }
};

const sharedAuth = initSharedAuthModal({ googleRedirectPath: "sell.html" });

function getInputValue(id, fallback = "") {
    return getValue(id, fallback);
}

function setInputValue(id, value) {
    const input = byId(id);
    if (input) {
        input.value = value ?? "";
    }
}

function refreshSubmitButtonLabel() {
    if (!submitBtn) return;
    const defaultText = submitBtn.dataset.defaultText || "Post Property";
    submitBtn.innerText = editingListingId ? "ንብረት አዘምን" : defaultText;
}

function setEditingMode(listingId, existingImageUrl = "") {
    if (!propertyForm) return;
    editingListingId = listingId;
    propertyForm.dataset.editImageUrl = existingImageUrl;
    if (postTitleText) {
        postTitleText.innerText = "Edit Your Property";
    }
    refreshSubmitButtonLabel();
}

function clearEditingMode(resetForm = false) {
    if (!propertyForm) return;
    editingListingId = null;
    propertyForm.dataset.editImageUrl = "";
    if (postTitleText) {
        postTitleText.innerText = "Post New Property";
    }

    if (resetForm) {
        propertyForm.reset();
        handleCategoryChange();
        toggleImageInput();
    }

    refreshSubmitButtonLabel();
}

function handleCategoryChange() {
    const val = getInputValue("pDeveloper");
    const reSection = byId("re-section");
    const condoSection = byId("condo-section");
    const villaAptSection = byId("villa-apt-section");

    setDisplay(reSection, "none");
    setDisplay(condoSection, "none");
    setDisplay(villaAptSection, "none");

    if (!isNaN(val) && val !== "") {
        setDisplay(reSection, "block");
    } else if (val === "condominium") {
        setDisplay(condoSection, "block");
    } else if (val === "Villa" || val === "Apartment") {
        setDisplay(villaAptSection, "block");
    }
}

function toggleImageInput() {
    const option = getInputValue("imageOption", "link");
    setDisplay("urlInputArea", option === "link" ? "block" : "none");
    setDisplay("fileInputArea", option === "upload" ? "block" : "none");
}

function buildPropertyData(imageUrl) {
    const base = {
        category: getInputValue("pDeveloper"),
        status: getInputValue("pStatus", "selling") || "selling",
        title: getInputValue("pTitle"),
        price: Number(getInputValue("pPrice", 0)),
        location: getInputValue("pLocation"),
        size: getInputValue("pSize") || null,
        description: getInputValue("pDescription"),
        seller: {
            name: getInputValue("sellerName", "ያልተጠቀሰ"),
            phone: getInputValue("sellerPhone", "ያልተጠቀሰ")
        },
        imageUrl,
        details: {
            bedrooms: getInputValue("pBedrooms") || null,
            bathrooms: getInputValue("pBathrooms") || null,
            parking: getInputValue("pParking") || null
        }
    };
    return { ...base, ...publicationStateFromImageData(base) };
}

async function resolveImageUrlForSubmit(existingImageUrl = "") {
    let imageUrl = existingImageUrl;
    const imageOption = getInputValue("imageOption", "link");

    if (imageOption === "upload") {
        const fileInput = byId("pImageFile");
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

            const cloudRes = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
            if (!cloudRes.ok) {
                throw new Error("Cloudinary upload failed");
            }

            const cloudData = await cloudRes.json();
            imageUrl = cloudData.secure_url;
        }
    } else {
        const imageLink = getInputValue("pImageLink", "").trim();
        if (imageLink) {
            imageUrl = imageLink;
        }
    }

    return imageUrl;
}

async function updateProperty(listingId, updatedData) {
    if (!currentUser) {
        throw new Error("You must be logged in to edit this listing.");
    }

    const listingRef = doc(db, "tamagn_listings", listingId);
    const listingSnapshot = await getDoc(listingRef);

    if (!listingSnapshot.exists()) {
        throw new Error("Listing not found.");
    }

    const listingData = listingSnapshot.data();
    if (!listingData.userId || listingData.userId !== currentUser.uid) {
        throw new Error("Only the property owner can edit this listing.");
    }

    await updateDoc(listingRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
    });
}

function prefillPropertyForm(listingId, listingData) {
    if (!propertyForm) return;

    setInputValue("pDeveloper", listingData.category);
    handleCategoryChange();
    setInputValue("pTitle", listingData.title);
    setInputValue("pPrice", listingData.price);
    setInputValue("pStatus", listingData.status || "selling");
    setInputValue("pLocation", listingData.location);
    setInputValue("pSize", listingData.size);
    setInputValue("pDescription", listingData.description);
    setInputValue("sellerName", listingData.seller?.name);
    setInputValue("sellerPhone", listingData.seller?.phone);
    setInputValue("pBedrooms", listingData.details?.bedrooms);
    setInputValue("pBathrooms", listingData.details?.bathrooms);
    setInputValue("pParking", listingData.details?.parking);

    setInputValue("imageOption", "link");
    toggleImageInput();
    setInputValue("pImageLink", listingData.imageUrl || "");

    const fileInput = byId("pImageFile");
    if (fileInput) {
        fileInput.value = "";
    }

    setEditingMode(listingId, listingData.imageUrl || "");
    propertyForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function tryLoadEditListingFromUrl() {
    if (hasTriedEditPrefill || !editListingIdFromUrl || !currentUser) {
        return;
    }

    hasTriedEditPrefill = true;

    try {
        const listingRef = doc(db, "tamagn_listings", editListingIdFromUrl);
        const listingSnapshot = await getDoc(listingRef);

        if (!listingSnapshot.exists()) {
            alert("ይህ ንብረት አልተገኘም።");
            return;
        }

        const listingData = listingSnapshot.data();
        if (!listingData.userId || listingData.userId !== currentUser.uid) {
            alert("የራስዎን ንብረት ብቻ ማስተካከል ይችላሉ።");
            return;
        }

        prefillPropertyForm(editListingIdFromUrl, listingData);
    } catch (error) {
        console.error("Error loading listing for edit:", error);
        alert("ማስተካከያ ፎርሙን ለመክፈት ችግር ተፈጥሯል።");
    }
}

onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    const authActions = byId("auth-actions");
    const dashboard = byId("postPropFormContainer");
    const loginPrompt = byId("login-prompt");

    if (!authActions) {
        return;
    }

    if (user) {
        const { displayName, initial } = await getUserDisplayProfile(user, "ተጠቃሚ");
        authActions.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="profile-circle">${initial}</div>
                <span style="font-size: 14px; font-weight: bold; color: #333;">
                    እንኳን ደህና መጡ, ${displayName}
                </span>
                <button type="button" data-action="sell-logout" class="logout-btn">Logout</button>
            </div>
        `;

        setDisplay(dashboard, "grid");
        setDisplay(loginPrompt, "none");

        await tryLoadEditListingFromUrl();
    } else {
        authActions.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <button type="button" data-action="sell-open-auth-modal" data-mode="login" class="login-btn">Login</button>
                <button type="button" data-action="sell-open-auth-modal" data-mode="signup" class="signup-btn">Sign up</button>
            </div>
        `;

        setDisplay(dashboard, "none");
        setDisplay(loginPrompt, "block");
    }
});

const propertyTypeSelect = byId("pDeveloper");
onIfPresent(propertyTypeSelect, "change", handleCategoryChange);

const imageOptionSelect = byId("imageOption");
onIfPresent(imageOptionSelect, "change", toggleImageInput);

if (submitBtn && !submitBtn.dataset.defaultText) {
    submitBtn.dataset.defaultText = submitBtn.innerText;
}
refreshSubmitButtonLabel();

onIfPresent(propertyForm, "submit", async (e) => {
    e.preventDefault();

    if (!editingListingId) {
        setDisplay("postPaymentModal", "flex");
        return;
    }

    if (!submitBtn || !propertyForm) {
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "በማዘመን ላይ...";

    try {
        const imageUrl = await resolveImageUrlForSubmit(propertyForm.dataset.editImageUrl || "");
        const updatedData = buildPropertyData(imageUrl);
        await updateProperty(editingListingId, updatedData);

        alert("ንብረቱ በተሳካ ሁኔታ ተዘምኗል!");
        clearEditingMode(false);
        window.history.replaceState({}, "", "sell.html");
        window.location.href = getSafeReturnPath(returnToFromUrl);
    } catch (error) {
        console.error("Error updating listing:", error);
        alert("ስህተት ተከስቷል፦ " + error.message);
    } finally {
        submitBtn.disabled = false;
        refreshSubmitButtonLabel();
    }
});

onClickActions({
    "sell-open-auth-modal": ({ actionEl }) => {
        const mode = actionEl.dataset.mode || "login";
        sharedAuth.openAuthModal(mode);
    },
    "sell-auth-submit": () => {
        sharedAuth.handleAuth();
    },
    "sell-switch-auth-mode": ({ event }) => {
        event.preventDefault();
        sharedAuth.switchMode();
    },
    "sell-google-login": () => {
        sharedAuth.handleGoogleLogin();
    },
    "sell-logout": () => {
        handleLogout();
    },
    "sell-close-post-payment": () => {
        setDisplay("postPaymentModal", "none");
    }
});
