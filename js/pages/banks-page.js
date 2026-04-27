import { byId, onClickActions, onIfPresent, toggleClass } from "./page-utils.js";
import { createLanguageToggle } from "./i18n-utils.js";

const translations = {
    am: {
        dashboard: "ዳሽቦርድ",
        tenders_list: "የጨረታዎች ዝርዝር",
        list_desc: "ሁሉም በስርዓቱ ውስጥ ያሉ ንቁ ጨረታዎች።",
        post_tender: "ጨረታ ይለጥፉ",
        register_vendor: "አቅራቢ ይመዝግቡ",
        logout: "መውጫ",
        welcome: "ወደ Tamagn Bet በሰላም መጡ!",
        in_progress: "በሂደት ላይ",
        completed: "የተጠናቀቀ",
        house_tender: "የቤት ጨረታ",
        car_tender: "የመኪና ጨረታ",
        stationery_tender: "የፅህፈት መሳሪያ",
        elec_tender: "የኢሌክትሮኒክ ጨረታ",
        office_tender: "የቢሮ እቃወች",
        title: "የጨረታ ርዕስ",
        category: "ምድብ",
        post: "ጨረታውን ይለጥፉ",
        company_name: "የድርጅት ስም",
        register: "ይመዝገቡ",
        bank_name: "ባንክ ይምረጡ",
        tender_cats: "የጨረታ ምድቦች",
        actions: "ተግባራት",
        starting_price: "መነሻ ዋጋ",
        closing_date: "የሚጠናቀቀቅበት ቀን",
        tender_images: "የጨረታ ምስሎች (JPG, PNG)",
        tender_doc: "የጨረታ ሰነድ (PDF, Word)",
        desc_house: "ቦሌ ለቡ አካባቢ የሚገኝ መኖሪያ ቤት ጨረታ ቁጥር 001።",
        desc_car: "Toyota Hilux 2022 ሞዴል፣ በጥሩ ሁኔታ ላይ የሚገኝ።",
        desc_stationery: "የ2017 በጀት ዓመት የቢሮ ስቴሽነሪ አቅርቦቶች።",
        desc_elec: "የላፕቶፕ እና የዴስክቶፕ ኮምፒውተሮች ግዢ።",
        desc_office: "የቢሮ ወንበሮች፣ ጠረጴዛዎች እና ካቢኔቶች።"
    },
    en: {
        dashboard: "Dashboard",
        tenders_list: "Tenders List",
        list_desc: "All active tenders in the system.",
        post_tender: "Post Tender",
        register_vendor: "Register Vendor",
        logout: "Logout",
        welcome: "Welcome to Tamagn Bet!",
        in_progress: "In Progress",
        completed: "Completed",
        house_tender: "House Tender",
        car_tender: "Car Tender",
        stationery_tender: "Stationery Tender",
        elec_tender: "Electronics Tender",
        office_tender: "Office Supplies",
        title: "Tender Title",
        category: "Category",
        post: "Post Tender",
        company_name: "Company Name",
        register: "Register",
        bank_name: "Select Bank",
        tender_cats: "Tender Categories",
        actions: "Actions",
        starting_price: "Starting Price",
        closing_date: "Closing Date",
        tender_images: "Tender Images (JPG, PNG)",
        tender_doc: "Tender Document (PDF, Word)",
        desc_house: "Residential house at Bole Lebu, Tender No 001.",
        desc_car: "Toyota Hilux 2022 model, in good condition.",
        desc_stationery: "2017 Fiscal year office supplies.",
        desc_elec: "Procurement of laptops and desktops.",
        desc_office: "Office chairs, desks and cabinets."
    }
};

function toggleSidebar() {
    toggleClass("sidebar", "active");
}

function showPage(pageId) {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    const page = byId(pageId);
    if (page) {
        page.classList.add("active");
    }
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

const { toggleLanguage } = createLanguageToggle({
    translations,
    toggleButtonId: "lang-btn",
    selector: "[data-i18n]",
    keyAttribute: "data-i18n",
    getToggleButtonText: (language) => (language === "am" ? "English" : "አማርኛ")
});

function previewImages(input) {
    const previewContainer = byId("imagePreview");
    previewContainer.innerHTML = "";

    if (input.files) {
        Array.from(input.files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewItem = document.createElement("div");
                previewItem.classList.add("image-preview-item");
                const img = document.createElement("img");
                img.src = e.target.result;
                previewItem.appendChild(img);
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }
}

onClickActions({
    "banks-toggle-sidebar": () => {
        toggleSidebar();
    },
    "banks-toggle-language": () => {
        toggleLanguage();
    },
    "banks-show-page": ({ event, actionEl }) => {
        event.preventDefault();
        const pageId = actionEl.dataset.pageId;
        if (pageId) {
            showPage(pageId);
        }
    }
});

const tenderImagesInput = byId("tenderImages");
onIfPresent(tenderImagesInput, "change", (event) => {
    previewImages(event.target);
});
