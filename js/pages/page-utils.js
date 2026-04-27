export function byId(id) {
    return document.getElementById(id);
}

export function getValue(id, fallback = "") {
    const element = byId(id);
    return element ? element.value : fallback;
}

export function setDisplay(target, display) {
    const element = typeof target === "string" ? byId(target) : target;
    if (element) {
        element.style.display = display;
    }
}

export function toggleClass(target, className) {
    const element = typeof target === "string" ? byId(target) : target;
    if (element) {
        element.classList.toggle(className);
    }
}

export function onIfPresent(element, eventName, handler) {
    if (element) {
        element.addEventListener(eventName, handler);
    }
}

export function onClickActions(actionHandlers) {
    document.addEventListener("click", (event) => {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) {
            return;
        }

        const action = actionEl.dataset.action;
        const handler = actionHandlers[action];
        if (typeof handler === "function") {
            handler({ event, actionEl });
        }
    });
}
