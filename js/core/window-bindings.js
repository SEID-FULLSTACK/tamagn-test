export function registerGlobalHandlers(handlers) {
    Object.entries(handlers).forEach(([name, fn]) => {
        if (typeof window[name] !== "function") {
            window[name] = fn;
        }
    });
}
