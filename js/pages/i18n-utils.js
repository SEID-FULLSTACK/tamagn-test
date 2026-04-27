function defaultApplyText(element, text) {
    if (element.tagName === "INPUT") {
        element.placeholder = text;
    } else {
        element.innerText = text;
    }
}

function applyTranslations({
    language,
    translations,
    selector,
    keyAttribute,
    applyText = defaultApplyText
}) {
    document.querySelectorAll(selector).forEach((element) => {
        const key = element.getAttribute(keyAttribute);
        const text = translations[language]?.[key];
        if (typeof text === "string") {
            applyText(element, text);
        }
    });
}

export function createLanguageToggle({
    translations,
    initialLanguage = "am",
    toggleButtonId,
    selector,
    keyAttribute,
    applyText = defaultApplyText,
    getToggleButtonText
}) {
    let currentLanguage = initialLanguage;

    function refreshUI() {
        if (toggleButtonId && typeof getToggleButtonText === "function") {
            const toggleButton = document.getElementById(toggleButtonId);
            if (toggleButton) {
                toggleButton.textContent = getToggleButtonText(currentLanguage, translations);
            }
        }

        applyTranslations({
            language: currentLanguage,
            translations,
            selector,
            keyAttribute,
            applyText
        });
    }

    function toggleLanguage() {
        currentLanguage = currentLanguage === "am" ? "en" : "am";
        refreshUI();
    }

    return {
        toggleLanguage,
        refreshUI,
        getCurrentLanguage: () => currentLanguage
    };
}
