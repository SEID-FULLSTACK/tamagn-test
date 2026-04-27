const PROPERTY_STATUS_STYLE_ID = "property-status-badge-styles";

const STATUS_CLASS_MAP = {
    selling: "status-selling",
    renting: "status-renting",
    sold: "status-sold"
};

const DEFAULT_STATUS_LABELS = {
    selling: "Selling",
    renting: "Renting",
    sold: "Sold"
};

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function normalizePropertyStatus(statusValue) {
    const normalized = String(statusValue || "selling").toLowerCase();
    return Object.prototype.hasOwnProperty.call(STATUS_CLASS_MAP, normalized) ? normalized : "selling";
}

export function ensurePropertyStatusBadgeStyles() {
    if (typeof document === "undefined") {
        return;
    }

    if (document.getElementById(PROPERTY_STATUS_STYLE_ID)) {
        return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = PROPERTY_STATUS_STYLE_ID;
    styleElement.textContent = `
.tamagn-card,
.listing-card {
    position: relative;
}

.property-status-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    padding: 6px 11px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.15);
}

.status-selling {
    color: #ecfff5;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.6), rgba(5, 150, 105, 0.5));
}

.status-renting {
    color: #eff7ff;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.58), rgba(37, 99, 235, 0.48));
}

.status-sold {
    color: #fff1f2;
    background: linear-gradient(135deg, rgba(127, 29, 29, 0.56), rgba(75, 85, 99, 0.56));
}
`;

    document.head.appendChild(styleElement);
}

export function getPropertyStatusBadgeMeta(statusValue, options = {}) {
    const normalizedStatus = normalizePropertyStatus(statusValue);
    const labels = options.labels || DEFAULT_STATUS_LABELS;
    const label = labels[normalizedStatus] || DEFAULT_STATUS_LABELS[normalizedStatus];

    return {
        status: normalizedStatus,
        className: STATUS_CLASS_MAP[normalizedStatus],
        label
    };
}

export function renderPropertyStatusBadge(statusValue, options = {}) {
    const badgeMeta = getPropertyStatusBadgeMeta(statusValue, options);

    return `<span class="property-status-badge ${badgeMeta.className}" data-property-status="${badgeMeta.status}">${escapeHtml(badgeMeta.label)}</span>`;
}
