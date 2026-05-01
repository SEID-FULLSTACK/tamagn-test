/**
 * Bootstraps the hybrid mortgage calculator on pages that include #hybrid-calculator-container.
 * Dashboard mounts separately via dashboard.js (embed + i18n sync).
 */
import { mountHybridMortgageCalculator } from "./hybrid-mortgage-calculator.js";

function mountFromDom() {
    const el = document.getElementById("hybrid-calculator-container");
    if (!el) {
        console.warn("[Tamagn] hybrid-calculator-container not found — calculator not mounted");
        return;
    }
    const opts = window.__TAMAGN_CALC_OPTIONS__ && typeof window.__TAMAGN_CALC_OPTIONS__ === "object" ? window.__TAMAGN_CALC_OPTIONS__ : {};
    mountHybridMortgageCalculator(el, opts);
    console.log("Calculator Loaded");
}

document.addEventListener("DOMContentLoaded", () => {
    mountFromDom();
}, { once: true });
