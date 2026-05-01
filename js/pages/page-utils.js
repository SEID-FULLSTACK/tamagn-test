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
