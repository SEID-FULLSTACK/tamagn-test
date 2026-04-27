import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    doc,
    getDoc,
    updateDoc,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, db } from "../core/firebase.js";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ddrhpcljy/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "snwisake";

let currentUser = auth.currentUser;
let editingListingId = null;
let hasBoundPropertyFormSubmit = false;
let hasBoundListingActionHandlers = false;
let hasBoundAuthObserver = false;

export function handleCategoryChange() {
    const val = document.getElementById("pDeveloper").value;
    const reSection = document.getElementById("re-section");
    const condoSection = document.getElementById("condo-section");
    const villaAptSection = document.getElementById("villa-apt-section");

    if (reSection) reSection.style.display = "none";
    if (condoSection) condoSection.style.display = "none";
    if (villaAptSection) villaAptSection.style.display = "none";

    if (!isNaN(val) && val !== "") {
        reSection.style.display = "block";
    } else if (val === "condominium") {
        condoSection.style.display = "block";
    } else if (val === "Villa" || val === "Apartment") {
        villaAptSection.style.display = "block";
    }
}

export function toggleImageInput() {
    const option = document.getElementById("imageOption").value;
    document.getElementById("urlInputArea").style.display = option === "link" ? "block" : "none";
    document.getElementById("fileInputArea").style.display = option === "upload" ? "block" : "none";
}

function getInputValue(id, fallback = "") {
    const element = document.getElementById(id);
    return element ? element.value : fallback;
}

function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value ?? "";
    }
}

function refreshSubmitButtonLabel(submitBtn) {
    const defaultText = submitBtn.dataset.defaultText || "Post Property";
    submitBtn.innerText = editingListingId ? "ንብረት አዘምን" : defaultText;
}

function setEditingMode(propertyForm, listingId, existingImageUrl) {
    editingListingId = listingId;
    propertyForm.dataset.editImageUrl = existingImageUrl || "";
    const submitBtn = document.getElementById("btnSubmitPost");
    if (submitBtn) {
        refreshSubmitButtonLabel(submitBtn);
    }
}

function clearEditingMode(propertyForm, resetForm = false) {
    editingListingId = null;
    propertyForm.dataset.editImageUrl = "";

    if (resetForm) {
        propertyForm.reset();
        handleCategoryChange();
        toggleImageInput();
    }

    const submitBtn = document.getElementById("btnSubmitPost");
    if (submitBtn) {
        refreshSubmitButtonLabel(submitBtn);
    }
}

function openPropertyFormModal() {
    const modal = document.getElementById("postPropModal");
    if (modal) {
        modal.style.display = "block";
    }
}

async function resolveImageUrlForSubmit(existingImageUrl = "") {
    let imageUrl = existingImageUrl;
    const imageOption = getInputValue("imageOption", "link");

    if (imageOption === "upload") {
        const fileInput = document.getElementById("pImageFile");
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

            const cloudRes = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
            if (!cloudRes.ok) throw new Error("Cloudinary upload failed");

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

function buildPropertyData(imageUrl) {
    return {
        category: getInputValue("pDeveloper"),
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
}

function prefillPropertyForm(listingId, listingData) {
    const propertyForm = document.getElementById("propertyForm");
    if (!propertyForm) return;

    setInputValue("pDeveloper", listingData.category);
    handleCategoryChange();

    setInputValue("pTitle", listingData.title);
    setInputValue("pPrice", listingData.price);
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

    const fileInput = document.getElementById("pImageFile");
    if (fileInput) {
        fileInput.value = "";
    }

    setEditingMode(propertyForm, listingId, listingData.imageUrl || "");
    openPropertyFormModal();
}

export async function showPropertyDetails(id) {
    try {
        const docRef = doc(db, "tamagn_listings", id);
        const listingDoc = await getDoc(docRef);

        if (listingDoc.exists()) {
            const d = listingDoc.data();
            document.getElementById("modalTitle").innerText = d.title;
            document.getElementById("modalInfo").innerHTML = `
                <p><strong>ዋጋ፦</strong> ${Number(d.price).toLocaleString()} ETB</p>
                <p><strong>አድራሻ፦</strong> ${d.location}</p>
                <p><strong>ማብራሪያ፦</strong> ${d.description || "ምንም ማብራሪያ የለም"}</p>
                <hr>
                <p><strong>ሻጭ፦</strong> ${d.seller ? d.seller.name : "ያልተጠቀሰ"}</p>
                <p><strong>ስልክ፦</strong> <a href="tel:${d.seller ? d.seller.phone : ""}">${d.seller ? d.seller.phone : "ያልተጠቀሰ"}</a></p>
            `;

            const mapIframe = document.getElementById("google-map");
            if (mapIframe && d.location) {
                const encodedLocation = encodeURIComponent(d.location);
                const freeMapUrl = `https://maps.google.com/maps?q=${encodedLocation}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                mapIframe.src = freeMapUrl;
                console.log("ሊንኩ እየሰራ ነው፡ " + d.location);
            }

            document.getElementById("detailsModal").style.display = "block";
        }
    } catch (error) {
        console.error("መረጃውን መጫን አልተቻለም፦", error);
    }
}

export function closeModal() {
    document.getElementById("detailsModal").style.display = "none";
}

export async function updateProperty(listingId, updatedData) {
    if (!currentUser) {
        throw new Error("You must be logged in to edit this listing.");
    }

    const listingRef = doc(db, "tamagn_listings", listingId);
    const listingSnapshot = await getDoc(listingRef);

    if (!listingSnapshot.exists()) {
        throw new Error("Listing not found.");
    }

    const existingData = listingSnapshot.data();
    if (!existingData.userId || existingData.userId !== currentUser.uid) {
        throw new Error("Only the property owner can edit this listing.");
    }

    await updateDoc(listingRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
    });
}

async function openEditPropertyForm(listingId) {
    try {
        const listingRef = doc(db, "tamagn_listings", listingId);
        const listingSnapshot = await getDoc(listingRef);

        if (!listingSnapshot.exists()) {
            alert("ይህ ንብረት አልተገኘም።");
            return;
        }

        const listingData = listingSnapshot.data();

        if (!currentUser) {
            alert("ንብረት ለማስተካከል እባክዎ በመጀመሪያ ይግቡ።");
            return;
        }

        if (!listingData.userId || listingData.userId !== currentUser.uid) {
            alert("የራስዎን ንብረት ብቻ ማስተካከል ይችላሉ።");
            return;
        }

        prefillPropertyForm(listingId, listingData);
    } catch (error) {
        console.error("Error preparing edit form:", error);
        alert("ማስተካከያ ፎርሙን ለመክፈት ችግር ተፈጥሯል።");
    }
}

export async function loadTamagnListings() {
    const displayContainer = document.getElementById("tamagn-display-grid");
    if (!displayContainer) return;

    try {
        const q = query(
            collection(db, "tamagn_listings"),
            where("scope", "==", "all"),
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        let htmlCards = "";

        snapshot.forEach((listing) => {
            const data = listing.data();
            const docId = listing.id;
            const canEdit = Boolean(currentUser && data.userId && data.userId === currentUser.uid);
            const editTooltip = canEdit
                ? "ይህን ንብረት ማስተካከል ይችላሉ።"
                : currentUser
                    ? "የሌላ ተጠቃሚ ንብረት ማስተካከል አይቻልም።"
                    : "ማስተካከያ ለማድረግ እባክዎ በመጀመሪያ ይግቡ።";
            const editDisabledAttrs = canEdit ? "" : "disabled aria-disabled='true'";
            const editStateStyle = canEdit ? "" : "opacity:0.6; cursor:not-allowed;";
            const editHintIcon = canEdit
                ? ""
                : `<span title="${editTooltip}" aria-label="${editTooltip}" style="display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; background:#eef3ff; color:#1a73e8; font-size:12px; font-weight:700; border:1px solid #d3def8;">i</span>`;

            htmlCards += `
            <div class="tamagn-card">
                <img src="${data.imageUrl || "placeholder.jpg"}" alt="House">
                <div class="tamagn-info">
                    <span class="price-text">${Number(data.price).toLocaleString()} ETB</span>
                    <h3>${data.title}</h3>
                    <p class="location-text"><i class="fas fa-map-marker-alt"></i> ${data.location}</p>
                    
                    <div style="background: #eef5ff; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 0.9rem;">
                        <p style="margin: 0;"><strong><i class="fas fa-user"></i> ሻጭ፦</strong> ${data.seller ? data.seller.name : "ያልተጠቀሰ"}</p>
                        <p style="margin: 5px 0 0 0; color: #1a73e8; font-weight: bold;">
                            <a href="tel:${data.seller ? data.seller.phone : ""}" style="text-decoration: none; color: inherit;">
                                <i class="fas fa-phone"></i> ${data.seller ? data.seller.phone : "ስልክ የለም"}
                            </a>
                        </p>
                    </div>
                    
                    <div style="display:flex; gap:8px; margin-top:10px;">
                        <button type="button" data-action="show-property-details" data-property-id="${docId}" class="view-btn">ዝርዝር መረጃ</button>
                        <button type="button" data-action="edit-property" data-property-id="${docId}" class="view-btn" title="${editTooltip}" style="${editStateStyle}" ${editDisabledAttrs}>ማስተካከያ</button>
                        ${editHintIcon}
                    </div>
                </div>
            </div>`;
        });

        displayContainer.innerHTML = htmlCards;
    } catch (error) {
        console.error("Error loading listings:", error);
    }
}

function bindPropertyFormSubmit() {
    if (hasBoundPropertyFormSubmit) return;

    const propertyForm = document.getElementById("propertyForm");
    if (!propertyForm) return;

    const submitBtn = document.getElementById("btnSubmitPost");
    if (!submitBtn) return;

    if (!submitBtn.dataset.defaultText) {
        submitBtn.dataset.defaultText = submitBtn.innerText;
    }
    refreshSubmitButtonLabel(submitBtn);

    propertyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const isEditing = Boolean(editingListingId);
        const existingImageUrl = propertyForm.dataset.editImageUrl || "";

        submitBtn.innerText = isEditing ? "በማዘመን ላይ..." : "በመመዝገብ ላይ...";
        submitBtn.disabled = true;

        try {
            const imageUrl = await resolveImageUrlForSubmit(existingImageUrl);

            if (isEditing) {
                const updateData = buildPropertyData(imageUrl);
                await updateProperty(editingListingId, updateData);
                alert("ንብረቱ በተሳካ ሁኔታ ተዘምኗል!");
            } else {
                const propertyData = {
                    ...buildPropertyData(imageUrl),
                    createdAt: serverTimestamp(),
                    scope: "dashboard",
                    userId: currentUser ? currentUser.uid : null
                };

                await addDoc(collection(db, "tamagn_listings"), propertyData);
                alert("ንብረቱ በተሳካ ሁኔታ ተመዝግቧል!");
            }

            clearEditingMode(propertyForm, true);
            loadTamagnListings();
        } catch (error) {
            console.error("Error:", error);
            alert("ስህተት ተከስቷል፦ " + error.message);
        } finally {
            submitBtn.disabled = false;
            refreshSubmitButtonLabel(submitBtn);
        }
    });

    hasBoundPropertyFormSubmit = true;
}

function bindListingActionHandlers() {
    if (hasBoundListingActionHandlers) return;

    document.addEventListener("click", (event) => {
        const actionEl = event.target.closest("[data-action='edit-property']");
        if (!actionEl) return;

        const listingId = actionEl.dataset.propertyId;
        if (listingId) {
            openEditPropertyForm(listingId);
        }
    });

    hasBoundListingActionHandlers = true;
}

function bindAuthObserver() {
    if (hasBoundAuthObserver) return;

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        loadTamagnListings();
    });

    hasBoundAuthObserver = true;
}

export function initListingsFeature() {
    bindPropertyFormSubmit();
    bindListingActionHandlers();
    bindAuthObserver();
    window.addEventListener("DOMContentLoaded", loadTamagnListings);
}
