let currentLang = "en";
let currentCategory = "All";

const data = {
    en: {
        l1: "Tamagn", l2: "-Bet", menuBtn: "Menu",
        navList: "Listing Menu", navRepo: "Reporting Menu",
        navPost: "Post Property", navAgentReg: "Agent Registration",
        langBtn: "አማርኛ", navAbout: "About Us", navVis: "Vision", navMiss: "Mission", navVal: "Values",
        heroH: "Ethiopia's Trusted Property Hub", heroP: "Rent, Buy, and Explore Real Estate.",
        hTitle: "Available Properties", reTitle: "Real Estate Developers",
        abH: "About Us", abP: "Tamagn-Bet is Ethiopia's premier digital real estate marketplace connecting buyers and sellers.",
        vH: "Our Vision", vP: "To become the most reliable real estate bridge in East Africa.",
        mH: "Our Mission", mP: "To empower Ethiopians by providing a transparent platform for finding dream homes.",
        valH: "Our Values", valP: "Trust, Integrity, and Customer Satisfaction.",
        call: "Call Now", sale: "FOR SALE", rent: "FOR RENT", searchPlaceholder: "Search properties or developers...",
        fAll: "All", fVilla: "Villa", fApart: "Apartment", fLand: "Land", frent: "rent", fsale: "sale",
        footerDesc: "Ethiopia's Digital Real Estate Marketplace",
        footerCopy: "© 2026 Tamagn-Bet | Developed by Horizon Web Tech",
        houses: [
            { title: "Modern Villa - CMC", price: "15M ETB", tag: "sale", cat: "Villa" },
            { title: "Apartment - Bole", price: "40k /mo", tag: "rent", cat: "Apartment" },
            { title: "Land - Legetafo", price: "5M ETB", tag: "sale", cat: "Land" }
        ],
        devs: [
            { id: 1, name: "Noah Real Estate", logo: "/images/noah_logo.PNG", about: "Noah is a leading developer in Addis Ababa known for high-end apartments.", details: "Current projects: Bole, CMC, Kazanchis." },
            { id: 2, name: "Gift Real Estate", logo: "/images/gift_logo.PNG", about: "Gift Real Estate focuses on luxury villas and gated communities.", details: "Current projects: Gift Village, CMC Phase 2." },
            { id: 3, name: "Ayat Real Estate", logo: "/images/ayat_logo.PNG", about: "One of the pioneers of real estate in Ethiopia.", details: "Current projects: Ayat Zone 1-5, Apartments." },
            { id: 4, name: "Sunshine Real Estate", logo: "/images/sunshine_logo.PNG", about: "Specializing in luxury homes and commercial developments.", details: "Current projects: Marriott Executive Apartments, CMC Villas." },
            { id: 5, name: "Metropolitan Real Estate", logo: "/images/met_logo.PNG", about: "An international developer bringing modern architecture to Ethiopia.", details: "Current projects: Sarbet, Bole Atlantic." },
            { id: 6, name: "Flintstone Homes", logo: "/images/flint_logo.PNG", about: "Affordable luxury for the Ethiopian middle class.", details: "Current projects: Lideta, Gotera." },
            { id: 7, name: "Ovid Real Estate", logo: "/images/ovid_logo.PNG", about: "Ovid is known for rapid construction and modern apartment complexes.", details: "Current projects: Ovid Tower, Gurd Shola, and various residential sites." },
            { id: 8, name: "Temir Properties", logo: "/images/temir_logo.PNG", about: "Temir focuses on high-quality finishing and premium living spaces.", details: "Current projects: Bole and surrounding luxury developments." },
            { id: 9, name: "Bora Real Estate", logo: "/images/bora_logo.PNG", about: "Bora is known for quality residential buildings in prime locations.", details: "Current projects: Bole and Lamberet." },
            { id: 10, name: "Zemen Real Estate", logo: "/images/zemen_logo.PNG", about: "Focused on modern, secure, and comfortable housing.", details: "Current projects: Central district apartments." },
            { id: 11, name: "Tsehay Real Estate", logo: "/images/tsehay_logo.PNG", about: "Known for the 'Polychrome' project at CMC.", details: "Current projects: CMC apartment city." }
        ]
    },
    am: {
        l1: "ታማኝ", l2: "-ቤት", menuBtn: "ዝርዝር",
        navList: "የዝርዝር ማውጫ", navRepo: "የሪፖርት ማውጫ",
        navPost: "ቤት ለመጫን", navAgentReg: "ደላላ ለመመዝገብ",
        langBtn: "English", navAbout: "ስለ እኛ", navVis: "ራዕይ", navMiss: "ተልዕኮ", navVal: "እሴቶች",
        heroH: "ታማኝ የቤት መድረክ", heroP: "ሽያጭ እና የሪል እስቴት መረጃዎች።",
        hTitle: "የሚገኙ ቤቶች", reTitle: "የሪል እስቴት አልሚዎች",
        abH: "ስለ እኛ", abP: "ታማኝ-ቤት በኢትዮጵያ ውስጥ ገዢዎችን እና ሻጮችን በታማኝነት የሚያገናኝ ቀዳሚ ዲጂታል መድረክ ነው።",
        vH: "ራዕያችን", vP: "በምስራቅ አፍሪካ ተመራጭ የሪል እስቴት ድልድይ መሆን።",
        mH: "ተልዕኳችን", mP: "ኢትዮጵያውያን የህልም ቤታቸውን እንዲያገኙ ግልጽነት ያለው አሰራር መዘርጋት።",
        valH: "እሴቶቻችን", valP: "ታማኝነት፣ ቅንነት እና የደንበኛ እርካታ።",
        call: "ደውል", sale: "ለሽያጭ", rent: "ለኪራይ", searchPlaceholder: "ቤቶችን ወይም አልሚዎችን ይፈልጉ...",
        fAll: "ሁሉም", fVilla: "ቪላ", fApart: "አፓርታማ", fLand: "መሬት",
        footerDesc: "የኢትዮጵያ ዲጂታል የሪል እስቴት መድረክ",
        footerCopy: "© 2026 ታማኝ-ቤት | የለማው በ ሰይድ ፍሬው",
        houses: [
            { title: "ዘመናዊ ቪላ - ሲኤምሲ", price: "15 ሚሊዮን ብር", tag: "sale", cat: "Villa" },
            { title: "አፓርታማ - ቦሌ", price: "40ሺ በወር", tag: "rent", cat: "Apartment" },
            { title: "መሬት - ለገጣፎ", price: "5 ሚሊዮን ብር", tag: "sale", cat: "Land" }
        ],
        devs: [
            { id: 1, name: "ኖህ ሪል እስቴት", logo: "/images/noah_logo.PNG", about: "ኖህ በአዲስ አበባ በከፍተኛ ደረጃ አፓርታማዎች የሚታወቅ መሪ አልሚ ነው።", details: "ያሉ ፕሮጀክቶች: ቦሌ፣ ሲኤምሲ፣ ካዛንቺስ።" },
            { id: 2, name: "ጊፍት ሪል እስቴት", logo: "/images/gift_logo.PNG", about: "ጊፍት ሪል እስቴት በቅንጦት ቪላዎች ላይ ያተኩራል።", details: "ያሉ ፕሮጀክቶች: ጊፍት ቪሌጅ፣ ሲኤምሲ ምዕራፍ 2።" },
            { id: 3, name: "አያት ሪል እስቴት", logo: "/images/ayat_logo.PNG", about: "በኢትዮጵያ ውስጥ ከቀዳሚ የሪል እስቴት አልሚዎች አንዱ።", details: "ያሉ ፕሮጀክቶች: አያት ዞን 1-5፣ አፓርታማዎች።" },
            { id: 4, name: "ሳንሻይን ሪል እስቴት", logo: "/images/sunshine_logo.PNG", about: "በቅንጦት ቤቶች እና በንግድ ስራ ላይ የተሰማራ።", details: "ያሉ ፕሮጀክቶች: ማሪዮት አፓርታማዎች፣ ሲኤምሲ ቪላዎች።" },
            { id: 5, name: "ሜትሮፖሊታን ሪል እስቴት", logo: "/images/met_logo.PNG", about: "ዘመናዊ አርክቴክቸርን ወደ ኢትዮጵያ የሚያመጣ ዓለም አቀፍ አልሚ።", details: "ያሉ ፕሮጀክቶች: ሳርቤት፣ አትላንቲክ።" },
            { id: 6, name: "ፍሊንትስቶን ሆምስ", logo: "/images/flint_logo.PNG", about: "መካከለኛ ለሆነው ማህበረሰብ ተመጣጣኝ የቅንጦት ቤቶች።", details: "ያሉ ፕሮጀክቶች: ልደታ፣ ጎተራ።" },
            { id: 7, name: "ኦቪድ ሪል እስቴት", logo: "/images/ovid_logo.PNG", about: "ኦቪድ በፈጣን ግንባታ እና በዘመናዊ አፓርታማዎች የሚታወቅ አልሚ ነው።", details: "ያሉ ፕሮጀክቶች: ኦቪድ ታወር፣ ጉርድ ሾላ እና የተለያዩ የመኖሪያ መንደሮች።" },
            { id: 8, name: "ተምር ፕሮፐርቲስ", logo: "/images/temir_logo.PNG", about: "ተምር ጥራት ባላቸው የማጠናቀቂያ ስራዎች እና በቅንጦት ቤቶች ላይ ያተኩራል።", details: "ያሉ ፕሮጀክቶች: ቦሌ እና አካባቢው ያሉ የቅንጦት አልሚዎች።" },
            { id: 9, name: "ቦራ ሪል እስቴት", logo: "/images/bora_logo.PNG", about: "ቦራ ጥራት ያላቸው የመኖሪያ አፓርታማዎችን በመገንባት ይታወቃል።", details: "ያሉ ፕሮጀክቶች: ቦሌ እና ላምበረት።" },
            { id: 10, name: "ዘመን ሪል እስቴት", logo: "/images/zemen_logo.PNG", about: "ዘመናዊና ደህንነቱ የተጠበቀ የመኖሪያ መፍትሄዎችን በማቅረብ ላይ ያተኩራል።", details: "ያሉ ፕሮጀክቶች: መሃል ከተማ አፓርታማዎች።" },
            { id: 11, name: "ፀሐይ ሪል እስቴት", logo: "/images/tsehay_logo.PNG", about: "በሲኤምሲ በሚገኘው 'ፖሊክሮም' ግዙፍ የአፓርታማ መንደር የሚታወቅ።", details: "ያሉ ፕሮጀክቶች: ሲኤምሲ ፀሐይ መንደር።" }
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

export function renderSidebar() {
    const sideDrawer = document.getElementById("sideDrawer");
    if (!sideDrawer) {
        console.warn("sideDrawer አልተገኘም! የ HTML መዋቅርዎን ያረጋግጡ።");
        return;
    }

    const strings = menuData[currentLang];
    sideDrawer.innerHTML = `
    <div class="drawer-header">
        <button type="button" data-action="toggle-menu" style="border:none; background:none; cursor:pointer; font-size:20px;">
            <i class="fas fa-arrow-left"></i>
        </button>
       <div class="logo">
    <span style="color: #007bff; font-weight: bold;">Tamagn</span><span style="color: #28a745; font-weight: bold;">-Bet</span>
</div>
    </div>
<div class="menu-section">
  <button class="toggle-btn" type="button" data-action="navigate" data-href="../sell.html">
        <span style="display: flex; gap: 10px; align-items: center;">
            <i class="fas fa-tags"></i>
            <span data-key="postproperty">${strings["post property"]}</span>
        </span>
        <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
    </button>
</div>
   <div class="menu-section">
    <button class="toggle-btn" type="button" data-action="navigate" data-href="../buy.html">
        <span style="display: flex; gap: 10px; align-items: center;">
            <i class="fas fa-shopping-cart"></i>
            <span data-key="buy">${strings["buy"]}</span>
        </span>
        <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
    </button>
</div>
<div class="menu-section">
  <button class="toggle-btn" type="button" data-action="navigate" data-href="../sell.html">
        <span style="display: flex; gap: 10px; align-items: center;">
            <i class="fas fa-tags"></i>
            <span data-key="sell">${strings["sell"]}</span>
        </span>
        <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
    </button>
</div>
    <div class="menu-section">
    <button class="toggle-btn" type="button" data-action="navigate" data-href="../fhc.html">
        <span style="display: flex; gap: 10px; align-items: center;">
            <i class="fas fa-city"></i>
            <span data-key="federal-housing-corporation">${strings["federal-housing-corporation"]}</span>
        </span>
        <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
    </button>
</div>
    <div class="menu-section">
        <button class="toggle-btn" type="button" data-action="toggle-section">
            <span><i class="fas fa-hard-hat"></i> <span data-key="real-estate-developers">${strings["real-estate-developers"]}</span></span>
            <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
        </button>
        <div class="submenu">
            <a href="#" class="sub-link">ኖህ ሪል እስቴት</a> <a href="#" class="sub-link">ጊፍት ሪል እስቴት</a>
        </div>
    </div>
 <div class="menu-section">
    <button class="toggle-btn" type="button" data-action="navigate" data-href="../banks.html">
        <span style="display: flex; gap: 10px; align-items: center;">
            <i class="fas fa-university"></i>
            <span data-key="banks">${strings["banks"]}</span>
        </span>
        <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
    </button>
</div>
    <div class="menu-section">
        <button class="toggle-btn" type="button" data-action="toggle-modal" data-modal-id="agentRegModal"><span><i class="fas fa-user-plus"></i> <span data-key="agent-registration">${strings["agent-registration"]}</span></span></button>
    </div>
    <div class="menu-section">
        <button class="toggle-btn" type="button" data-action="toggle-section" style="color:var(--report-red);">
            <span><i class="fas fa-flag"></i> <span data-key="report">${strings["report"]}</span></span>
            <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
        </button>
        <div class="submenu">
            <a href="#" class="sub-link">የውሸት ማስታወቂያ</a>
        </div>
    </div>
    `;
}

export function toggleMenu() {
    const drawer = document.getElementById("sideDrawer");
    const overlay = document.getElementById("overlay");

    if (drawer) {
        drawer.classList.toggle("active");
        console.log("Drawer active class is:", drawer.classList.contains("active"));
    } else {
        alert("ስህተት: sideDrawer የሚባል ID በ HTML ውስጥ የለም!");
    }

    if (overlay) overlay.classList.toggle("active");
}

export function toggleSection(btnElement) {
    const submenu = btnElement.nextElementSibling;
    if (submenu && submenu.classList.contains("submenu")) {
        submenu.style.display = submenu.style.display === "block" ? "none" : "block";
    }
}

export function setCategory(cat, btn) {
    currentCategory = cat;
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filterContent();
}

export function showDevInfo(id) {
    const t = data[currentLang];
    const dev = t.devs.find((d) => d.id === id);
    if (dev) alert(`${dev.name}\n\n${t.navAbout}: ${dev.about}\n\nDetails: ${dev.details}`);
}

function renderGrids(houses, devs) {
    const t = data[currentLang];
    const houseGrid = document.getElementById("houseGrid");
    if (houseGrid) {
        houseGrid.innerHTML = houses.map((h) => `
            <div class="card">
                <div class="tag ${h.tag === "sale" ? "tag-sale" : "tag-rent"}">${h.tag === "sale" ? t.sale : t.rent}</div>
                <div class="card-info">
                    <div class="card-price">${h.price}</div>
                    <div class="card-title">${h.title}</div>
                    <a href="tel:+251911000000" class="btn-call"><i class="fas fa-phone"></i> ${t.call}</a>
                </div>
            </div>`).join("");
    }

    const reGrid = document.getElementById("reGrid");
    if (reGrid) {
        reGrid.innerHTML = devs.map((d) => `
            <div class="card developer-card">
                <div class="dev-logo-container">
                    <img src="${d.logo}" class="dev-logo" alt="${d.name}">
                </div>
                <h3>${d.name}</h3>
                <div class="dev-actions">
                    <button class="btn-info" type="button" data-action="show-dev-info" data-dev-id="${d.id}">Info</button>
                    <a href="tel:+251911000000" class="btn-call"><i class="fas fa-phone"></i> ${t.call}</a>
                </div>
            </div>`).join("");
    }
}

export function filterContent() {
    const input = document.getElementById("searchInput");
    const searchText = input ? input.value.toLowerCase() : "";
    const t = data[currentLang];
    const fHouses = t.houses.filter((h) => h.title.toLowerCase().includes(searchText) && (currentCategory === "All" || h.cat === currentCategory));
    const fDevs = t.devs.filter((d) => d.name.toLowerCase().includes(searchText));
    renderGrids(fHouses, fDevs);
}

function toggleLanguage() {
    currentLang = currentLang === "en" ? "am" : "en";
    renderUI();
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

export function renderUI() {
    const t = data[currentLang];
    const menu = menuData[currentLang];

    document.querySelectorAll("[data-key]").forEach((el) => {
        const key = el.getAttribute("data-key");
        const text = t[key] || menu[key];
        if (text) {
            if (el.tagName === "INPUT") el.placeholder = text;
            else el.textContent = text;
        }
    });

    const mBtn = document.getElementById("menuBtn");
    if (mBtn) mBtn.innerHTML = `<i class="fas fa-bars"></i> ${t.menuBtn}`;

    safeSetText("l1", t.l1);
    safeSetText("l2", t.l2);
    safeSetText("langBtn", t.langBtn);
    safeSetText("heroH", t.heroH);
    safeSetText("heroP", t.heroP);
    safeSetText("hTitle", t.hTitle);
    safeSetText("reTitle", t.reTitle);

    const sInput = document.getElementById("searchInput");
    if (sInput) sInput.placeholder = t.searchPlaceholder;

    safeSetText("fAll", t.fAll);
    safeSetText("fVilla", t.fVilla);
    safeSetText("fApart", t.fApart);
    safeSetText("fLand", t.fLand);
    safeSetText("abH", t.abH);
    safeSetText("abP", t.abP);
    safeSetText("vH", t.vH);
    safeSetText("vP", t.vP);
    safeSetText("mH", t.mH);
    safeSetText("mP", t.mP);
    safeSetText("valH", t.valH);
    safeSetText("valP", t.valP);
    safeSetText("footerDesc", t.footerDesc);
    safeSetText("footerCopy", t.footerCopy);
    filterContent();
}

export function initI18nFeature() {
    document.addEventListener("DOMContentLoaded", () => {
        renderSidebar();
        const langBtn = document.getElementById("langBtn");
        if (langBtn) langBtn.addEventListener("click", toggleLanguage);
        renderUI();
    });

    document.addEventListener("click", (event) => {
        const drawer = document.getElementById("sideDrawer");
        const overlay = document.getElementById("overlay");
        const menuBtn = document.querySelector(".menu-btn");

        if (drawer && overlay && drawer.classList.contains("open")) {
            if (!drawer.contains(event.target) && event.target !== menuBtn) {
                drawer.classList.remove("open");
                overlay.classList.remove("active");
            }
        }
    });
}
