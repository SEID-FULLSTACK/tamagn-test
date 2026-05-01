
// 1. ሁሉም import የሚደረጉ ነገሮች ከላይ ይሁን
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {  getAuth,  createUserWithEmailAndPassword,  signInWithEmailAndPassword,onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {  getFirestore,  collection,  addDoc,  getDocs,  query,  orderBy,  doc,  getDoc,where,  serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    resolveListingImageUrl,
    escapeAttrUrl,
    listingImageOnerrorAttr,
    hasValidListingImageForPublicGrid,
    publicationStateFromImageData,
} from "./listing-image-utils.js";
import { renderPropertyMap, clearPropertyMap, normalizePropertyDataForMap } from "./property-map.js";
// 1. መጀመሪያ Config-ህን ግለጽ
const firebaseConfig = {
    apiKey: "AIzaSyCiPdbWkA2oUqu1ONy6R3BdDom6lC8_mnI",
  authDomain: "tamagnbet.firebaseapp.com",
  projectId: "tamagnbet",
  storageBucket: "tamagnbet.firebasestorage.app",
  messagingSenderId: "901462661792",
  appId: "1:901462661792:web:6db51cdf37b97839c607c5",
  measurementId: "G-B4440P71X7"
};

// 3. app እና dbን እዚህ ጋር ፍጠር (ይህ ወሳኝ ነው!)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. ከዚያ Auth ተጠቀም
const auth = getAuth(app);


// 2. Cloudinary Settings
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ddrhpcljy/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "snwisake";

// --- የፎርም ምርጫዎችን የማሳያ ተግባር (Category Toggle) ---
function handleCategoryChange() {
    const val = document.getElementById('pDeveloper').value;
    const reSection = document.getElementById('re-section');
    const condoSection = document.getElementById('condo-section');
    const villaAptSection = document.getElementById('villa-apt-section');

    if (reSection) reSection.style.display = 'none';
    if (condoSection) condoSection.style.display = 'none';
    if (villaAptSection) villaAptSection.style.display = 'none';

    if (!isNaN(val) && val !== "") {
        reSection.style.display = 'block';
    } else if (val === "condominium") {
        condoSection.style.display = 'block';
    } else if (val === "Villa" || val === "Apartment") {
        villaAptSection.style.display = 'block';
    }
}

// --- የምስል መጫኛ መንገድ መቀያየሪያ ---
function toggleImageInput() {
    const option = document.getElementById('imageOption').value;
    document.getElementById('urlInputArea').style.display = (option === 'link') ? 'block' : 'none';
    document.getElementById('fileInputArea').style.display = (option === 'upload') ? 'block' : 'none';
}

async function showPropertyDetails(id) {
    try {
        let d = null;
        const r1 = await getDoc(doc(db, "tamagn_listings", id));
        if (r1.exists()) d = r1.data();
        else {
            const r2 = await getDoc(doc(db, "properties", id));
            if (r2.exists()) d = r2.data();
        }
        if (!d) return;

            document.getElementById('modalTitle').innerText = d.title;
            document.getElementById('modalInfo').innerHTML = `
                <p><strong>ዋጋ፦</strong> ${Number(d.price).toLocaleString()} ETB</p>
                <p><strong>አድራሻ፦</strong> ${d.location}</p>
                <p><strong>ማብራሪያ፦</strong> ${d.description || 'ምንም ማብራሪያ የለም'}</p>
                <hr>
                <p><strong>ሻጭ፦</strong> ${d.seller ? d.seller.name : 'ያልተጠቀሰ'}</p>
                <p><strong>ስልክ፦</strong> <a href="tel:${d.seller ? d.seller.phone : ''}">${d.seller ? d.seller.phone : 'ያልተጠቀሰ'}</a></p>
            `;

            document.getElementById('detailsModal').style.display = "block";
            const mapHost = document.getElementById("google-map");
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            await renderPropertyMap(mapHost, normalizePropertyDataForMap(d));
    } catch (error) {
        console.error("መረጃውን መጫን አልተቻለም፦", error);
    }
}

//Modal-ሉን መዝጊያ ፋንክሽን (እዚህም ተስተካክሏል)
function closeModal() {
    clearPropertyMap(document.getElementById("google-map"));
    document.getElementById('detailsModal').style.display = "none";
}

// 2. ቤቶቹን ከ Firebase አምጥቶ በገጹ ላይ የሚደረድር ፋንክሽን
async function loadTamagnListings() {
    const displayContainer = document.getElementById('tamagn-display-grid');
    if (!displayContainer) return;

    /*try {
      
const q = query(collection(db, "tamagn_listings"), orderBy("createdAt", "desc"));
const snapshot = await getDocs(q);
        let htmlCards = "";
*/
try {
        // --- እዚህ ጋር ነው የቀየርነው ---
        const q = query(
            collection(db, "tamagn_listings"), 
            where("scope", "==", "all"), // ዋናው ገጽ ላይ 'all' የሆኑትን ብቻ አሳይ
            orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(q);
        let htmlCards = "";






        snapshot.forEach((doc) => {
            const data = doc.data();
            if (!hasValidListingImageForPublicGrid(data)) return;
            const docId = doc.id;
            const img = escapeAttrUrl(resolveListingImageUrl(data));
            const priceStr = data.price != null ? Number(data.price).toLocaleString() : "—";
            const beds = data.details?.bedrooms ?? "—";
            const baths = data.details?.bathrooms ?? "—";
            const area = data.size ? `${data.size} m²` : "—";
            const addr = data.location || "ቦታ አልተገለጸም";

            htmlCards += `
            <article class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img src="${img}" alt="" ${listingImageOnerrorAttr()} class="block h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                </div>
                <div class="flex flex-1 flex-col p-4 sm:p-5">
                    <p class="text-2xl font-extrabold tracking-tight text-slate-900">${priceStr} <span class="text-base font-bold text-slate-500">ETB</span></p>
                    <h3 class="mt-2 line-clamp-2 text-base font-bold text-slate-900">${data.title || "የንብረት ርዕስ"}</h3>
                    <p class="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">${addr}</p>
                    <div class="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600">
                        <span><i class="fa-solid fa-bed mr-1 text-[#006AFF]" aria-hidden="true"></i>${beds} መኝታ</span>
                        <span><i class="fa-solid fa-bath mr-1 text-[#006AFF]" aria-hidden="true"></i>${baths} መታጠቢያ</span>
                        <span><i class="fa-solid fa-ruler-combined mr-1 text-[#006AFF]" aria-hidden="true"></i>${area}</span>
                    </div>
                    <button type="button" onclick="showPropertyDetails('${docId}')" class="mt-5 w-full rounded-xl bg-[#E8F2FF] py-3 text-sm font-bold text-[#006AFF] transition hover:bg-[#006AFF] hover:text-white">ዝርዝር መረጃ</button>
                </div>
            </article>`;
        });

        if (!htmlCards.trim()) {
            displayContainer.innerHTML = `<p class="col-span-full py-12 text-center text-slate-500">በአሁኑ ሰዓት በምዕራፉ ላይ የሚታይ ንብረት የለም።</p>`;
        } else {
            displayContainer.innerHTML = htmlCards;
        }

    } catch (error) {
        console.error("Error loading listings:", error);
    }
}

// 3. የፎርም መላኪያ ተግባር (Submit to Cloudinary & Firebase)
document.getElementById('propertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('btnSubmitPost');
    const originalBtnText = submitBtn.innerText;
    
    submitBtn.innerText = "በመመዝገብ ላይ...";
    submitBtn.disabled = true;

    try {
        let imageUrl = "";
        const imageOption = document.getElementById('imageOption').value;

        if (imageOption === 'upload') {
            const fileInput = document.getElementById('pImageFile');
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const cloudRes = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
                if (!cloudRes.ok) throw new Error("Cloudinary upload failed");
                const cloudData = await cloudRes.json();
                imageUrl = cloudData.secure_url;
            }
        } else {
            imageUrl = (document.getElementById('pImageLink').value || "").trim();
        }

       
const propertyData = {
            category: document.getElementById('pDeveloper').value,
            title: document.getElementById('pTitle').value,
            price: Number(document.getElementById('pPrice').value),
            location: document.getElementById('pLocation').value,
            size: document.getElementById('pSize').value || null,
            description: document.getElementById('pDescription').value || "",
            seller: {
                name: document.getElementById('sellerName').value || 'ያልተጠቀሰ',
                phone: document.getElementById('sellerPhone').value || 'ያልተጠቀሰ'
            },
            imageUrl: imageUrl,
            createdAt: serverTimestamp(), 
            // **ይህንን መስመር አክል**
            scope: 'dashboard', 
            details: {
                bedrooms: document.getElementById('pBedrooms')?.value || null,
                bathrooms: document.getElementById('pBathrooms')?.value || null,
                parking: document.getElementById('pParking')?.value || null
            }
        };
        Object.assign(propertyData, publicationStateFromImageData(propertyData));

        // 3. የተስተካከለ Firestore Write (Modular Syntax)
        await addDoc(collection(db, "tamagn_listings"), propertyData);
// ...
        alert("ንብረቱ በተሳካ ሁኔታ ተመዝግቧል!");
        document.getElementById('propertyForm').reset();
        
        loadTamagnListings(); 

    } catch (error) {
        console.error("Error:", error);
        alert("ስህተት ተከስቷል፦ " + error.message);
    } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
});
// ገጹ ሲከፈት — Featured grid (tamagn-display-grid)
window.addEventListener('DOMContentLoaded', loadTamagnListings);
// 1. የቤቶች ዳታ
const myProperties = [
    { id: 1, title: "ዘመናዊ አፓርታማ ቦሌ", price: "8,500,000 ETB", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400" },
    { id: 2, title: "ቪላ ቤት ሰሚት", price: "15,000,000 ETB", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400" },
    { id: 3, title: "የንግድ ሱቅ መገናኛ", price: "4,200,000 ETB", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400" },
    { id: 4, title: "ጌስት ሀውስ አያት", price: "25,000,000 ETB", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400" },
    { id: 5, title: "ኮንዶሚኒየም የካ", price: "3,100,000 ETB", image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=800&q=80" }, 
    { id: 6, title: "ባለ 3 ክፍል ቤት ላፍቶ", price: "7,800,000 ETB", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80" }
];

function renderProperties() {
    const container = document.getElementById('property-container');
    
    if (!container) {
        console.error("Error: 'property-container' not found in HTML!");
        return;
    }

    let content = "";

    myProperties.forEach((house, index) => {
        // 1. የቤት ካርድ መጨመር (ብድር አስላ በተን ተወግዷል)
        content += `
            <article class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img src="${house.image}" alt="${house.title}" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div class="flex flex-1 flex-col p-4 sm:p-5">
                    <p class="text-2xl font-extrabold tracking-tight text-slate-900">${house.price}</p>
                    <h3 class="mt-2 line-clamp-2 text-base font-bold text-slate-900">${house.title}</h3>
                    <p class="mt-1 line-clamp-2 text-sm font-semibold text-slate-600">Addis Ababa</p>
                    <div class="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                        <button type="button" class="flex-1 rounded-xl bg-[#E8F2FF] py-3 text-sm font-bold text-[#006AFF] transition hover:bg-[#006AFF] hover:text-white">ዝርዝር ይመልከቱ</button>
                        <a href="tel:+251911000000" class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 text-[#006AFF] transition hover:bg-slate-50" aria-label="Call"><i class="fas fa-phone"></i></a>
                    </div>
                </div>
            </article>
        `;

        // 2. በየ 4ኛው ቤት ላይ ማስታወቂያ ማስገባት
        if ((index + 1) % 4 === 0) {
            content += `
                <div class="premium-ad-card premium-ad-sponsor col-span-full">
                    <div class="ad-sponsor-layout">
                        <div class="ad-text-section ad-sponsor-text">
                            <div class="ad-sponsor-pill"><i class="fas fa-crown"></i> SPONSORED</div>
                            <h2 class="ad-sponsor-title">የቤትዎን ውበት በዘመናዊ ፈርኒቸሮች ያስውቡ!</h2>
                            <p class="ad-sponsor-desc">ከ <strong>Abyssinia Furniture</strong> ጋር በሚያደርጉት ግዢ የ20% ልዩ ቅናሽ ተጠቃሚ ይሁኑ።</p>
                            <button type="button" class="ad-sponsor-cta"><span class="ad-sponsor-cta-inner">አሁኑኑ ይዘዙ <i class="fas fa-shopping-cart ad-sponsor-cta-icon"></i></span></button>
                        </div>
                        <div class="ad-sponsor-image-wrap">
                            <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop" alt="" class="ad-sponsor-img" width="600" height="400" loading="lazy" decoding="async">
                            <div class="ad-discount-badge" aria-hidden="true"><span>20%</span><span>OFF</span></div>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = content;
}

document.addEventListener('DOMContentLoaded', renderProperties);

let currentLang = 'en';
let currentCategory = 'All';
/** @type {{ id: string, col: string, data: Record<string, unknown> }[]} */
let browseFirestoreListings = [];

function getCreatedMs(data) {
    const c = data.createdAt;
    if (c && typeof c.seconds === "number") return c.seconds * 1000;
    if (c && typeof c.toMillis === "function") return c.toMillis();
    const t = data.timestamp;
    if (typeof t === "string") {
        const ms = Date.parse(t);
        if (!Number.isNaN(ms)) return ms;
    }
    return 0;
}

/** Canonical type slug: villa | apartment | condominium | '' */
function normalizePropertyType(data) {
    const raw = (data.type ?? data.propertyType ?? data.category ?? data.details?.propertyType ?? "")
        .toString()
        .trim()
        .toLowerCase();
    if (!raw) return "";
    if (raw === "villa" || raw === "house") return "villa";
    if (raw === "apartment" || raw === "apt" || raw === "apartments") return "apartment";
    if (raw === "condominium" || raw === "condo") return "condominium";
    return raw;
}

/** rent | sale | null (null = not classified — excluded when filtering by rent/sale) */
function getTransactionType(data) {
    const v = (data.listingType ?? data.listing_type ?? data.tag ?? data.transaction ?? data.status ?? "")
        .toString()
        .trim()
        .toLowerCase();
    if (!v) return null;
    if (v.includes("rent") || v === "rental" || v.includes("lease") || v.includes("ኪራይ")) return "rent";
    if (
        v.includes("sale") ||
        v === "selling" ||
        v === "for sale" ||
        v === "buy" ||
        v.includes("ሽያጭ")
    )
        return "sale";
    return null;
}

function listingMatchesSearch(data, q) {
    if (!q) return true;
    const blob = `${data.title ?? ""} ${data.location ?? ""} ${data.description ?? ""}`.toLowerCase();
    return blob.includes(q);
}

function listingMatchesCategory(data, cat) {
    if (cat === "All") return true;
    const n = normalizePropertyType(data);
    if (cat === "Villa") return n === "villa";
    if (cat === "Apartment") return n === "apartment";
    if (cat === "condominium") return n === "condominium";
    if (cat === "rent") return getTransactionType(data) === "rent";
    if (cat === "sale") return getTransactionType(data) === "sale";
    return true;
}

async function loadBrowseFirestoreListings() {
    const acc = [];
    const seen = new Set();
    const pushRow = (id, col, dat) => {
        if (!hasValidListingImageForPublicGrid(dat)) return;
        const key = `${col}:${id}`;
        if (seen.has(key)) return;
        seen.add(key);
        acc.push({ id, col, data: dat });
    };

    try {
        const qTam = query(
            collection(db, "tamagn_listings"),
            where("scope", "==", "all"),
            orderBy("createdAt", "desc")
        );
        const snapTam = await getDocs(qTam);
        snapTam.forEach((d) => pushRow(d.id, "tamagn_listings", d.data()));
    } catch (err) {
        console.error("browse listings (tamagn_listings):", err);
    }
    try {
        const snapP = await getDocs(collection(db, "properties"));
        snapP.forEach((d) => pushRow(d.id, "properties", d.data()));
    } catch (err) {
        console.warn("browse listings (properties):", err);
    }

    acc.sort((a, b) => getCreatedMs(b.data) - getCreatedMs(a.data));
    browseFirestoreListings = acc;
    if (typeof filterContent === "function") filterContent();
}

function renderHouseGridFirestore(items) {
    const houseGrid = document.getElementById("houseGrid");
    if (!houseGrid) return;
    const t = data[currentLang];
    if (!items.length) {
        houseGrid.innerHTML = `<p class="col-span-full py-12 text-center text-slate-600">ለጊዜው በዚህ ዘርፍ የተመዘገበ ቤት የለም።</p>`;
        return;
    }
    houseGrid.innerHTML = items
        .map(({ id, data: d }) => {
            const img = escapeAttrUrl(resolveListingImageUrl(d));
            const priceDisplay =
                d.price != null && d.price !== ""
                    ? `${Number(d.price).toLocaleString()} ETB`
                    : "—";
            const tx = getTransactionType(d);
            const tag = tx || "sale";
            const tagLabel = tag === "rent" ? t.rent : t.sale;
            const tagClass = tag === "sale" ? "bg-emerald-600" : "bg-amber-500";
            const typeLabel = (d.type || d.propertyType || d.category || "").toString();
            return `<article class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img src="${img}" alt="" ${listingImageOnerrorAttr()} class="relative z-0 block h-full w-full object-cover opacity-100 transition duration-500 group-hover:scale-105" loading="lazy" width="800" height="600" decoding="async" />
                    <span class="absolute left-3 top-3 rounded-full ${tagClass} px-3 py-1 text-xs font-bold text-white shadow">${tagLabel}</span>
                </div>
                <div class="flex flex-1 flex-col p-4 sm:p-5">
                    <p class="text-xl font-extrabold tracking-tight text-slate-900">${priceDisplay}</p>
                    <h3 class="mt-2 line-clamp-2 text-base font-bold text-slate-900">${d.title || "የንብረት ርዕስ"}</h3>
                    <p class="mt-1 text-sm font-semibold text-slate-600">${typeLabel}</p>
                    <a href="tel:+251911000000" class="mt-4 w-full rounded-xl bg-[#E8F2FF] py-3 text-center text-sm font-bold text-[#006AFF] transition hover:bg-[#006AFF] hover:text-white"><i class="fas fa-phone mr-2"></i>${t.call}</a>
                </div>
            </article>`;
        })
        .join("");
}

const data = {
    en: {
        l1: "Tamagn", l2: "-Bet", menuBtn: "Menu", 
        navList: "Listing Menu", navRepo: "Reporting Menu",
        navPost: "Post Property", navAgentReg: "Agent Registration", 
        langBtn: "አማርኛ", navAbout: "About Us", navVis: "Vision", navMiss: "Mission", navVal: "Values",
        heroH: "Ethiopia's Trusted Property Hub", heroP: "Rent, Buy, Sell and Invest in Real Estate.",
        hTitle: "Available Properties", 
        rePartnersEyebrow: "Partners",
        reTitle: "Trusted by Ethiopia's Leading Developers ።",
        rePartnersSub: "Developers featured here collaborate with Tamagn Bet to list quality projects and reach serious buyers.",
        abH: "About Us", abP: "Tamagn-Bet is Ethiopia's premier digital real estate marketplace connecting buyers and sellers.",
        vH: "Our Vision", vP: "To become the most reliable real estate bridge in East Africa.",
        mH: "Our Mission", mP: "To empower Ethiopians by providing a transparent platform for finding dream homes.",
        valH: "Our Values", valP: "Trust, Integrity, and Customer Satisfaction.",
        call: "Call Now", sale: "FOR SALE", rent: "FOR RENT", searchPlaceholder: "Enter address, city, sub-city, woreda",
        fAll: "All", fVilla: "Villa", fApart: "Apartment", fLand: "Land", frent: "rent", fsale: "sale", 
        footerDesc: "Ethiopia's Digital Real Estate Marketplace",
        footerCopy: "© 2026 Tamagn-Bet | Developed by Horizon Web Tech",
        houses: [
            { title: "Modern Villa - CMC", price: "15M ETB", tag: "sale", cat: "Villa", image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80" },
            { title: "Apartment - Bole", price: "40k /mo", tag: "rent", cat: "Apartment", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80" },
            { title: "Land - Legetafo", price: "5M ETB", tag: "sale", cat: "Land", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80" }
        ],
        devs: [
            {
                id: 1,
                name: "Noah Real Estate",
                logo: "images/noah_logo.PNG",
                about:
                    "Since its establishment in 2013, Noah Real Estate PLC has become a cornerstone of real estate in Ethiopia, delivering 32 landmark projects (15 residential, 6 commercial, and 11 mixed-use) across Addis Ababa. With 12 projects under development, we continue redefining urban living and commercial excellence in Ethiopia’s vibrant capital.Renowned for our strong financial foundation and cutting-edge design innovation, Noah Real Estate PLC crafts spaces that blend functionality, luxury, and sustainability. From modern apartments to dynamic mixed-use complexes, our projects inspire communities and elevate lifestyles in Addis Ababa.Choose Noah Real Estate PLC for trusted expertise in Ethiopia’s real estate sector, where vision, quality, and innovation converge to create lasting value.",
                aboutAm:
                    "ኖህ ሪል እስቴት ከ2013 ጀምሮ በአዲስ አበባ በርካታ የመኖሪያ፣ የንግድና የተዳቋሚ አጠቃቀም ፕሮጀክቶችን በመስራት ከኢትዮጵያ ትላልቅ የግል አልሚዎች አንዱ አድርጎ ይደረጋል። ይድረሱ የሚሉት በገንቢ የፋይናንስ ጥናት፣ በተወሰነ ጊዜ ማስረከብና ለዘመኑ ምቹ አፓርታማዎችና ኮምፕሌኮች የዘመናዊ አርክቴክቸር አቀራረብ ነው። ከታማኝነት ጋር ለሚያድጉ የዲዛይን አፕሮቾችና ሰፊ የፕሮጀክቶች ምርጫ ስላለው በአዲስ አበባ በገዢዎች እንደ ቀዳሚ አማራጭ ይታሰባል።",
            },
            {
                id: 2,
                name: "Gift Real Estate",
                logo: "images/gift_logo.PNG",
                about:
                    "It has established a solid reputation as a result of its substantial contributions throughout the years to the growth of Ethiopia's real estate market. Its ambitious goal is to provide services to several cities in Ethiopia and other African nations.Gift Real Estate is renowned for producing a broad variety of homes that cater to various target market segments. Its offerings to the Addis Ababa market comprise, but are not restricted to, opulent villas, villa apartments, row houses, and apartments that are renowned for being diverse, exquisitely designed, and equipped with all the amenities one could want. Its renown and popularity are mostly due to its emphasis on creating designs for lifestyles and future generations, as well as to fulfilling its promise to build dream homes in the most desirable and practical parts of the city, such the CMC and its environs.Medhanialem, Teklehaymanot, Atlas Urael, at the nearby Meklit building around 22, Figa, and Siddist Kilo.",
                aboutAm:
                    "ጊፍት ሪል እስቴት ከጊፍት ቢዝነስ ቡድን አንዱ ሲሆን ከ2005 የጀመረው የመኖሪያ ልማት እንቅስቃሴ በኢትዮጵያ ከቀዳሚዎቹ ተብሎ ይገለጻል። ከቅንጦት ቪላ እስከ ረው ሃውስና ወፍራም አፓርታማዎች በሲኤምሲ፣ በ22፣ ላ ጋሬ(ልገሃር)ና ካዛንቺስ ያለ የምርት መስመር አለው። ለዘመኑ ምቹ የኑሮ አቀራረብ፣ የውስጥ ማጠናቀቂያ በቤተሰብ ምርጫ ለማስቻል የግንባታ ደረጃና ለክልል ማራዘሚያ ያለው ግብ ይመደባል።",
            },
            {
                id: 3,
                name: "Ayat Real Estate",
                logo: "images/ayat_logo.PNG",
                about:
                    "Located in the heart of Addis Ababa, Ayat represents more than just a real estate firm; it stands as a legacy of passion and innovation. With over 25 years of experience, we have pioneered the industry by creating not only houses but homes, integrating innovative development, construction, and financial solutions.Ayat, a proudly Ethiopian-owned company, has fulfilled the dreams of thousands of families by delivering over 5,000 homes and 1,000 commercial properties.In addition to our construction endeavors, we have generated employment opportunities for over 15,000 individuals.",
                aboutAm:
                    "አያት ሪል እስቴት በ1997 በአያልዩ ተስማ ተመስርቶ እስካሁን ኢትዮጵያ በጅምር እቅድ የተጎለበተ የመኖሪያ ማህበረሰብ አልሚ ብሎ ይታወቃል። በአያት፣ ሲኤምሲ፣ ካዛንቺስና ሰሚት አካባቢዎች ቪላ፣ ዱፕሌክስ፣ ታውንቤዎችና የቅንጦት ጎላዎችን ከአያት ግራንድ ሞል ተመሳሳይ የንግድ አንካሪዎች ጋር ያጣምራል። 40/60 የመክፈያ ልምድ የመጀመሪያ ተጠቃሚዎች አንዱ ሲሆን በርካታ ዓመታት ለመካከለኛና ለላቀ ገቢ ቤተሰቦች አገልግሎት ሰርቷል።",
            },
            {
                id: 4,
                name: "Sunshine Real Estate",
                logo: "images/sunshine_logo.PNG",
                about:
                    "Sunshine Construction PLC originated in 1984, converted to a private limited company in 1993, and sits at the core of Sunshine Investment Group—one of Ethiopia’s largest construction conglomerates spanning roads, buildings, and hospitality. Real-estate marketing highlights gated residential villages and major apartment blocks in CMC, Gerji, Bole Beshale, and Meri Luke, often referenced next to flagship hospitality such as Marriott Executive Apartments. The brand’s long operating history underpins broad technical capacity and nationwide project logistics.",
                aboutAm:
                    "ሳንሻይን ኮንስትራክሽን ከ1984 በግንባታ ተጀምሮ በ1993 እንደ የግል ኩባንያ ተዋቀረ፤ ከሳንሻይን ኢንቨስትመንት ቡድን ዋና አካል ነው። በመንገድ፣ ህንፃና ሆቴል ልማት ሰፊ አቅም ያለው ሲሆን በሲኤምሲ፣ ገርጂ፣ ቦሌ በሻለና መሪ ሉቅ አካባቢዎች የመኖሪያ መንደሮችና ትላልቅ አፓርታማዎች ያቀረበ ነው። ከማሪዮት ኤግዚኪዩቲቭ አፓርታማዎች ስሙ ጋር የሚያገናኝ ታሪካዊ ልምድ አለው።",
            },
            {
                id: 5,
                name: "Metropolitan Real Estate",
                logo: "images/met_logo.PNG",
                about:
                    "Metropolitan is an established property development company focused on creating homes packed with functionality, convenience and comfort for today’s modern lifestyle seeker and savvy investor.The innovation-led, future-focused Metropolitan Real Estate established in 1995, the company is responsible for more than 450 large-scale projects worldwide. Metropolitan Real Estate has been operating in Ethiopia since 2016 G.C. Metropolitan Real Estate is introducing world-class luxury high-end apartments to Addis Ababa’s key areas.  In doing so, we strive to fulfill the needs of luxury living in Ethiopia and provide long term profitable investment opportunities in real estate.",
                aboutAm:
                    "ሜትሮፖሊታን ሪል እስቴት በአሜሪካ የሚመራ የልማት ቡድን ክፍል በአለም አቀፍ ትልልቅፕሮጀክቶች ልምድ ሲደርስ ከ2016 በኋላ በአዲስ አበባ ለቅንጦት መኖሪያ አተኮረ። የመጀመሪያው ሳርቤት ገብርኤል አፓርታማዎች በአስር ሁለት ወራት መረከብ እንደ ማስረጃ ይቀርባል። ቦሌ ሚድታውን፣ ሜትሮፖሊታን ታወርና ቢስራተ ገብርኤልና አአ አካባቢዎች ዘመናዊ ቅንጦት እና በዓለም ደረጃ የሚጠበቅ የማስረከብ ሥነ ሥርዓት እንደ ዋና መለያ ይቀርባል።",
            },
            {
                id: 6,
                name: "Flintstone Homes",
                logo: "images/flint_logo.PNG",
                about:
                    "Flintstone Homes was chartered in 2008 as the real-estate division of Flintstone Engineering, whose construction lineage extends to 1991 under engineer Tsedeke Yihune. The mission statement centers on quality, integrity, innovation, and broadly affordable homes for Ethiopia’s growing cities—backed by public claims of more than 1,500 completed units with active pipelines across Gerji, Summit, Kazanchis, CMC, and other core sub-cities. Buyers frequently encounter milestone-based payment schedules designed to widen access to mid-rise condominiums.",
                aboutAm:
                    "ፍሊንትስቶን ሆምስ በ2008 የፍሊንትስቶን ኢንጂነሪንግ የመኖሪያ ክፍል ሲሆን ህንጻው ከ1991 በኢንጂነር ፅድቀ ይሁኔ ጀምሮ ተቆርቋሪ ነው። ጥራት፣ ታማኝነትና እሳቤ በማዕከል ተጭኖ ለከተሞች በሽፋን ለሚያድግ ገበያ ተመጣጣኝ ቤት ለማቅረብ ያላበቅ ይልዋል። ከገርጂ፣ ሰሚት፣ ካዛንቺስ፣ ሲኤምሲና በሌሎች አካባቢዎች በሺዎች የሚቆጠሩ የተረከቡ ክፍሎች እንዳሉ ይዘገባል፤ በደረጃ የክፍያ ሥርዓት ለሰፊ ተጠቃሚነት ይጠቀማል።",
            },
            {
                id: 7,
                name: "Ovid Real Estate",
                logo: "images/ovid_logo.PNG",
                about:
                    "Ovid Real Estate PLC operates under the Ovid Group from Djibouti Street HQ in Addis Ababa, promoting residential and commercial inventory that spans mid-market through luxury price bands. Corporate messaging highlights modern construction methods for shorter cycles, smart-home features on select schemes, and landscaped compounds such as the Chaka Housing plan with thousands of units and extensive amenity space. International-standard Bole VIP apartments are a flagship marketing line for urban investors seeking central convenience.",
                aboutAm:
                    "ኦቪድ ሪል እስቴት ከኦቪድ ቡድን በመቀላቀል በጂቡቲ ፍሎ አዲስ አበባ ከተማ የመኖሪያና የንግድ አቅርቦት ያቀርባል። ከመካከለኛ ወደ ቅንጦት ዋጋ ክልል ያካትታል፤ ዘመናዊ የግንባታ ዘዴዎች ለተሳካ የጊዜ አቅርቦት፣ በአንዳንድ ስላቶች ለስማርት ቤት ቴክኖሎጂና ለጫካ ሃውዚንግ ያሉ አሳማኝ አጋር በቅርጸተፊል ማህበረሰቦች ይዘራል። በቦሌ የቪአይፒ አፓርታማዎች በከተማ ማዕከል ለኢንቨስትመንት የሚስማሙ እንደ ፊላ ይቀርባሉ።",
            },
            {
                id: 8,
                name: "Temir Properties",
                logo: "images/temir_logo.PNG",
                about:
                    "Temir Properties (marketed as Temer Real Estate) was founded in Ethiopian calendar year 2010 and reports delivering 350+ apartment and villa units across more than ten flagship sites in Addis Ababa. Project marketing clusters around Piassa, Sarbet, Ayat, Aware, Garment, and Lycée corridors under brands like Blue Point and Lycee phases. The developer emphasizes creative planning, dependable construction quality, and competitive pricing for buyers seeking turnkey apartments or ground-floor retail shells.",
                aboutAm:
                    "ተምር ፕሮፐርቲስ (እንደ ተምር ሪል እስቴት የሚገማማ) በኢትዮጵያውያን ካሌንዳር 2010 ተመስርቷል፤ በአስር በላይ ጣቢያዎች በ350 በላይ የአፓርታማና ቪላ ክፍሎች እንዳስረከበ ይነገርለታል። በፒያሳ፣ ሳርቤት፣ አያት፣ አዋሬ፣ ጋርመንትና ሊሴ አካባቢዎች ብሉ ፖይንትና ሊሴ ፍሬዎች ይለማሉ። ለዕቅድ ፈጠራ፣ ለአስተማማኝ ግንባታ ጥራትና ለተወዳዳሪ ዋጋ የሚያኮራ አቅጣጫ ያለው ነው።",
            },
            {
                id: 9,
                name: "Bora Real Estate",
                logo: "images/bora_logo.PNG",
                about:
                    "Boran Real Estate S.C. (commonly referenced as “Bora”) is a long-standing Addis Ababa share company noted in trade press for early luxury condominium towers near the Old Airport / Nefas Silk-Lafto corridor, pairing residential floors with street-front commercial. Marketing from the 2010s celebrated rapid sell-outs, spacious floor plans, and structured owners’ bylaws—positioning Bora among the first movers that popularized high-rise condominium living in southwestern Addis.",
                aboutAm:
                    "ቦራን ሪል እስቴት (በተለምዶ “ቦራ”) በአዲስ አበባ ለረጅም ጊዜ የቆየ የአክሲዮን ማህበር ነው። ከኦልድ ኤርፖርት / ነፋስ ስልክ ላፍቶ አቅጣጫ ቅድመ ደረጃ ለቅንጦት ኮንዶሚኒየም ግንቦች ተብሎ የሚወራ ሲሆን መኖሪያ ክፍሎች ከመሬት ወለል ንግድ ጋር ተዋህደዋል። በ2010ዎቹ ፈጣን ሽያጭ፣ ሰፊ ዝርጋታና ለባለአክሲዮኖች መደበኛ ደንቦች ከቀዳሚዎቹ እንቅስቃሴዎች አንዱ ሆኖ ለቅንጦት አፓርታማ ኑሮ ሃሳብ ማስተዋወቁ ተደምጧል።",
            },
            {
                id: 10,
                name: "Zemen Real Estate",
                logo: "images/zemen_logo.PNG",
                about:
                    "Zemen Real Estate PLC is described as Zemen Group’s dedicated urban-housing platform, prioritizing affordable studios through three-bedroom apartments to ease Ethiopia’s housing backlog—particularly in regional cities such as Mekelle and Shire where hundreds of units are under development. Rather than boutique super-luxury towers alone, corporate narratives stress inclusive planning, disaster-resilient design goals, and future growth into additional secondary cities.",
                aboutAm:
                    "ዘመን ሪል እስቴት ከዘመን ቡድን የከተማ መኖሪያ ልማት መስመር ሲሆን በስቱዲዮ እስከ ሶስት መኝታ አፓርታማዎች የመኖሪያ እጥረትን ለመቀነስ ያተኮረ ነው። በመቀሌ፣ ሽግራና በተመሳሳይ ክልሎች በመቶዎች የሚቆጠሩ ክፍሎች በግንባታ ላይ እንዳሉ የድርጅቱ አቀራረብ ይዘራል። ለሰፊ ተደራሽነት የታቀደ ማህበረሰብ፣ ለጥንካሬ የተጠቀሰ ንድፍና ወደ ሌሎች ከተሞች ማራዘም የሚታይ የድርጅቱ አቅጣጫ ነው።",
            },
            {
                id: 11,
                name: "Tsehay Real Estate",
                logo: "images/tsehay_logo.PNG",
                about:
                    "Tsehay Real Estate was incorporated on 11 June 2011 as a partnership involving CGC Overseas Construction (Ethiopia) Ltd. and invests heavily in the CMC roundabout district—among Addis Ababa’s busiest condominium corridors. The signature Polychrome / Poli Lotus International Centre features roughly a dozen high-rise residential blocks, large-format commercial space, underground parking, and substantial shared amenities, making Tsehay synonymous with ultra-high-density mixed-use living in eastern Addis.",
                aboutAm:
                    "ፀሐይ ሪል እስቴት በ2011 ከCGC ኦቨርሲዝ ኮንስትራክሽን (ኢትዮጵያ) እና ከውጭ ባለሀብት ባልደረባ ኃላፊነት ተመስርቷል። በሲኤምሲ ራውንዳቦት አካባቢ ሰፊ የአፓርታማ ሕንፃዎች፣ የንግድ ቦታዎች፣ የመኪና ማቆሚያና ሌሎች አጋር አገልግሎቶችን ያጫግቱ የተዋሃደ የከተማ ልማቶችን ያቀረበ ሲሆን በምስራቅ አዲስ አበባ ከፍተኛ ጥቅም ላይ ከሚውሉ ኮንዶሚኒየም ኮሪደሮች ጋር ይወዳደራል።",
            },
        ]
    },
    am: {
        l1: "ታማኝ", l2: "-ቤት", menuBtn: "ዝርዝር", 
        navList: "የዝርዝር ማውጫ", navRepo: "የሪፖርት ማውጫ",
        navPost: "ቤት ለመጫን", navAgentReg: "ደላላ ለመመዝገብ", 
        langBtn: "English", navAbout: "ስለ እኛ", navVis: "ራዕይ", navMiss: "ተልዕኮ", navVal: "እሴቶች",
        heroH: "ታማኝ የቤት መድረክ", heroP: "ኪራይ፣ ግዢ፣ ሽያጭ እና በሪል እስቴት ኢንቨስት።",
        hTitle: "የሚገኙ ቤቶች", 
        rePartnersEyebrow: "አጋሮች",
        reTitle: "በኢትዮጵያ ዋና ዋና የሪል እስቴት አልሚዎች የታመኑብናል ።",
        rePartnersSub: "የተመረጡ አልሚዎች ከታማኝ ቤት ጋር በመተባበር ጥራት ያላቸውን ፕሮጀክቶች ይለማሉ፣ ክብር ያላቸው ገዢዎችንም ያገኛሉ።",
        abH: "ስለ እኛ", abP: "ታማኝ-ቤት በኢትዮጵያ ውስጥ ገዢዎችን እና ሻጮችን በታማኝነት የሚያገናኝ ቀዳሚ ዲጂታል መድረክ ነው።",
        vH: "ራዕያችን", vP: "በምስራቅ አፍሪካ ተመራጭ የሪል እስቴት ድልድይ መሆን።",
        mH: "ተልዕኳችን", mP: "ኢትዮጵያውያን የህልም ቤታቸውን እንዲያገኙ ግልጽነት ያለው አሰራር መዘርጋት።",
        valH: "እሴቶቻችን", valP: "ታማኝነት፣ ቅንነት እና የደንበኛ እርካታ።",
        call: "ደውል", sale: "ለሽያጭ", rent: "ለኪራይ", searchPlaceholder: "ቤቶችን ወይም አልሚዎችን ይፈልጉ...",
        fAll: "ሁሉም", fVilla: "ቪላ", fApart: "አፓርታማ", fLand: "መሬት",
        footerDesc: "የኢትዮጵያ ዲጂታል የሪል እስቴት መድረክ",
        footerCopy: "© 2026 ታማኝ-ቤት | የለማው በ ሰይድ ፍሬው",
        houses: [
            { title: "ዘመናዊ ቪላ - ሲኤምሲ", price: "15 ሚሊዮን ብር", tag: "sale", cat: "Villa", image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80" },
            { title: "አፓርታማ - ቦሌ", price: "40ሺ በወር", tag: "rent", cat: "Apartment", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80" },
            { title: "መሬት - ለገጣፎ", price: "5 ሚሊዮን ብር", tag: "sale", cat: "Land", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80" }
        ],
        devs: [
            { id: 1, name: "ኖህ ሪል እስቴት", logo: "images/noah_logo.PNG" },
            { id: 2, name: "ጊፍት ሪል እስቴት", logo: "images/gift_logo.PNG" },
            { id: 3, name: "አያት ሪል እስቴት", logo: "images/ayat_logo.PNG" },
            { id: 4, name: "ሳንሻይን ሪል እስቴት", logo: "images/sunshine_logo.PNG" },
            { id: 5, name: "ሜትሮፖሊታን ሪል እስቴት", logo: "images/met_logo.PNG" },
            { id: 6, name: "ፍሊንትስቶን ሆምስ", logo: "images/flint_logo.PNG" },
            { id: 7, name: "ኦቪድ ሪል እስቴት", logo: "images/ovid_logo.PNG" },
            { id: 8, name: "ተምር ፕሮፐርቲስ", logo: "images/temir_logo.PNG" },
            { id: 9, name: "ቦራ ሪል እስቴት", logo: "images/bora_logo.PNG" },
            { id: 10, name: "ዘመን ሪል እስቴት", logo: "images/zemen_logo.PNG" },
            { id: 11, name: "ፀሐይ ሪል እስቴት", logo: "images/tsehay_logo.PNG" }
        ]
    }
};
const menuData = {
    en: {
        "sign-up": "Sign Up", "login": "Login", "postproperty": "Post Property",
        "search-by-location": "Search by Location", "buy": "Buy", "sell": "Sell",
        "real-estate-developers": "Developers", "banks": "Bank Auctions",
        "federal-housing-corporation": "Federal Housing Corp",
        "agent-registration": "Agent Registration", "report": "Report"
    },
    am: {
        "sign-up": "ይመዝገቡ", "login": "ይግቡ", "post property": "ቤት ያስመዝግቡ",
        "search-by-location": "በቦታ ይፈልጉ", "buy": "መግዛት", "sell": "መሸጥ",
        "real-estate-developers": "የሪል እስቴት አልሚዎች", "banks": "የባንኮች ጨረታ",
        "federal-housing-corporation": "የፌደራል ቤቶች ኮርፖሬሽን",
        "agent-registration": "ደላላ መመዝገቢያ", "report": "ሪፖርት"
    }
};
function renderSidebar() {
    const sideDrawer = document.getElementById('sideDrawer');
    // ስህተትን ለመከላከል: sideDrawer ካልተገኘ ፋንክሽኑን አቁም
    if (!sideDrawer) {
        console.warn("sideDrawer አልተገኘም! የ HTML መዋቅርዎን ያረጋግጡ።");
        return;
    }

    const lang = currentLang; 
    const strings = menuData[lang];

    const pathname = typeof window !== "undefined" && window.location.pathname ? window.location.pathname : "";
    const pathSegments = pathname.replace(/\/$/, "").split("/").filter(Boolean);
    const pathLeaf = pathSegments.length ? pathSegments[pathSegments.length - 1] : "";
    const isDevelopersHome = !pathLeaf || pathLeaf === "index.html";
    const developersHref = isDevelopersHome ? "#developers-section" : "index.html#developers-section";

    // ይዘቱን ብቻ ነው የምናዘምነው (innerHTML) - የsideDrawer ኤለመንቱ ግን ሳይጠፋ ይቀራል
    const postLabel = strings['postproperty'] || strings['post property'] || 'Post Property';
    sideDrawer.innerHTML = `
    <div class="zillow-drawer-header">
        <button type="button" class="zillow-drawer-close" onclick="toggleMenu()" aria-label="Close menu">&times;</button>
        <div class="zillow-drawer-brand"><span class="zillow-drawer-brand-a">Tamagn</span><span class="zillow-drawer-brand-b">-Bet</span></div>
    </div>
    <div class="zillow-drawer-nav font-sans" role="navigation" aria-label="Site">
        <a href="sell.html" class="zillow-drawer-link"><span data-key="postproperty">${postLabel}</span></a>
        <a href="buy.html" class="zillow-drawer-link"><span data-key="buy">${strings['buy']}</span></a>
        <a href="sell.html" class="zillow-drawer-link"><span data-key="sell">${strings['sell']}</span></a>
        <a href="${developersHref}" class="zillow-drawer-link" onclick="if(typeof toggleMenu==='function'){ toggleMenu(); }"><span data-key="real-estate-developers">${strings['real-estate-developers']}</span></a>
        <a href="fhc.html" class="zillow-drawer-link"><span data-key="federal-housing-corporation">${strings['federal-housing-corporation']}</span></a>
        <a href="banks.html" class="zillow-drawer-link"><span data-key="banks">${strings['banks']}</span></a>
        <a href="agent-portal.html" class="zillow-drawer-link" onclick="if(typeof toggleMenu==='function'){ toggleMenu(); }"><span data-key="agent-registration">${strings['agent-registration']}</span></a>
        <div class="menu-section">
            <button type="button" class="toggle-btn zillow-drawer-toggle zillow-drawer-toggle--report" onclick="toggleSection(this)" aria-expanded="false">
                <span class="zillow-drawer-toggle-label"><span data-key="report">${strings['report']}</span></span>
            </button>
            <div class="submenu zillow-drawer-submenu">
                <a href="#" class="sub-link zillow-drawer-sublink">የውሸት ማስታወቂያ</a>
            </div>
        </div>
    </div>
    `;
}
// ገጹ ሙሉ በሙሉ እንደተጫነ ሜኑውን በራስ-ሰር ይገንባው
document.addEventListener('DOMContentLoaded', () => {
    renderSidebar(); // ሜኑውን ይገነባል
});

// ይህን ኮድ በ Script ታግህ ውስጥ ብቻ አስገባ
window.toggleMenu = function() { 
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('overlay');

    if (drawer) {
        drawer.classList.toggle('active');
        console.log("Drawer active class is:", drawer.classList.contains('active'));
    } else {
        alert("ስህተት: sideDrawer የሚባል ID በ HTML ውስጥ የለም!");
    }

    if (overlay) {
        overlay.classList.toggle('active');
    }
};

    // 2. የSubmenu ክፍሎችን (ለምሳሌ Real Estate Developers) የሚከፍት ተግባር
    window.toggleSection = function(btnElement) {
        // የጎረቤት (next element) የሆነውን submenu ይፈልጋል
        const submenu = btnElement.nextElementSibling;
        
        if (submenu && submenu.classList.contains('submenu')) {
            submenu.style.display = (submenu.style.display === 'block') ? 'none' : 'block';
        }
    };

    // 3. ከሜኑ ውጪ ሲጫን ሜኑውን ይዘጋል (አማራጭ)
    document.addEventListener('click', function(event) {
        const drawer = document.getElementById('sideDrawer');
        const overlay = document.getElementById('overlay');
        const menuBtn = document.querySelector('.menu-btn'); // ሜኑውን የሚከፍተው አዝራር (አስፈላጊ ከሆነ)

        if (drawer && overlay && drawer.classList.contains('open')) {
            if (!drawer.contains(event.target) && event.target !== menuBtn) {
                drawer.classList.remove('open');
                overlay.classList.remove('active');
            }
        }
    });




function toggleModal(id) {
    const m = document.getElementById(id);
    if (!m) {
        console.error("Missing Modal ID: " + id);
        return;
    }
    
    // Check current state. If it's none or empty, show it.
    if (m.style.display === "none" || m.style.display === "") {
        m.style.display = "block";
    } else {
        m.style.display = "none";
    }
}

// Close modal if user clicks outside the box
// አሮጌውን window.onclick = ... አጥፍተህ ይህንን አስገባ
window.addEventListener('click', function(event) {
    // modal የሚል ክላስ ያለው ቦክስ ላይ ብቻ ከሆነ ክሊክ የተደረገው
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
});
function setCategory(cat, btn) {
    currentCategory = cat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterContent();
}

function filterContent() {
    const input = document.getElementById("searchInput");
    const queryText = input ? input.value.toLowerCase().trim() : "";
    const t = data[currentLang];
    const filteredListings = browseFirestoreListings.filter(
        ({ data: d }) => listingMatchesSearch(d, queryText) && listingMatchesCategory(d, currentCategory)
    );
    renderHouseGridFirestore(filteredListings);
    const fDevs = t.devs.filter((d) => d.name.toLowerCase().includes(queryText));
    renderDeveloperGridOnly(fDevs);
}

function showDevInfo(id) {
    const enD = data.en.devs.find((d) => d.id === id);
    if (!enD) return;

    const modal = document.getElementById("developerInfoModal");
    const titleEl = document.getElementById("developerInfoModalTitle");
    const enEl = document.getElementById("developerInfoAboutEn");
    if (!modal || !titleEl || !enEl) return;

    titleEl.textContent = enD.name;
    enEl.textContent = enD.about;
    const closeBtn = document.getElementById("developerInfoModalCloseBtn");
    if (closeBtn) closeBtn.textContent = "Close";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeDeveloperInfoModal() {
    const modal = document.getElementById("developerInfoModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

function renderDeveloperGridOnly(devs) {
    const reGrid = document.getElementById("reGrid");
    if (!reGrid) return;
    reGrid.innerHTML = devs.map(d => `
            <article>
                <div>
                    <img src="${d.logo}" alt="${d.name}" class="re-dev-logo max-h-[5.75rem] w-full max-w-[220px] object-contain sm:max-h-24" loading="lazy" decoding="async" />
                </div>
                <h3 class="mt-5 text-center text-base font-semibold leading-snug tracking-tight text-slate-900 sm:text-lg">${d.name}</h3>
                <div class="mt-auto flex w-full justify-center pt-6 pb-1">
                    <button type="button" class="re-dev-info-btn min-w-[8.5rem] shrink-0 rounded-xl border border-[#006AFF] bg-[#006AFF] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:border-[#0053B3] hover:bg-[#0053B3]" onclick="showDevInfo(${d.id})">Info</button>
                </div>
            </article>`).join('');
}
// 2. ፋንክሽኖችን (Functions) ከማንኛውም Event Listener ውጭ ይጻፏቸው
function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'am' : 'en';
    renderUI();
}
// 3. በመጨረሻም Event Listener-ውን በፋይሉ መጨረሻ ላይ አድርገው
document.addEventListener("DOMContentLoaded", async () => {
    const langBtn = document.getElementById("langBtn");
    if (langBtn) {
        langBtn.addEventListener("click", toggleLanguage);
    }
    await loadBrowseFirestoreListings();
    renderUI();

    const devModal = document.getElementById("developerInfoModal");
    document.getElementById("developerInfoModalCloseX")?.addEventListener("click", closeDeveloperInfoModal);
    document.getElementById("developerInfoModalCloseBtn")?.addEventListener("click", closeDeveloperInfoModal);
    devModal?.addEventListener("click", (e) => {
        if (e.target === devModal) closeDeveloperInfoModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && devModal?.classList.contains("is-open")) closeDeveloperInfoModal();
    });
});

const safeSetText = (id, text) => { 
    const el = document.getElementById(id); 
    if(el) el.innerText = text; 
};

function renderUI() {
    const t = data[currentLang];
    const menu = menuData[currentLang];

    // 1. አውቶማቲክ ዘዴ (data-key ያላቸው)
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        const text = t[key] || menu[key];
        if (text) {
            if (el.tagName === 'INPUT') el.placeholder = text;
            else el.textContent = text;
        }
    });

    // 2. ሜኑ በተን (አንዴ ብቻ ይያዝ)
    const mBtn = document.getElementById('menuBtn');
    if (mBtn) mBtn.innerHTML = `<i class="fas fa-bars" aria-hidden="true"></i>`;

    // 3. ሌሎች ጽሑፎች (Manual)
    safeSetText('l1', t.l1); 
    safeSetText('l2', t.l2);
    safeSetText('langBtn', t.langBtn);
    safeSetText('heroH', t.heroH); 
    safeSetText('heroP', t.heroP);
    safeSetText('hTitle', t.hTitle); 
    safeSetText('reTitle', t.reTitle);
    safeSetText('rePartnersEyebrow', t.rePartnersEyebrow);
    safeSetText('rePartnersSub', t.rePartnersSub);
    
    const sInput = document.getElementById('searchInput');
    if(sInput) sInput.placeholder = t.searchPlaceholder;
    
    safeSetText('fAll', t.fAll); 
    safeSetText('fVilla', t.fVilla);
    safeSetText('fApart', t.fApart); 
    safeSetText('fLand', t.fLand);
    safeSetText('abH', t.abH); 
    safeSetText('abP', t.abP);
    safeSetText('vH', t.vH); 
    safeSetText('vP', t.vP);
    safeSetText('mH', t.mH); 
    safeSetText('mP', t.mP);
    safeSetText('valH', t.valH); 
    safeSetText('valP', t.valP);
    safeSetText('footerDesc', t.footerDesc);
    safeSetText('footerCopy', t.footerCopy);
    
    // 4. ማጣሪያውን አስኪድ
    if (typeof filterContent === 'function') {
        filterContent();
    }
}

window.onclick = (e) => { if (e.target.className === 'modal') e.target.style.display = "none"; }
// ቋንቋውን ለመቀየር እና ለማስታወስ

 function showForm(formType) {
        const loginSection = document.getElementById('loginFormSection');
        const signupSection = document.getElementById('signupFormSection');
        if (loginSection && signupSection) {
            loginSection.style.display = (formType === 'login') ? 'block' : 'none';
            signupSection.style.display = (formType === 'signup') ? 'block' : 'none';
        }
    }

    function openAuthModal(defaultForm = 'login') {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'flex';
            showForm(defaultForm);
        }
    }

    function closeAuthModal() {
        document.getElementById('authModal').style.display = 'none';
    }

    // Modal ውጪ ሲጫን እንዲዘጋ
    window.onclick = function(event) {
        const modal = document.getElementById('authModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
// --- 2. የቤት መመዝገቢያ ፎርም (Property Form) ---

   const propertyForm = document.getElementById('propertyForm');

if (propertyForm) {
    propertyForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // የሎዲንግ ሁኔታ (አማራጭ፡ ለተጠቃሚው እንዲታይ)
        console.log("Saving Property to Firestore...");

     
// በምትኩ ይህንን ተጠቀም
const imgInput = (document.getElementById('pImage')?.value ?? "").trim();
const newProperty = {
    devId: document.getElementById('pDeveloper').value,
    title: document.getElementById('pTitle').value,
    price: document.getElementById('pPrice').value,
    location: document.getElementById('pLocation').value,
    img: imgInput || "",
    status: 'pending', 
scope: 'dashboard',
    timestamp: new Date().toISOString()
};
        Object.assign(newProperty, publicationStateFromImageData(newProperty));
        try {
            // 3. ትክክለኛው የ v9 Modular Syntax
            const docRef = await addDoc(collection(db, "properties"), newProperty);

            console.log("Successfully Saved! ID: ", docRef.id);
            alert("ቤትዎ በተሳካ ሁኔታ ተለጠፈ!");

            // 4. Form reset and UI update
            this.reset();
            toggleModal('postPropModal');
            const payModal = document.getElementById('postPaymentModal');
            if (payModal) payModal.style.display = 'flex';

        } catch (error) {
            // ስህተት ከተፈጠረ የድል መልእክቱ አይታይም
            console.error("Error adding document: ", error);
            alert("መረጃውን በመላክ ላይ ችግር ተፈጥሯል: " + error.message);
        }
    });
}
// 1. ዳታ (Array) - በዚሁ ይቀጥላል
const allHouses = [
    { 
        id: 1, 
        title: "ዘመናዊ አፓርታማ ቦሌ", 
        agent: "አቤል", 
        isVerified: true, 
        price: "8M ETB", 
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80" 
    },
    { 
        id: 2, 
        title: "ቪላ ቤት ሰሚት", 
        agent: "ሳራ", 
        isVerified: false, 
        price: "12M ETB", 
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80" 
    },
    { 
        id: 3, 
        title: "ቆንጆ ኮንዶሚኒየም", 
        agent: "ካሳሁን", 
        isVerified: true, 
        price: "4M ETB", 
        image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&q=80" 
    },
    { 
        id: 4, 
        title: "ሰፊ ግቢ ያለው ቤት", 
        agent: "ኤደን", 
        isVerified: true, 
        price: "20M ETB", 
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80" 
    }
    ,
    { 
        id: 5, 
        title: "አዲስ አፓርታማ", 
        agent: "ዮናስ", 
        isVerified: false, 
        price: "9M ETB", 
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80" 
    }
];

// 2. የማሳያ ፈንክሽን
function startRendering() {
    // ID ስሙን ወደ 'house-listings-grid' ቀይሬዋለሁ
    const container = document.getElementById('house-listings-grid');
    if (!container) return;

    let htmlOutput = "";

    allHouses.forEach((house) => {
        // Verified Badge Logic
        const vBadge = house.isVerified ? 
            `<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align: middle; margin-left: 5px;">
                <path fill="#1DA1F2" d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.65.25-1.53-.13-3.08-1.05-4.25-1.17-.92-2.72-1.3-4.25-1.05-.7-1.3-2.07-2.18-3.65-2.18s-2.95.88-3.65 2.18c-1.53-.25-3.08.13-4.25 1.05-.92 1.17-1.3 2.72-1.05 4.25-1.3.7-2.18 2.07-2.18 3.65s.88 2.95 2.18 3.65c-.25 1.53.13 3.08 1.05 4.25 1.17.92 2.72 1.3 4.25 1.05.7 1.3 2.07 2.18 3.65 2.18s 2.95-.88 3.65-2.18c1.53.25 3.08-.13 4.25-1.05.92-1.17 1.3-2.72 1.05-4.25 1.3-.7 2.18-2.07 2.18-3.65zM10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>` : '';

        // የቤት ካርድ መጨመር
        htmlOutput += `
            <article class="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img src="${house.image}" alt="${house.title}" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div class="flex flex-1 flex-col p-4 sm:p-5">
                    <p class="text-2xl font-extrabold tracking-tight text-slate-900">${house.price}</p>
                    <h3 class="mt-2 line-clamp-2 text-base font-bold text-slate-900">${house.title}</h3>
                    <p class="mt-1 text-sm font-semibold text-slate-600">ኤጀንት፡ ${house.agent} ${vBadge}</p>
                </div>
            </article>
        `;
    });

    container.innerHTML = htmlOutput;
}

// ገጹ ሲጫን ስራውን እንዲጀምር
window.onload = startRendering;

// ፋንክሽኖችህን ለ HTML እንዲታዩ አድርግ
window.toggleModal = toggleModal;
window.handleCategoryChange = handleCategoryChange;
window.toggleImageInput = toggleImageInput;
window.showPropertyDetails = showPropertyDetails;
window.loadTamagnListings = loadTamagnListings;
window.setCategory = setCategory;
window.filterContent = filterContent;
window.closeModal = closeModal;
window.showDevInfo = showDevInfo;
window.closeDeveloperInfoModal = closeDeveloperInfoModal;
