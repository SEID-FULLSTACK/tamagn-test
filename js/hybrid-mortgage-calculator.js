/**
 * Shared dual-mode mortgage / Murabaha-style calculator (conventional vs interest-free).
 * Mount into any container; uses namespaced IDs per instance.
 */

const STRINGS = {
    am: {
        title: "የቤት ብድር / ፋይናንስ ካልኩሌተር",
        mode_conventional: "መደበኛ",
        mode_interest_free: "ከወለድ ነፃ",
        panel_afford: "ምን ያህል መግዛት ትችላለህ?",
        panel_finance: "ብድር / ወርሃዊ ክፍያ",
        lang_en: "English",
        lang_am: "አማርኛ",
        monthly_income: "ወርሃዊ ገቢ (ብር)",
        housing_ratio: "የቤት ክፍያ ከገቢ (% )",
        housing_ratio_friendly: "ለቤት ከወርሃዊ ገብዎ ምን ያህል (%)?",
        down_pct: "የቅድመ ክፍያ (%)",
        down_pct_friendly: "ቅድመ ክፍያ — የቤቱ ምን ያህል (%)?",
        term_years: "የክፍያ ጊዜ (ዓመት)",
        interest_annual: "ዓመታዊ ወለድ (%)",
        profit_margin: "የባንክ ትርፍ ማርካፕ (%)",
        profit_rate: "የትርፍ መጠን (%)",
        advanced: "የላቀ / ዝርዝር",
        hero_afford_label: "የሚቻልዎት ከፍተኛ የቤት ዋጋ",
        hero_finance_label: "ግምታ ወርሃዊ ክፍያ",
        house_price: "የቤቱ ዋጋ (ብር)",
        max_monthly: "የሚያገለግል ወርሃዊ ክፍያ ጣሪያ",
        max_loan: "የተፈቀደ የባንክ መጠን",
        max_price: "የተፈቀደ ከፍተኛ የቤት ዋጋ",
        monthly_payment: "ወርሃዊ ክፍያ",
        res_house: "የቤቱ ዋጋ",
        res_down: "ቅድመ ክፍያ",
        res_loan: "የባንክ መገልገያ",
        res_total_interest: "ጠቅላላ ወለድ",
        res_bank_profit: "ጠቅላላ የባንክ ትርፍ",
        res_total_pay: "ጠቅላላ ክፍያ",
        helper_margin: "ከወለድ ነፃ፦ ትርፉ በተመደበው መጠን ላይ ያለ ማርካፕ ነው፣ ወለድ አይደለም።",
        helper_conventional: "መደበኛ፦ በዓመት ወለድ ላይ የተመሠረተ የአሞርታይዜን ወርሃዊ ክፍያ።",
    },
    en: {
        title: "Home loan / financing calculator",
        mode_conventional: "Conventional",
        mode_interest_free: "Interest-free",
        panel_afford: "What can you afford?",
        panel_finance: "Loan & payment",
        lang_en: "English",
        lang_am: "Amharic",
        monthly_income: "Monthly income (ETB)",
        housing_ratio: "Housing payment % of income",
        housing_ratio_friendly: "How much of your monthly income for house?",
        down_pct: "Down payment (%)",
        down_pct_friendly: "Down payment (% of home price)",
        term_years: "Loan length (years)",
        interest_annual: "Annual interest rate (%)",
        profit_margin: "Bank profit margin (%)",
        profit_rate: "Profit rate (%)",
        advanced: "Advanced",
        hero_afford_label: "Maximum home price you can afford",
        hero_finance_label: "Estimated monthly payment",
        house_price: "Home price (ETB)",
        max_monthly: "Monthly budget for housing",
        max_loan: "Max financing amount",
        max_price: "Max home price (with this down %)",
        monthly_payment: "Monthly payment",
        res_house: "Home price",
        res_down: "Down payment",
        res_loan: "Amount financed",
        res_total_interest: "Total interest",
        res_bank_profit: "Total bank profit",
        res_total_pay: "Total amount repaid",
        helper_margin: "Interest-free: flat markup on financed amount; equal installments, no interest compounding.",
        helper_conventional: "Conventional: fixed annual rate, fully amortizing monthly principal + interest.",
    },
};

function uniqueSuffix() {
    return `${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function formatMoney(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "—";
    return `${x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
}

function formatMoneyInt(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "—";
    return `${Math.round(x).toLocaleString()} ETB`;
}

/** Fixed-rate monthly payment (principal + interest). */
function conventionalMonthly(principal, annualPct, years) {
    const P = principal;
    const n = Math.round(years * 12);
    if (P <= 0 || n <= 0) return 0;
    const r = (annualPct / 100) / 12;
    if (r <= 0) return P / n;
    const pow = (1 + r) ** n;
    return (P * r * pow) / (pow - 1);
}

/** Max principal for given max monthly payment (inverse amortization). */
function maxPrincipalFromPayment(monthlyMax, annualPct, years) {
    const M = monthlyMax;
    const n = Math.round(years * 12);
    if (M <= 0 || n <= 0) return 0;
    const r = (annualPct / 100) / 12;
    if (r <= 0) return M * n;
    const pow = (1 + r) ** n;
    return (M * (pow - 1)) / (r * pow);
}

/** Max financed amount for interest-free (flat markup) given max monthly installment cap. */
function interestFreeMaxPrincipal(monthlyMax, marginPct, years) {
    const M = monthlyMax;
    const n = Math.round(years * 12);
    if (M <= 0 || n <= 0) return 0;
    const totalCap = M * n;
    const denom = 1 + marginPct / 100;
    if (denom <= 0) return 0;
    return totalCap / denom;
}

export function mountHybridMortgageCalculator(rootEl, options = {}) {
    if (!rootEl) {
        return { refreshLanguage: () => {}, destroy: () => {} };
    }

    const suffix = options.suffix || uniqueSuffix();
    const prefix = `tb-hmc-${suffix}`;
    const showLangToggle = options.showLangToggle !== false;
    const embed = options.variant === "embed";

    let lang = options.initialLang === "en" ? "en" : "am";
    if (typeof options.getLanguage === "function") {
        const g = options.getLanguage();
        if (g === "en" || g === "am") lang = g;
    }

    const t = (key) => STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;

    function template() {
        return `
<article class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl" data-tb-hmc-root>
    <header class="border-b border-gray-100 px-5 pb-5 pt-5 sm:px-8 sm:pt-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
            <h2 class="${embed ? "sr-only" : "text-lg font-bold tracking-tight text-slate-900 sm:text-xl w-full sm:w-auto sm:text-left"}" data-hmc="title">
                <i class="fas fa-calculator mr-2 text-zillow" aria-hidden="true"></i><span data-hmc-label="title"></span>
            </h2>
            ${showLangToggle ? `
            <div class="flex w-full justify-center gap-2 sm:w-auto sm:justify-end text-xs font-semibold">
                <button type="button" class="rounded-full px-3 py-1.5 ring-1 ring-slate-200 transition hover:bg-slate-50" data-hmc-lang="am">አማርኛ</button>
                <button type="button" class="rounded-full px-3 py-1.5 ring-1 ring-slate-200 transition hover:bg-slate-50" data-hmc-lang="en">English</button>
            </div>` : ""}
        </div>
        <div class="mt-5 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white px-4 py-5 text-center shadow-inner sm:px-6 sm:py-6" data-hmc-hero-wrap>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm" data-hmc-hero-label></p>
            <p class="mt-2 text-2xl font-extrabold tabular-nums tracking-tight text-zillow sm:text-3xl md:text-4xl" data-hmc-hero-value>0 ETB</p>
        </div>
        <div class="mt-4 flex gap-2" role="radiogroup" aria-label="Financing mode">
            <label class="tb-hmc-mode-option flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-[#006AFF] bg-[#006AFF]/10 py-3.5 text-center text-sm font-semibold text-[#006AFF] shadow-sm transition hover:opacity-95">
                <input type="radio" name="${prefix}-mode" value="conventional" checked class="sr-only" data-hmc-mode-radio />
                <span data-hmc-label="mode_conventional"></span>
            </label>
            <label class="tb-hmc-mode-option flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-white py-3.5 text-center text-sm font-semibold text-slate-600 transition hover:border-slate-300">
                <input type="radio" name="${prefix}-mode" value="interest_free" class="sr-only" data-hmc-mode-radio />
                <span data-hmc-label="mode_interest_free"></span>
            </label>
        </div>
        <div class="mt-3 flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold sm:text-sm" role="tablist">
            <button type="button" class="tb-hmc-panel-tab flex-1 rounded-lg px-3 py-2.5 transition bg-white text-zillow shadow-sm" data-hmc-panel="afford">${t("panel_afford")}</button>
            <button type="button" class="tb-hmc-panel-tab flex-1 rounded-lg px-3 py-2.5 transition text-slate-600 hover:text-slate-900" data-hmc-panel="finance">${t("panel_finance")}</button>
        </div>
        <p class="mt-3 text-center text-xs leading-relaxed text-slate-500" data-hmc-dynamic-helper></p>
    </header>

    <div class="space-y-6 px-5 py-6 sm:px-8 sm:py-8" data-hmc-section="afford">
        <div class="input-group">
            <label class="mb-1.5 block text-sm font-medium text-gray-800" for="${prefix}-income" data-hmc-label="monthly_income"></label>
            <input type="number" id="${prefix}-income" min="0" step="100" class="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-zillow focus:ring-2 focus:ring-zillow/25" data-hmc-in placeholder="0" />
        </div>
        <div class="input-group">
            <label class="mb-1.5 block text-sm font-medium text-gray-800" for="${prefix}-ratio" data-hmc-label="housing_ratio_friendly"></label>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input type="range" id="${prefix}-ratio-range" min="1" max="100" step="1" value="30" class="tb-hmc-range h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#006AFF]" data-hmc-slider="ratio" />
                <input type="number" id="${prefix}-ratio" min="1" max="100" step="1" value="30" class="h-12 w-full shrink-0 rounded-xl border border-gray-200 bg-white px-3 text-center text-base font-semibold tabular-nums text-slate-900 outline-none focus:border-zillow focus:ring-2 focus:ring-zillow/25 sm:w-20" data-hmc-in />
            </div>
        </div>
        <div class="input-group">
            <label class="mb-1.5 block text-sm font-medium text-gray-800" for="${prefix}-adown" data-hmc-label="down_pct_friendly"></label>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input type="range" id="${prefix}-adown-range" min="0" max="99" step="1" value="20" class="tb-hmc-range h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#006AFF]" data-hmc-slider="adown" />
                <input type="number" id="${prefix}-adown" min="0" max="99" step="1" value="20" class="h-12 w-full shrink-0 rounded-xl border border-gray-200 bg-white px-3 text-center text-base font-semibold tabular-nums text-slate-900 outline-none focus:border-zillow focus:ring-2 focus:ring-zillow/25 sm:w-20" data-hmc-in />
            </div>
        </div>
        <div class="input-group">
            <label class="mb-1.5 block text-sm font-medium text-gray-800" for="${prefix}-ayears" data-hmc-label="term_years"></label>
            <input type="number" id="${prefix}-ayears" min="1" max="40" step="1" value="20" class="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-zillow focus:ring-2 focus:ring-zillow/25" data-hmc-in />
        </div>
        <details class="group rounded-xl border border-slate-200 bg-slate-50/80 open:bg-white open:shadow-sm">
            <summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-700 marker:content-none [&::-webkit-details-marker]:hidden">
                <span class="flex items-center justify-between gap-2">
                    <span data-hmc-label="advanced"></span>
                    <i class="fas fa-chevron-down text-xs text-slate-400 transition group-open:rotate-180" aria-hidden="true"></i>
                </span>
            </summary>
            <div class="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3">
                <div class="input-group">
                    <label class="mb-1.5 block text-sm font-medium text-gray-700" for="${prefix}-arate" data-hmc-for-rate></label>
                    <input type="number" id="${prefix}-arate" min="0" step="0.01" value="16.5" class="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-zillow focus:ring-2 focus:ring-zillow/25" data-hmc-in />
                </div>
            </div>
        </details>
    </div>

    <div class="hidden space-y-6 px-5 py-6 sm:px-8 sm:py-8" data-hmc-section="finance">
        <div class="input-group">
            <label class="mb-1.5 block text-sm font-medium text-gray-800" for="${prefix}-price" data-hmc-label="house_price"></label>
            <input type="number" id="${prefix}-price" min="0" step="1000" placeholder="5,000,000" class="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-zillow focus:ring-2 focus:ring-zillow/25" data-hmc-in />
        </div>
        <div class="input-group">
            <label class="mb-1.5 block text-sm font-medium text-gray-800" for="${prefix}-fdown" data-hmc-label="down_pct_friendly"></label>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input type="range" id="${prefix}-fdown-range" min="0" max="99" step="1" value="20" class="tb-hmc-range h-2 w-full flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#006AFF]" data-hmc-slider="fdown" />
                <input type="number" id="${prefix}-fdown" min="0" max="99" step="1" value="20" class="h-12 w-full shrink-0 rounded-xl border border-gray-200 bg-white px-3 text-center text-base font-semibold tabular-nums text-slate-900 outline-none focus:border-zillow focus:ring-2 focus:ring-zillow/25 sm:w-20" data-hmc-in />
            </div>
        </div>
        <div class="input-group">
            <label class="mb-1.5 block text-sm font-medium text-gray-800" for="${prefix}-fyears" data-hmc-label="term_years"></label>
            <input type="number" id="${prefix}-fyears" min="1" max="40" step="1" value="20" class="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-zillow focus:ring-2 focus:ring-zillow/25" data-hmc-in />
        </div>
        <details class="group rounded-xl border border-slate-200 bg-slate-50/80 open:bg-white open:shadow-sm">
            <summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-700 marker:content-none [&::-webkit-details-marker]:hidden">
                <span class="flex items-center justify-between gap-2">
                    <span data-hmc-label="advanced"></span>
                    <i class="fas fa-chevron-down text-xs text-slate-400 transition group-open:rotate-180" aria-hidden="true"></i>
                </span>
            </summary>
            <div class="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3">
                <div class="input-group">
                    <label class="mb-1.5 block text-sm font-medium text-gray-700" for="${prefix}-frate" data-hmc-for-rate></label>
                    <input type="number" id="${prefix}-frate" min="0" step="0.01" value="16.5" class="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-zillow focus:ring-2 focus:ring-zillow/25" data-hmc-in />
                </div>
            </div>
        </details>
    </div>

    <div class="loan-widget-results border-t border-gray-100 px-5 pb-6 sm:px-8 sm:pb-8 pt-4" data-hmc-results="afford">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p class="text-xs font-medium text-gray-500" data-hmc-label="max_monthly"></p>
                <p class="mt-1 text-lg font-bold tabular-nums text-slate-900" data-hmc-out="afford-monthly">0 ETB</p>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p class="text-xs font-medium text-gray-500" data-hmc-label="max_loan"></p>
                <p class="mt-1 text-lg font-bold tabular-nums text-slate-900" data-hmc-out="afford-loan">0 ETB</p>
            </div>
        </div>
        <p class="sr-only" data-hmc-out="afford-price"></p>
    </div>

    <div class="hidden loan-widget-results border-t border-gray-100 px-5 pb-6 sm:px-8 sm:pb-8 pt-4" data-hmc-results="finance">
        <div class="loan-widget-details grid grid-cols-2 gap-3 text-left sm:gap-4">
            <div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
                <p class="text-xs font-medium text-gray-500" data-hmc-label="res_house"></p>
                <p class="mt-1 text-sm font-bold tabular-nums text-slate-900 sm:text-base" data-hmc-out="fin-house">0 ETB</p>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
                <p class="text-xs font-medium text-gray-500" data-hmc-label="res_down"></p>
                <p class="mt-1 text-sm font-bold tabular-nums text-slate-900 sm:text-base" data-hmc-out="fin-down">0 ETB</p>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
                <p class="text-xs font-medium text-gray-500" data-hmc-label="res_loan"></p>
                <p class="mt-1 text-sm font-bold tabular-nums text-slate-900 sm:text-base" data-hmc-out="fin-loan">0 ETB</p>
            </div>
            <div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
                <p class="text-xs font-medium text-gray-500" data-hmc-for-extra-label></p>
                <p class="mt-1 text-sm font-bold tabular-nums text-slate-900 sm:text-base" data-hmc-out="fin-extra">0 ETB</p>
            </div>
        </div>
        <p class="mt-3 text-center text-xs text-slate-500" data-hmc-out="fin-total-line"></p>
        <p class="sr-only" data-hmc-out="fin-monthly"></p>
    </div>
</article>`;
    }

    rootEl.innerHTML = template();
    const root = rootEl.querySelector("[data-tb-hmc-root]");

    let activePanel = "afford";

    function getMode() {
        const free = root.querySelector(`input[name="${prefix}-mode"][value="interest_free"]`);
        return free?.checked ? "interest_free" : "conventional";
    }

    function syncModePills() {
        root.querySelectorAll(".tb-hmc-mode-option").forEach((lab) => {
            const inp = lab.querySelector("[data-hmc-mode-radio]");
            if (!inp) return;
            const on = inp.checked;
            lab.className = on
                ? "tb-hmc-mode-option flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-[#006AFF] bg-[#006AFF]/10 py-3.5 text-center text-sm font-semibold text-[#006AFF] shadow-sm transition hover:opacity-95"
                : "tb-hmc-mode-option flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-white py-3.5 text-center text-sm font-semibold text-slate-600 transition hover:border-slate-300";
        });
    }

    function syncRangesFromNumbers() {
        const pairs = [
            [`${prefix}-ratio`, `${prefix}-ratio-range`, 1, 100, 30],
            [`${prefix}-adown`, `${prefix}-adown-range`, 0, 99, 20],
            [`${prefix}-fdown`, `${prefix}-fdown-range`, 0, 99, 20],
        ];
        for (const [nid, rid, min, max, def] of pairs) {
            const nEl = document.getElementById(nid);
            const rEl = document.getElementById(rid);
            if (!nEl || !rEl) continue;
            let v = parseFloat(nEl.value);
            if (!Number.isFinite(v)) v = def;
            const vInt = Math.round(Math.min(max, Math.max(min, v)));
            nEl.value = String(vInt);
            rEl.value = String(vInt);
        }
    }

    function applyStaticLabels() {
        const tt = (k) => STRINGS[lang]?.[k] ?? STRINGS.en[k] ?? k;
        root.querySelectorAll("[data-hmc-label]").forEach((el) => {
            const k = el.getAttribute("data-hmc-label");
            if (k) el.textContent = tt(k);
        });
        const helpEl = root.querySelector("[data-hmc-dynamic-helper]");
        if (helpEl) {
            helpEl.textContent = getMode() === "conventional" ? tt("helper_conventional") : tt("helper_margin");
        }
        root.querySelectorAll("[data-hmc-for-rate]").forEach((el) => {
            const id = el.getAttribute("for");
            const input = id ? document.getElementById(id) : null;
            if (getMode() === "conventional") {
                el.textContent = tt("interest_annual");
                if (input) input.title = tt("interest_annual");
            } else {
                el.textContent = tt("profit_margin");
                if (input) input.title = tt("profit_margin");
            }
        });
        root.querySelectorAll("[data-hmc-for-extra-label]").forEach((el) => {
            el.textContent = getMode() === "conventional" ? tt("res_total_interest") : tt("res_bank_profit");
        });
        root.querySelectorAll("[data-hmc-panel]").forEach((btn) => {
            const p = btn.getAttribute("data-hmc-panel");
            if (p === "afford") btn.textContent = tt("panel_afford");
            if (p === "finance") btn.textContent = tt("panel_finance");
        });
        const ratioR = document.getElementById(`${prefix}-ratio-range`);
        if (ratioR) ratioR.setAttribute("aria-label", tt("housing_ratio_friendly"));
        const adownR = document.getElementById(`${prefix}-adown-range`);
        if (adownR) adownR.setAttribute("aria-label", tt("down_pct_friendly"));
        const fdownR = document.getElementById(`${prefix}-fdown-range`);
        if (fdownR) fdownR.setAttribute("aria-label", tt("down_pct_friendly"));
        syncModePills();
    }

    function updateRateLabels() {
        applyStaticLabels();
    }

    function setPanel(panel) {
        activePanel = panel;
        const affordSec = root.querySelector('[data-hmc-section="afford"]');
        const financeSec = root.querySelector('[data-hmc-section="finance"]');
        const affordRes = root.querySelector('[data-hmc-results="afford"]');
        const financeRes = root.querySelector('[data-hmc-results="finance"]');
        affordSec?.classList.toggle("hidden", panel !== "afford");
        financeSec?.classList.toggle("hidden", panel !== "finance");
        affordRes?.classList.toggle("hidden", panel !== "afford");
        financeRes?.classList.toggle("hidden", panel !== "finance");
        root.querySelectorAll(".tb-hmc-panel-tab").forEach((btn) => {
            const on = btn.getAttribute("data-hmc-panel") === panel;
            btn.classList.toggle("bg-white", on);
            btn.classList.toggle("text-zillow", on);
            btn.classList.toggle("shadow-sm", on);
            btn.classList.toggle("text-slate-600", !on);
        });
    }

    function recalc() {
        const tt = (k) => STRINGS[lang]?.[k] ?? STRINGS.en[k] ?? k;
        const heroLabel = root.querySelector("[data-hmc-hero-label]");
        const heroVal = root.querySelector("[data-hmc-hero-value]");
        const mode = getMode();
        const conv = mode === "conventional";

        if (activePanel === "afford") {
            const income = parseFloat(document.getElementById(`${prefix}-income`)?.value) || 0;
            const ratio = parseFloat(document.getElementById(`${prefix}-ratio`)?.value) || 0;
            const downPct = parseFloat(document.getElementById(`${prefix}-adown`)?.value) || 0;
            const years = parseFloat(document.getElementById(`${prefix}-ayears`)?.value) || 0;
            const rate = parseFloat(document.getElementById(`${prefix}-arate`)?.value) || 0;

            const Mmax = income * (ratio / 100);
            let Pmax = 0;
            if (conv) {
                Pmax = maxPrincipalFromPayment(Mmax, rate, years);
            } else {
                Pmax = interestFreeMaxPrincipal(Mmax, rate, years);
            }
            const oneMinusDown = 1 - downPct / 100;
            const maxPrice = oneMinusDown > 0 ? Pmax / oneMinusDown : 0;

            const elM = root.querySelector('[data-hmc-out="afford-monthly"]');
            const elL = root.querySelector('[data-hmc-out="afford-loan"]');
            const elP = root.querySelector('[data-hmc-out="afford-price"]');
            if (elM) elM.textContent = formatMoney(Mmax);
            if (elL) elL.textContent = formatMoneyInt(Pmax);
            if (elP) elP.textContent = formatMoneyInt(maxPrice);
            if (heroLabel) heroLabel.textContent = tt("hero_afford_label");
            if (heroVal) heroVal.textContent = formatMoneyInt(maxPrice);
        } else {
            const price = parseFloat(document.getElementById(`${prefix}-price`)?.value) || 0;
            const downPct = parseFloat(document.getElementById(`${prefix}-fdown`)?.value) || 0;
            const rate = parseFloat(document.getElementById(`${prefix}-frate`)?.value) || 0;
            const years = parseFloat(document.getElementById(`${prefix}-fyears`)?.value) || 0;

            const downAmt = price * (downPct / 100);
            const P = Math.max(0, price - downAmt);
            const n = Math.round(years * 12);

            let monthly = 0;
            let extra = 0;
            let totalRepaid = 0;

            if (conv) {
                monthly = conventionalMonthly(P, rate, years);
                totalRepaid = monthly * n;
                extra = Math.max(0, totalRepaid - P);
            } else {
                const total = P * (1 + rate / 100);
                monthly = n > 0 ? total / n : 0;
                extra = Math.max(0, total - P);
                totalRepaid = total;
            }

            const elMo = root.querySelector('[data-hmc-out="fin-monthly"]');
            const elH = root.querySelector('[data-hmc-out="fin-house"]');
            const elD = root.querySelector('[data-hmc-out="fin-down"]');
            const elLo = root.querySelector('[data-hmc-out="fin-loan"]');
            const elEx = root.querySelector('[data-hmc-out="fin-extra"]');
            const elTot = root.querySelector('[data-hmc-out="fin-total-line"]');
            if (elMo) elMo.textContent = formatMoney(monthly);
            if (elH) elH.textContent = formatMoneyInt(price);
            if (elD) elD.textContent = formatMoneyInt(downAmt);
            if (elLo) elLo.textContent = formatMoneyInt(P);
            if (elEx) elEx.textContent = formatMoneyInt(extra);
            if (elTot) elTot.textContent = `${tt("res_total_pay")}: ${formatMoneyInt(totalRepaid)}`;
            if (heroLabel) heroLabel.textContent = tt("hero_finance_label");
            if (heroVal) heroVal.textContent = formatMoney(monthly);
        }
    }

    function onInput() {
        syncRangesFromNumbers();
        updateRateLabels();
        recalc();
    }

    root.querySelectorAll('input[name="' + prefix + '-mode"]').forEach((inp) => {
        inp.addEventListener("change", () => {
            syncModePills();
            onInput();
        });
    });
    root.querySelectorAll("[data-hmc-slider]").forEach((range) => {
        range.addEventListener("input", () => {
            const k = range.getAttribute("data-hmc-slider");
            const idNum = k === "ratio" ? `${prefix}-ratio` : k === "adown" ? `${prefix}-adown` : `${prefix}-fdown`;
            const num = document.getElementById(idNum);
            if (num) num.value = range.value;
            onInput();
        });
    });
    root.querySelectorAll("[data-hmc-in]").forEach((inp) => {
        inp.addEventListener("input", onInput);
    });
    root.querySelectorAll(".tb-hmc-panel-tab").forEach((btn) => {
        btn.addEventListener("click", () => {
            const p = btn.getAttribute("data-hmc-panel");
            if (p === "afford" || p === "finance") {
                setPanel(p);
                recalc();
            }
        });
    });
    if (showLangToggle) {
        root.querySelectorAll("[data-hmc-lang]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const L = btn.getAttribute("data-hmc-lang");
                if (L === "en" || L === "am") {
                    lang = L;
                    applyStaticLabels();
                    recalc();
                }
            });
        });
    }

    setPanel("afford");
    applyStaticLabels();
    recalc();

    const api = {
        refreshLanguage() {
            if (typeof options.getLanguage === "function") {
                const g = options.getLanguage();
                if (g === "en" || g === "am") lang = g;
            }
            applyStaticLabels();
            recalc();
        },
        destroy() {
            rootEl.innerHTML = "";
        },
    };

    return api;
}
