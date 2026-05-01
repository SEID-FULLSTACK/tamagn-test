/** Shared listing image URL resolution + fallback for property cards (Firestore field names vary). */

export const LISTING_IMAGE_PLACEHOLDER =
    "https://placehold.co/800x520/f1f5f9/64748b/png?text=No+Image+Available";

const PLACEHOLDER_URL_MARKERS = [
    "placehold.co",
    "via.placeholder.com",
    "placeholder.com",
    "dummyimage.com",
    "fakeimg.pl",
    "no+image",
    "no%2bimage",
    "no%20image",
    "no-image",
];

function tryStr(v) {
    if (v == null || v === "") return null;
    const s = String(v).trim();
    return s.length ? s : null;
}

function firstArrayUrl(arr) {
    if (!Array.isArray(arr) || !arr.length) return null;
    return tryStr(arr[0]);
}

function pickRawListingImageUrl(data) {
    if (!data || typeof data !== "object") return null;

    return (
        tryStr(data.imageUrl) ||
        tryStr(data.imageURL) ||
        tryStr(data.image_url) ||
        tryStr(data.photoUrl) ||
        tryStr(data.photoURL) ||
        tryStr(data.coverImage) ||
        tryStr(data.cover_image) ||
        tryStr(data.thumbnailUrl) ||
        tryStr(data.thumbnail) ||
        tryStr(data.img) ||
        tryStr(data.image) ||
        firstArrayUrl(data.images) ||
        firstArrayUrl(data.photos) ||
        tryStr(typeof data.media === "object" && data.media && data.media.url) ||
        null
    );
}

/**
 * First non-empty image field, or null (no synthetic placeholder).
 * @param {Record<string, unknown>} data
 * @returns {string|null}
 */
export function getRawListingImageUrl(data) {
    return pickRawListingImageUrl(data);
}

/**
 * @param {string|null|undefined} url
 * @returns {boolean} true when URL is missing or not a real listing photo
 */
export function isPlaceholderOrInvalidImageUrl(url) {
    if (url == null) return true;
    const s = String(url).trim();
    if (!s.length) return true;
    const lower = s.toLowerCase();
    if (lower === LISTING_IMAGE_PLACEHOLDER.toLowerCase()) return true;
    if (lower.startsWith("data:") || lower.startsWith("blob:")) return true;

    const looksNetwork = lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("//");
    const looksSiteRelative = lower.startsWith("/");

    if (!looksNetwork && !looksSiteRelative) return true;

    for (const m of PLACEHOLDER_URL_MARKERS) {
        if (lower.includes(m)) return true;
    }
    return false;
}

/**
 * Listing is eligible for public marketing grids (not explicitly hidden / unpublished).
 * Documents without these fields are treated as public (legacy).
 * @param {Record<string, unknown>|null|undefined} data
 */
export function isPublicListingEligible(data) {
    if (!data || typeof data !== "object") return false;
    if (data.visibility === "hidden") return false;
    if (data.published === false) return false;
    return true;
}

/**
 * Use on buyer-facing grids: visible/published and a non-placeholder image URL.
 * @param {Record<string, unknown>|null|undefined} data
 */
export function hasValidListingImageForPublicGrid(data) {
    if (!isPublicListingEligible(data)) return false;
    const raw = getRawListingImageUrl(data);
    if (!raw) return false;
    return !isPlaceholderOrInvalidImageUrl(raw);
}

/**
 * Firestore write helper: keep listings hidden until a real image URL exists.
 * @param {Record<string, unknown>} data — any subset that includes image fields (imageUrl, img, …)
 * @returns {{ visibility: string, published: boolean }}
 */
export function publicationStateFromImageData(data) {
    const raw = getRawListingImageUrl(data);
    const ok = Boolean(raw && !isPlaceholderOrInvalidImageUrl(raw));
    return {
        visibility: ok ? "visible" : "hidden",
        published: ok,
    };
}

/**
 * @param {Record<string, unknown>} data
 * @returns {string}
 */
export function resolveListingImageUrl(data) {
    return pickRawListingImageUrl(data) || LISTING_IMAGE_PLACEHOLDER;
}

/** Safe for double-quoted HTML attributes (src=...) */
export function escapeAttrUrl(url) {
    return String(url ?? "").replace(/"/g, "&quot;");
}

/** Full onerror attribute string for <img>; prevents infinite error loop. */
export function listingImageOnerrorAttr() {
    const safe = LISTING_IMAGE_PLACEHOLDER.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    return `onerror="this.onerror=null;this.src='${safe}'"`;
}
