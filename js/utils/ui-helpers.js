function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

export function ensurePropertyStatusBadgeStyles() {
    if (document.getElementById("property-status-badge-styles")) {
        return;
    }
    const style = document.createElement("style");
    style.id = "property-status-badge-styles";
    style.textContent = `
    .property-status-badge {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      z-index: 2;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      padding: 0.3rem 0.65rem;
      border-radius: 9999px;
      background: rgba(255,255,255,0.95);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .property-status-badge--selling { color: #006AFF; }
    .property-status-badge--renting { color: #059669; }
    .property-status-badge--sold { color: #6B7280; }
  `;
    document.head.appendChild(style);
}

export function renderPropertyStatusBadge(status, { labels }) {
    const normalized = String(status || "selling").toLowerCase();
    const key = ["selling", "renting", "sold"].includes(normalized) ? normalized : "selling";
    const label = labels?.[key] ?? labels?.selling ?? key;
    return `<span class="property-status-badge property-status-badge--${key}">${escapeHtml(label)}</span>`;
}
