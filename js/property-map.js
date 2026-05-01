/**
 * Shared property map — Leaflet + OpenStreetMap (no API key).
 */

const DEFAULT_CENTER = { lat: 9.032, lng: 38.7489 };
const ZOOM_STREET = 15;
const ZOOM_AREA = 12;

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_UMD = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let leafletCssPromise = null;
let leafletLoadPromise = null;
let leafletIconsFixed = false;

function resolveLeafletGlobal(Lcandidate) {
    if (Lcandidate?.Icon?.Default && typeof Lcandidate.map === "function") {
        return Lcandidate;
    }
    if (typeof window !== "undefined" && window.L?.Icon?.Default && typeof window.L.map === "function") {
        return window.L;
    }
    return null;
}

function fixLeafletDefaultIcons(Lref) {
    if (leafletIconsFixed) return;
    const L = resolveLeafletGlobal(Lref);
    if (!L?.Icon?.Default?.prototype) {
        return;
    }
    leafletIconsFixed = true;
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
}

function ensureLeafletCss() {
    if (document.querySelector('link[href*="leaflet"][rel="stylesheet"]')) {
        return Promise.resolve();
    }
    if (!leafletCssPromise) {
        leafletCssPromise = new Promise((resolve, reject) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = LEAFLET_CSS;
            link.crossOrigin = "";
            link.onload = () => resolve();
            link.onerror = () => {
                leafletCssPromise = null;
                reject(new Error("Failed to load Leaflet CSS"));
            };
            document.head.appendChild(link);
        });
    }
    return leafletCssPromise;
}

function loadLeafletUmd() {
    return new Promise((resolve, reject) => {
        const existing = resolveLeafletGlobal(typeof window !== "undefined" ? window.L : null);
        if (existing) return resolve(existing);

        if (document.querySelector('script[data-tamagn-leaflet-umd="1"]')) {
            let attempts = 0;
            const t = setInterval(() => {
                const L = resolveLeafletGlobal(typeof window !== "undefined" ? window.L : null);
                if (L) {
                    clearInterval(t);
                    resolve(L);
                    return;
                }
                if (++attempts > 200) {
                    clearInterval(t);
                    reject(new Error("Leaflet UMD did not initialize"));
                }
            }, 25);
            return;
        }

        const script = document.createElement("script");
        script.src = LEAFLET_UMD;
        script.async = true;
        script.crossOrigin = "";
        script.setAttribute("data-tamagn-leaflet-umd", "1");
        script.onload = () => {
            const L = resolveLeafletGlobal(typeof window !== "undefined" ? window.L : null);
            if (L) resolve(L);
            else reject(new Error("Leaflet UMD loaded but window.L is invalid"));
        };
        script.onerror = () => reject(new Error("Failed to load Leaflet script"));
        document.head.appendChild(script);
    });
}

async function ensureLeaflet() {
    await ensureLeafletCss();
    const sync = resolveLeafletGlobal(typeof window !== "undefined" ? window.L : null);
    if (sync) return sync;

    if (!leafletLoadPromise) {
        leafletLoadPromise = loadLeafletUmd().catch((e) => {
            leafletLoadPromise = null;
            throw e;
        });
    }
    return leafletLoadPromise;
}

function createSvgPinIcon(Lref) {
    const L = resolveLeafletGlobal(Lref);
    if (!L || typeof L.divIcon !== "function") return null;
    const html = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" aria-hidden="true"><path fill="#006AFF" d="M18 1.5C9.99 1.5 3.25 7.68 3.25 15.42c0 5.42 6.32 17.55 12.88 28.88a1.7 1.7 0 0 0 3.04.02C25.8 33.12 32.75 21.04 32.75 15.42 32.75 7.68 26.01 1.5 18 1.5z"/><circle cx="18" cy="15" r="5" fill="#fff"/></svg>`;
    return L.divIcon({
        className: "tamagn-leaflet-svg-marker",
        html,
        iconSize: [36, 48],
        iconAnchor: [18, 48],
        popupAnchor: [0, -44],
    });
}

function pickNumber(...vals) {
    for (const v of vals) {
        if (v === null || v === undefined || v === "") continue;
        const n = typeof v === "number" ? v : parseFloat(String(v).trim());
        if (Number.isFinite(n)) return n;
    }
    return null;
}

/**
 * @param {Record<string, unknown>} d
 * @returns {{ lat: number, lng: number } | null}
 */
export function extractLatLng(d) {
    if (!d || typeof d !== "object") return null;

    const geo = d.geo;
    const coords = d.coordinates;
    let lat = pickNumber(d.lat, d.latitude, d.Lat, geo?.lat, geo?.latitude, coords?.latitude, coords?.lat);
    let lng = pickNumber(d.lng, d.longitude, d.lon, d.Lng, geo?.lng, geo?.longitude, coords?.longitude, coords?.lng);

    if ((lat == null || lng == null) && typeof geo?.latitude === "function") {
        try {
            lat = geo.latitude();
            lng = geo.longitude();
        } catch {
            /* ignore */
        }
    }

    if ((lat == null || lng == null) && d.location && typeof d.location === "object") {
        const loc = d.location;
        const la =
            typeof loc.latitude === "number"
                ? loc.latitude
                : typeof loc.lat === "number"
                  ? loc.lat
                  : pickNumber(loc.latitude, loc.lat);
        const ln =
            typeof loc.longitude === "number"
                ? loc.longitude
                : typeof loc.lng === "number"
                  ? loc.lng
                  : pickNumber(loc.longitude, loc.lng);
        if (la != null && ln != null) {
            lat = la;
            lng = ln;
        }
    }

    if (lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
    }
    return null;
}

function str(v) {
    if (v === null || v === undefined) return "";
    return String(v).trim();
}

/**
 * @param {Record<string, unknown>} d
 */
export function buildGeocodeQuery(d) {
    const loc =
        typeof d.location === "string"
            ? str(d.location)
            : typeof d.location === "object" && d.location !== null && typeof d.location.latitude === "number"
              ? ""
              : str(d.location);
    const addr = str(d.address);
    const city = str(d.city);
    const sub =
        str(d.subCity) ||
        str(d.subcity) ||
        str(d.sub_city) ||
        str(d.subCityName);
    const woreda = str(d.woreda);

    const parts = [];
    if (loc) parts.push(loc);
    if (addr && addr !== loc) parts.push(addr);
    if (sub) parts.push(sub);
    if (city) parts.push(city);
    if (woreda && !parts.some((p) => p.includes(woreda))) parts.push(woreda);

    const core = parts.filter(Boolean).join(", ");
    if (core) return `${core}, Ethiopia`;
    return "Addis Ababa, Ethiopia";
}

/**
 * @param {Record<string, unknown>} d
 */
export function normalizePropertyDataForMap(d) {
    if (!d || typeof d !== "object") return {};
    const out = { ...d };
    const ll = extractLatLng(d);
    if (ll) {
        out.lat = ll.lat;
        out.lng = ll.lng;
    }
    return out;
}

async function geocodeWithNominatim(query) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: { Accept: "application/json" },
            referrerPolicy: "strict-origin-when-cross-origin",
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!Array.isArray(data) || !data[0]) return null;
        const la = parseFloat(data[0].lat);
        const ln = parseFloat(data[0].lon);
        if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
        return { lat: la, lng: ln };
    } catch {
        return null;
    }
}

function scheduleMapResize(map) {
    const run = () => {
        try {
            map.invalidateSize();
        } catch {
            /* ignore */
        }
    };
    requestAnimationFrame(run);
    requestAnimationFrame(() => requestAnimationFrame(run));
    [50, 120, 280, 450, 650].forEach((ms) => setTimeout(run, ms));
}

function ensurePropertyMapChromeStyles() {
    if (document.getElementById("tamagn-gmaps-chrome")) return;
    const el = document.createElement("style");
    el.id = "tamagn-gmaps-chrome";
    el.textContent = `
#google-map .tamagn-gmaps-surface,
#buy-property-map-host .tamagn-gmaps-surface {
    width: 100%;
    height: 100%;
    min-height: 300px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}
#google-map .tamagn-leaflet-svg-marker,
#buy-property-map-host .tamagn-leaflet-svg-marker {
    background: transparent !important;
    border: none !important;
}
#google-map .tamagn-leaflet-svg-marker svg,
#buy-property-map-host .tamagn-leaflet-svg-marker svg {
    display: block;
    width: 36px;
    height: 48px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
}
#google-map .leaflet-container,
#buy-property-map-host .leaflet-container {
    width: 100%;
    height: 100%;
    min-height: 300px;
    font: inherit;
}
`;
    document.head.appendChild(el);
}

/**
 * @param {HTMLElement | null} hostEl
 */
export function clearPropertyMap(hostEl) {
    if (!hostEl) return;
    const st = hostEl.__tamagnPropertyMap;
    if (st?.map) {
        try {
            st.map.remove();
        } catch {
            /* ignore */
        }
    }
    hostEl.__tamagnPropertyMap = null;
    hostEl.innerHTML = "";
}

/**
 * @param {HTMLElement | null} hostEl
 * @param {Record<string, unknown>} propertyData
 */
export async function renderPropertyMap(hostEl, propertyData) {
    if (!hostEl || !(hostEl instanceof HTMLElement)) return;
    if (!hostEl.isConnected) return;

    clearPropertyMap(hostEl);
    ensurePropertyMapChromeStyles();

    const inner = document.createElement("div");
    inner.className = "tamagn-gmaps-surface";
    inner.style.width = "100%";
    inner.style.height = "100%";
    inner.style.minHeight = "300px";
    hostEl.appendChild(inner);

    let L;
    try {
        L = await ensureLeaflet();
    } catch (e) {
        console.error("[property-map] Leaflet load failed:", e);
        inner.textContent = "Map could not be loaded.";
        return;
    }

    L = resolveLeafletGlobal(L);
    if (!L?.map || typeof L.divIcon !== "function") {
        inner.textContent = "Map could not be loaded.";
        return;
    }

    fixLeafletDefaultIcons(L);
    const pinIcon = createSvgPinIcon(L);

    const map = L.map(inner).setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], ZOOM_AREA);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], pinIcon ? { icon: pinIcon } : {}).addTo(map);

    hostEl.__tamagnPropertyMap = { map, marker };
    scheduleMapResize(map);

    const coords = extractLatLng(propertyData);
    if (coords) {
        marker.setLatLng([coords.lat, coords.lng]);
        map.setView([coords.lat, coords.lng], ZOOM_STREET);
        scheduleMapResize(map);
        return;
    }

    const query = buildGeocodeQuery(propertyData);
    const hasPreciseAddress = Boolean(str(propertyData.location) || str(propertyData.address));
    const pos = await geocodeWithNominatim(query);

    const st = hostEl.__tamagnPropertyMap;
    if (!st?.map || !st?.marker) return;

    if (pos) {
        st.marker.setLatLng([pos.lat, pos.lng]);
        st.map.setView([pos.lat, pos.lng], hasPreciseAddress ? ZOOM_STREET : ZOOM_AREA);
    } else {
        st.marker.setLatLng([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]);
        st.map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], ZOOM_AREA);
        console.warn("[property-map] Geocode failed:", query);
    }
    scheduleMapResize(st.map);
}
