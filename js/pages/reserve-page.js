import { byId, getValue, onClickActions, onIfPresent, setDisplay } from "./page-utils.js";

function handleCategoryChange() {
    const val = getValue("pDeveloper");
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
    const option = getValue("imageOption");
    setDisplay("urlInputArea", option === "link" ? "block" : "none");
    setDisplay("fileInputArea", option === "upload" ? "block" : "none");
}

const propertyTypeSelect = byId("pDeveloper");
onIfPresent(propertyTypeSelect, "change", handleCategoryChange);

const imageOptionSelect = byId("imageOption");
onIfPresent(imageOptionSelect, "change", toggleImageInput);

const propertyForm = byId("propertyForm");
onIfPresent(propertyForm, "submit", (e) => {
    e.preventDefault();
    setDisplay("postPaymentModal", "flex");
});

onClickActions({
    "reserve-close-post-payment": () => {
        setDisplay("postPaymentModal", "none");
    }
});
