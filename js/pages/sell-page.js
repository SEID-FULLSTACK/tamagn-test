import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, db, TAMAGN_LISTINGS_COLLECTION } from "../core/firebase.js";
import { initSharedAuthModal } from "../features/auth-modal-shared.js";
import { getUserDisplayProfile } from "../features/auth-user-profile.js";
import { byId, getValue, normalizeRootPageHref, onClickActions, onIfPresent, setDisplay } from "./page-utils.js";
import { publicationStateFromImageData } from "../listing-image-utils.js";

if (typeof db === "undefined" || db === null) {
    console.error("[Sell] EMERGENCY: Firestore `db` is undefined or null — check ../core/firebase.js import.");
} else {
    console.log("[Sell] Firestore db reference OK:", db);
}

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ddrhpcljy/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "snwisake";

/** Exact Firestore collection id (lowercase); must match Firebase Console. */
const LISTINGS_COLLECTION_ID = "tamagn_listings";

/**
 * When true: new listings save to Firestore immediately on submit (no payment modal),
 * `approvalStatus` is set to "approved", and `scope` is "all" so the home grid can show them.
 * Set to `false` to restore the Telebirr/Chapa modal flow and dashboard-only scope.
 */
const SELL_TEST_BYPASS_PAYMENT = true;

if (TAMAGN_LISTINGS_COLLECTION !== LISTINGS_COLLECTION_ID) {
    console.error(
        "[Sell] firebase.js TAMAGN_LISTINGS_COLLECTION mismatch:",
        TAMAGN_LISTINGS_COLLECTION,
        "expected",
        LISTINGS_COLLECTION_ID
    );
}

const SELL_POST_SUCCESS_AM = "ቤቱ በትክክል ተመዝግቧል!";
const SELL_REDIRECT_MS = 2000;

/**
 * Non-blocking toast; does not use alert().
 * @param {"success" | "error"} variant
 */
function showSellToast(message, variant = "success") {
    let host = byId("sell-feedback-toast");
    if (!host) {
        host = document.createElement("div");
        host.id = "sell-feedback-toast";
        host.setAttribute("role", "status");
        host.setAttribute("aria-live", "polite");
        host.className =
            "pointer-events-none fixed bottom-6 left-1/2 z-[10002] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 px-2";
        document.body.appendChild(host);
    }
    const bar = document.createElement("div");
    bar.className =
        variant === "success"
            ? "pointer-events-auto rounded-2xl border border-emerald-500/30 bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white shadow-xl"
            : "pointer-events-auto rounded-2xl border border-red-500/30 bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-xl";
    bar.textContent = message;
    host.replaceChildren(bar);
}

function clearSellToast() {
    const host = byId("sell-feedback-toast");
    if (host) {
        host.replaceChildren();
    }
}

/** Browser static pages do not load `.env`; Cloudinary values come from the constants above only. */
function logCloudinaryConfigContext() {
    console.log("[Sell] Cloudinary config (from code constants — not from .env in browser):", {
        cloudName: cloudinaryCloudNameFromApiUrl(CLOUDINARY_URL),
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        apiEndpoint: CLOUDINARY_URL,
    });
}

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
    const p = normalizeRootPageHref(path);
    if (!p || p.includes("://")) return fallback;
    if (!/^[a-zA-Z0-9\-_/?.=&.#]+$/.test(p)) return fallback;
    return p;
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

function hidePostPaymentModal() {
    const el = byId("postPaymentModal");
    if (!el) return;
    el.style.display = "none";
    el.classList.add("hidden");
    el.classList.remove("flex");
}

function showPostPaymentModal() {
    const el = byId("postPaymentModal");
    if (!el) return;
    el.classList.remove("hidden");
    el.classList.add("flex");
    el.style.display = "flex";
}

/**
 * Persist a new listing to Firestore collection `tamagn_listings` (see `LISTINGS_COLLECTION_ID`).
 * Buy page: `scope` in ("all","dashboard") + `orderBy` createdAt; cards need a valid image + `published`.
 * When `SELL_TEST_BYPASS_PAYMENT` is true, posts skip the payment modal and set `approvalStatus: "approved"`.
 */
async function createNewListingFromForm() {
    if (!currentUser) {
        showSellToast("እባክዎ መጀመሪያ ይግቡ።", "error");
        return;
    }
    if (propertyForm && typeof propertyForm.checkValidity === "function" && !propertyForm.checkValidity()) {
        propertyForm.reportValidity();
        return;
    }
    if (!getInputValue("pTitle", "").trim()) {
        showSellToast("የንብረት ርዕስ ያስገቡ።", "error");
        return;
    }

    let submitButton = submitBtn;
    let postingSucceeded = false;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText = "Posting...";
    }

    hidePostPaymentModal();
    clearSellToast();

    try {
        logCloudinaryConfigContext();
        const imageUrl = await resolveImageUrlForSubmit("");
        const trimmedUrl =
            imageUrl !== undefined && imageUrl !== null ? String(imageUrl).trim() : "";
        if (!trimmedUrl) {
            console.error(
                "[Sell] Firebase addDoc blocked: imageUrl is empty or undefined. Set an image URL or complete Cloudinary upload."
            );
            showSellToast("Please add a valid image link or upload a file. Nothing was saved.", "error");
            return;
        }

        const data = buildPropertyData(trimmedUrl);
        const payload = {
            ...data,
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
            scope: SELL_TEST_BYPASS_PAYMENT ? "all" : "dashboard",
            ...(SELL_TEST_BYPASS_PAYMENT ? { approvalStatus: "approved" } : {}),
        };
        console.log("[Sell] addDoc → collection:", LISTINGS_COLLECTION_ID, "imageUrl:", trimmedUrl.slice(0, 80) + (trimmedUrl.length > 80 ? "…" : ""));

        try {
            await addDoc(collection(db, LISTINGS_COLLECTION_ID), payload);
        } catch (addErr) {
            const exact =
                [addErr?.code, addErr?.message, addErr?.name, String(addErr)].filter(Boolean).join(" | ") || "Unknown error";
            console.error("[Sell] addDoc failed (exact):", addErr);
            showSellToast("Firebase: " + exact, "error");
            return;
        }

        hidePostPaymentModal();
        postingSucceeded = true;
        showSellToast(SELL_POST_SUCCESS_AM, "success");
        clearEditingMode(true);
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerText = "Posting...";
        }

        const buyPage = normalizeRootPageHref("buy.html");
        setTimeout(() => {
            window.location.href = buyPage;
        }, SELL_REDIRECT_MS);
    } catch (err) {
        hidePostPaymentModal();
        console.error("[Sell] create listing:", err?.code || "", err?.message || err, err);
        const exact =
            [err?.code, err?.message, err?.name, String(err)].filter(Boolean).join(" | ") || "Unknown error";
        showSellToast(exact, "error");
    } finally {
        if (submitButton && !postingSucceeded) {
            submitButton.disabled = false;
            refreshSubmitButtonLabel();
        }
    }
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

function cloudinaryCloudNameFromApiUrl(apiUrl) {
    try {
        const m = String(apiUrl).match(/\/v1_1\/([^/]+)\//);
        return m ? m[1] : "(unknown)";
    } catch {
        return "(unknown)";
    }
}

function formatCloudinaryFailureMessage(httpStatus, rawBody, parsed) {
    const cloud = cloudinaryCloudNameFromApiUrl(CLOUDINARY_URL);
    const preset = CLOUDINARY_UPLOAD_PRESET;
    if (parsed && typeof parsed === "object" && parsed.error) {
        const inner = parsed.error.message || String(parsed.error);
        const hint =
            /preset|not found|Invalid/i.test(inner)
                ? ` Verify unsigned upload_preset "${preset}" in Cloudinary dashboard (Settings → Upload) matches this app.`
                : "";
        return `Cloudinary (${cloud}, preset "${preset}"): ${inner}.${hint}`;
    }
    const snippet = rawBody ? String(rawBody).slice(0, 240) : "";
    return `Cloudinary upload failed (HTTP ${httpStatus}, cloud "${cloud}", preset "${preset}"). ${snippet}`.trim();
}

/**
 * Resolves the listing image URL: Cloudinary upload (await until secure_url exists) or pasted link.
 * Firebase writes must run only after this returns; throws on failed/partial Cloudinary responses.
 */
async function resolveImageUrlForSubmit(existingImageUrl = "") {
    let imageUrl = typeof existingImageUrl === "string" ? existingImageUrl.trim() : "";
    const imageOption = getInputValue("imageOption", "link");

    if (imageOption === "upload") {
        const fileInput = byId("pImageFile");
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            try {
                console.log("Starting Cloudinary Upload...");
                console.log("[Sell] Using preset/cld:", CLOUDINARY_UPLOAD_PRESET, cloudinaryCloudNameFromApiUrl(CLOUDINARY_URL));

                const formData = new FormData();
                formData.append("file", fileInput.files[0]);
                formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

                console.table(formData);

                let cloudRes;
                try {
                    cloudRes = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
                } catch (netErr) {
                    console.error("[Sell] Cloudinary upload failed — network / fetch error (exact):", netErr);
                    throw netErr;
                }

                const rawBody = await cloudRes.text();
                let parsed = null;
                try {
                    parsed = rawBody ? JSON.parse(rawBody) : null;
                } catch (parseErr) {
                    console.error("[Sell] Cloudinary upload failed — JSON parse error (exact):", parseErr);
                    console.error("[Sell] Cloudinary raw response (first 400 chars):", rawBody?.slice?.(0, 400));
                    throw new Error(
                        formatCloudinaryFailureMessage(cloudRes.status, rawBody, null) +
                            " Response was not valid JSON."
                    );
                }

                if (!cloudRes.ok || (parsed && parsed.error)) {
                    const msg = formatCloudinaryFailureMessage(cloudRes.status, rawBody, parsed);
                    console.error("[Sell] Cloudinary upload failed — API error (exact body):", parsed || rawBody);
                    throw new Error(msg);
                }

                const secure =
                    parsed && typeof parsed === "object"
                        ? (typeof parsed.secure_url === "string" && parsed.secure_url.trim()) ||
                          (typeof parsed.url === "string" && parsed.url.trim())
                        : "";
                if (!secure) {
                    console.error("[Sell] Cloudinary upload failed — missing secure_url/url (exact parsed):", parsed);
                    throw new Error(
                        `Cloudinary: upload returned no secure_url (cloud "${cloudinaryCloudNameFromApiUrl(
                            CLOUDINARY_URL
                        )}", preset "${CLOUDINARY_UPLOAD_PRESET}").`
                    );
                }
                imageUrl = secure.startsWith("http://")
                    ? secure.replace(/^http:\/\//i, "https://")
                    : secure;
                console.log("Cloudinary Success:", imageUrl);
            } catch (cloudErr) {
                console.error("[Sell] Cloudinary upload failed — caught error (exact):", cloudErr);
                if (cloudErr && typeof cloudErr === "object") {
                    console.error("[Sell] message:", cloudErr.message, "name:", cloudErr.name, "stack:", cloudErr.stack);
                }
                throw cloudErr;
            }
        } else if (!imageUrl) {
            console.warn("[Sell] Image mode is upload but no file selected; imageUrl remains empty until link or file is provided.");
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

    const listingRef = doc(db, LISTINGS_COLLECTION_ID, listingId);
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
        const listingRef = doc(db, LISTINGS_COLLECTION_ID, editListingIdFromUrl);
        const listingSnapshot = await getDoc(listingRef);

        if (!listingSnapshot.exists()) {
            showSellToast("ይህ ንብረት አልተገኘም።", "error");
            return;
        }

        const listingData = listingSnapshot.data();
        if (!listingData.userId || listingData.userId !== currentUser.uid) {
            showSellToast("የራስዎን ንብረት ብቻ ማስተካከል ይችላሉ።", "error");
            return;
        }

        prefillPropertyForm(editListingIdFromUrl, listingData);
    } catch (error) {
        console.error("Error loading listing for edit:", error);
        showSellToast("ማስተካከያ ፎርሙን ለመክፈት ችግር ተፈጥሯል።", "error");
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
        if (SELL_TEST_BYPASS_PAYMENT) {
            hidePostPaymentModal();
            await createNewListingFromForm();
        } else {
            showPostPaymentModal();
        }
        return;
    }

    if (!submitBtn || !propertyForm) {
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "በማዘመን ላይ...";

    let editSucceeded = false;
    try {
        const imageUrl = await resolveImageUrlForSubmit(propertyForm.dataset.editImageUrl || "");
        const trimmedUrl =
            imageUrl !== undefined && imageUrl !== null ? String(imageUrl).trim() : "";
        if (!trimmedUrl) {
            console.error(
                "[Sell] Firebase updateDoc blocked: imageUrl is empty or undefined. Set an image URL or complete Cloudinary upload."
            );
            showSellToast("Please add a valid image link or upload a file. Nothing was saved.", "error");
            return;
        }
        const updatedData = buildPropertyData(trimmedUrl);
        await updateProperty(editingListingId, updatedData);

        editSucceeded = true;
        clearEditingMode(false);
        window.history.replaceState({}, "", "sell.html");
        window.location.href = getSafeReturnPath(returnToFromUrl);
    } catch (error) {
        console.error("Error updating listing:", error);
        showSellToast(error?.message || String(error), "error");
    } finally {
        if (!editSucceeded) {
            submitBtn.disabled = false;
            refreshSubmitButtonLabel();
        }
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
        void createNewListingFromForm();
    },
    "sell-confirm-post": () => {
        void createNewListingFromForm();
    }
});
