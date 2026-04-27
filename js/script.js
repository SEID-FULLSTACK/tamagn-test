
// App bootstrap and global handler registration
import {
    initListingsFeature,
    handleCategoryChange,
    toggleImageInput,
    showPropertyDetails,
    loadTamagnListings,
    closeModal
} from "./features/listings.js";
import {
    initI18nFeature,
    toggleMenu,
    toggleSection,
    setCategory,
    showDevInfo,
    filterContent
} from "./features/i18n.js";
import {
    initChatAuthFeature,
    toggleChat,
    sendMessage,
    showForm,
    openAuthModal,
    closeAuthModal
} from "./features/chat-auth.js";
import { initCalculatorFeature, calculateEverything } from "./features/calculator.js";
import { initHomePropertiesFeature } from "./features/home-properties.js";
import { initPageInteractions } from "./features/page-interactions.js";
import { toggleModal, initGlobalModalCloseHandler } from "./core/modal.js";
import { registerGlobalHandlers } from "./core/window-bindings.js";

initListingsFeature();
initI18nFeature();
initChatAuthFeature({ toggleModal });
initCalculatorFeature();
initHomePropertiesFeature();
initGlobalModalCloseHandler();
initPageInteractions({
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
});

registerGlobalHandlers({
    toggleModal,
    toggleMenu,
    toggleSection,
    setCategory,
    showDevInfo,
    openDevInfo: showDevInfo,
    handleCategoryChange,
    toggleImageInput,
    showPropertyDetails,
    loadTamagnListings,
    closeModal,
    toggleChat,
    sendMessage,
    showForm,
    openAuthModal,
    closeAuthModal,
    calculateEverything,
    filterContent
});
