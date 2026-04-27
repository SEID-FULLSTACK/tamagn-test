const allHouses = [
    {
        id: 1,
        title: "ዘመናዊ አፓርታማ ቦሌ",
        agent: "አቤል",
        isVerified: true,
        price: "8M ETB",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
    },
    {
        id: 2,
        title: "ቪላ ቤት ሰሚት",
        agent: "ሳራ",
        isVerified: false,
        price: "12M ETB",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"
    },
    {
        id: 3,
        title: "ቆንጆ ኮንዶሚኒየም",
        agent: "ካሳሁን",
        isVerified: true,
        price: "4M ETB",
        image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&q=80"
    },
    {
        id: 4,
        title: "ሰፊ ግቢ ያለው ቤት",
        agent: "ኤደን",
        isVerified: true,
        price: "20M ETB",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 5,
        title: "አዲስ አፓርታማ",
        agent: "ዮናስ",
        isVerified: false,
        price: "9M ETB",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"
    }
];

function startRendering() {
    const container = document.getElementById("house-listings-grid");
    if (!container) return;

    let htmlOutput = "";

    allHouses.forEach((house) => {
        const vBadge = house.isVerified
            ? `<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align: middle; margin-left: 5px;">
                <path fill="#1DA1F2" d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.65.25-1.53-.13-3.08-1.05-4.25-1.17-.92-2.72-1.3-4.25-1.05-.7-1.3-2.07-2.18-3.65-2.18s-2.95.88-3.65 2.18c-1.53-.25-3.08.13-4.25 1.05-.92 1.17-1.3 2.72-1.05 4.25-1.3.7-2.18 2.07-2.18 3.65s.88 2.95 2.18 3.65c-.25 1.53.13 3.08 1.05 4.25 1.17.92 2.72 1.3 4.25 1.05.7 1.3 2.07 2.18 3.65 2.18s 2.95-.88 3.65-2.18c1.53.25 3.08-.13 4.25-1.05.92-1.17 1.3-2.72 1.05-4.25 1.3-.7 2.18-2.07 2.18-3.65zM10 17l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>`
            : "";

        htmlOutput += `
            <div class="property-card" style="border:1px solid #ddd; border-radius:12px; overflow:hidden; background:white; margin-bottom:20px; transition: 0.3s;">
                <img src="${house.image}" alt="${house.title}" style="width:100%; height:200px; object-fit:cover;">
                <div style="padding:15px;">
                    <p style="font-size:12.5px; color:#555;">ኤጀንት፡ ${house.agent} ${vBadge}</p>
                    <h3 style="margin:8px 0; font-size:18px;">${house.title}</h3>
                    <p style="color:#2ecc71; font-weight:bold; font-size:16px;">${house.price}</p>
                </div>
            </div>
        `;
    });

    container.innerHTML = htmlOutput;
}

export function calculateEverything() {
    const price = parseFloat(document.getElementById("housePrice").value) || 0;
    const downPercent = parseFloat(document.getElementById("downPaymentPercent").value) || 0;
    const annualRate = parseFloat(document.getElementById("interestRate").value) || 0;
    const years = parseFloat(document.getElementById("loanTerm").value) || 0;

    const loanType = document.querySelector('input[name="loanType"]:checked').value;
    const rateLabel = document.getElementById("rateLabel");
    const resInterestLabel = document.getElementById("resInterestLabel");

    if (loanType === "sharia") {
        rateLabel.innerText = "የባንክ የትርፍ ድርሻ (%)";
        resInterestLabel.innerText = "ጠቅላላ የባንክ ትርፍ";
    } else {
        rateLabel.innerText = "የባንክ ወለድ በዓመት (%)";
        resInterestLabel.innerText = "ጠቅላላ ወለድ";
    }

    const downPaymentAmount = price * (downPercent / 100);
    const principal = price - downPaymentAmount;
    const monthlyRate = (annualRate / 100) / 12;
    const numberOfPayments = years * 12;

    let monthlyPayment = 0;
    if (principal > 0 && monthlyRate > 0 && numberOfPayments > 0) {
        const x = Math.pow(1 + monthlyRate, numberOfPayments);
        monthlyPayment = (principal * x * monthlyRate) / (x - 1);
    }

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - principal;

    document.getElementById("monthlyPayment").innerText = monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 }) + " ETB";
    document.getElementById("resHousePrice").innerText = price.toLocaleString() + " ETB";
    document.getElementById("resDownPayment").innerText = downPaymentAmount.toLocaleString() + " ETB";
    document.getElementById("resLoanAmount").innerText = principal.toLocaleString() + " ETB";
    document.getElementById("resTotalInterest").innerText = (totalInterest > 0 ? totalInterest : 0).toLocaleString() + " ETB";
}

export function initCalculatorFeature() {
    window.addEventListener("load", startRendering);
}
