/**
 * Flatten internal links for static hosts (e.g. GitHub Pages in a subpath).
 * "/buy.html" and "../buy.html" become "buy.html". Leaves http(s), #anchors, ?query as-is.
 */
export function normalizeRootPageHref(href) {
    if (!href || typeof href !== "string") return href;
    const t = href.trim();
    if (!t) return t;
    if (/^[a-z][a-z0-9+.-]*:/i.test(t) || t.startsWith("//")) return t;
    if (t.startsWith("#") || t.startsWith("?")) return t;
    let p = t.replace(/^\/+/, "");
    while (p.startsWith("../")) {
        p = p.slice(3);
    }
    return p || "index.html";
}

export function byId(id) {
    return document.getElementById(id);
}

export function getValue(id) {
    const el = byId(id);
    return el ? String(el.value || "").trim() : "";
}

export function setDisplay(elOrId, display) {
    const el = typeof elOrId === "string" ? byId(elOrId) : elOrId;
    if (el) {
        el.style.display = display;
    }
}

export function toggleClass(elOrId, className) {
    const el = typeof elOrId === "string" ? byId(elOrId) : elOrId;
    if (el) {
        el.classList.toggle(className);
    }
}

export function onIfPresent(el, eventName, handler, options) {
    if (el) {
        el.addEventListener(eventName, handler, options);
    }
}

export function onClickActions(handlers) {
    document.addEventListener("click", (event) => {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) {
            return;
        }
        const action = actionEl.getAttribute("data-action");
        const fn = handlers[action];
        if (typeof fn === "function") {
            fn({ event, actionEl });
        }
    });
}
