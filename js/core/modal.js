export function toggleModal(id) {
    const modal = document.getElementById(id);
    if (!modal) {
        console.error("Missing Modal ID: " + id);
        return;
    }

    modal.style.display = modal.style.display === "none" || modal.style.display === "" ? "block" : "none";
}

export function initGlobalModalCloseHandler() {
    window.addEventListener("click", (event) => {
        const target = event.target;
        if (target && (target.classList?.contains("modal") || target.id === "authModal")) {
            target.style.display = "none";
        }
    });
}
