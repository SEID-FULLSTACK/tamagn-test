export function createLanguageToggle({
    translations,
    toggleButtonId,
    selector,
    keyAttribute,
    getToggleButtonText
}) {
    let isAmharic = true;

    function getCurrentLanguage() {
        return isAmharic ? "am" : "en";
    }

    function applyLanguage(lang) {
        const dict = translations[lang];
        if (!dict) {
            return;
        }

        document.querySelectorAll(selector).forEach((el) => {
            const key = el.getAttribute(keyAttribute);
            if (!key || !dict[key]) {
                return;
            }
            if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
                el.placeholder = dict[key];
            } else {
                el.textContent = dict[key];
            }
        });

        const btn = document.getElementById(toggleButtonId);
        if (btn && typeof getToggleButtonText === "function") {
            btn.textContent = getToggleButtonText(lang, translations);
        }
    }

    function refreshUI() {
        applyLanguage(getCurrentLanguage());
    }

    function toggleLanguage() {
        isAmharic = !isAmharic;
        applyLanguage(getCurrentLanguage());
    }

    return { toggleLanguage, refreshUI, getCurrentLanguage };
}
