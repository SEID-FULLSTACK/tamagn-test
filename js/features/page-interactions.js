export function initPageInteractions({
    toggleMenu,
    toggleModal,
    handleCategoryChange,
    toggleImageInput,
    setCategory,
    calculateEverything,
    closeModal,
    toggleChat,
    sendMessage,
    closeAuthModal,
    showForm,
    filterContent,
    toggleSection,
    showDevInfo,
    showPropertyDetails
}) {
    document.addEventListener("click", (event) => {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) return;

        const { action } = actionEl.dataset;

        if (action === "toggle-menu") {
            toggleMenu();
            return;
        }

        if (action === "navigate") {
            const href = actionEl.dataset.href;
            if (href) window.location.href = href;
            return;
        }

        if (action === "toggle-modal") {
            const modalId = actionEl.dataset.modalId;
            if (modalId) toggleModal(modalId);
            return;
        }

        if (action === "close-post-payment") {
            const paymentModal = document.getElementById("postPaymentModal");
            if (paymentModal) paymentModal.style.display = "none";
            return;
        }

        if (action === "toggle-section") {
            toggleSection(actionEl);
            return;
        }

        if (action === "set-category") {
            const category = actionEl.dataset.category;
            if (category) setCategory(category, actionEl);
            return;
        }

        if (action === "close-details-modal") {
            closeModal();
            return;
        }

        if (action === "toggle-chat") {
            toggleChat();
            return;
        }

        if (action === "send-chat-message") {
            sendMessage();
            return;
        }

        if (action === "close-auth-modal") {
            closeAuthModal();
            return;
        }

        if (action === "show-form") {
            const form = actionEl.dataset.form;
            if (form) showForm(form);
            return;
        }

        if (action === "show-dev-info") {
            const id = Number(actionEl.dataset.devId);
            if (!Number.isNaN(id)) showDevInfo(id);
            return;
        }

        if (action === "show-property-details") {
            const propertyId = actionEl.dataset.propertyId;
            if (propertyId) showPropertyDetails(propertyId);
        }
    });

    const propertyTypeSelect = document.getElementById("pDeveloper");
    if (propertyTypeSelect) {
        propertyTypeSelect.addEventListener("change", handleCategoryChange);
    }

    const imageOptionSelect = document.getElementById("imageOption");
    if (imageOptionSelect) {
        imageOptionSelect.addEventListener("change", toggleImageInput);
    }

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", filterContent);
    }

    const calcInputIds = ["housePrice", "downPaymentPercent", "interestRate", "loanTerm"];
    calcInputIds.forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.addEventListener("input", calculateEverything);
    });

    document.querySelectorAll('input[name="loanType"]').forEach((input) => {
        input.addEventListener("change", calculateEverything);
    });
}
