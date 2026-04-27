import { onClickActions, toggleClass } from "./page-utils.js";
import { createLanguageToggle } from "./i18n-utils.js";

function toggleSidebar() {
    toggleClass("sidebar", "active");
}

const translations = {
    am: {
        services: "አገልግሎቶች",
        tender: "ጨረታ መከታተያ",
        docs: "ሰነዶች",
        guidelines: "መመሪያወች",
        apply_housing: "ለመኖሪያ ቤት ያመልክቱ",
        rent_pay: "የኪራይ ክፍያ",
        repair: "ጥገና",
        house_rent: "የቤት ኪራይ",
        projects: "ፕሮጀክቶች",
        planned: "የታቀዱ ፕሮጀክቶች",
        completed_proj: "የተጠናቀቁ ፕሮጀክቶች",
        logout: "Logout",
        welcome: "እንኳን ደህና መጡ!",
        in_progress: "በሂደት ላይ",
        completed: "የተጠናቀቀ",
        tasks: "ተሰኪዎች"
    },
    en: {
        services: "Services",
        tender: "Tender Tracking",
        docs: "Documents",
        guidelines: "Guidelines",
        apply_housing: "Apply for Housing",
        rent_pay: "Rent Payment",
        repair: "Maintenance",
        house_rent: "House Rent",
        projects: "Projects",
        planned: "Planned Projects",
        completed_proj: "Completed Projects",
        logout: "Logout",
        welcome: "Welcome!",
        in_progress: "In Progress",
        completed: "Completed",
        tasks: "Tasks"
    }
};

const { toggleLanguage } = createLanguageToggle({
    translations,
    toggleButtonId: "lang-toggle-btn",
    selector: "[data-i18n]",
    keyAttribute: "data-i18n",
    getToggleButtonText: (language) => (language === "am" ? "English" : "አማርኛ")
});

onClickActions({
    "fhc-toggle-sidebar": () => {
        toggleSidebar();
    },
    "fhc-toggle-language": () => {
        toggleLanguage();
    }
});
