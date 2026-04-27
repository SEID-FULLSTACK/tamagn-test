const myProperties = [
    { id: 1, title: "ዘመናዊ አፓርታማ ቦሌ", price: "8,500,000 ETB", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400" },
    { id: 2, title: "ቪላ ቤት ሰሚት", price: "15,000,000 ETB", image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400" },
    { id: 3, title: "የንግድ ሱቅ መገናኛ", price: "4,200,000 ETB", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400" },
    { id: 4, title: "ጌስት ሀውስ አያት", price: "25,000,000 ETB", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400" },
    { id: 5, title: "ኮንዶሚኒየም የካ", price: "3,100,000 ETB", image: "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=800&q=80" },
    { id: 6, title: "ባለ 3 ክፍል ቤት ላፍቶ", price: "7,800,000 ETB", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80" }
];

export function renderProperties() {
    const container = document.getElementById("property-container");
    if (!container) {
        console.error("Error: 'property-container' not found in HTML!");
        return;
    }

    let content = "";
    myProperties.forEach((house, index) => {
        content += `
            <div class="property-card" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: white;">
                <img src="${house.image}" style="width:100%; border-radius: 5px; height: 200px; object-fit: cover;" alt="${house.title}">
                <h4 style="margin: 10px 0;">${house.title}</h4>
                <p style="color: #27ae60; font-weight: bold; font-size: 1.1rem;">${house.price}</p>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button style="flex: 1; background: #007bff; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">ዝርዝር ይመልከቱ</button>
                    <a href="tel:+251911000000" style="background: #28a745; color: #eee; padding: 10px; border-radius: 5px; text-decoration: none;"><i class="fas fa-phone"></i></a>
                </div>
            </div>
        `;

        if ((index + 1) % 4 === 0) {
            content += `
                <div class="premium-ad-card" style="grid-column: 1 / -1; margin: 30px 0; border-radius: 24px; background: linear-gradient(135deg, #0f0f0f 0%, #2c2c2c 100%); color: white; box-shadow: 0 15px 35px rgba(0,0,0,0.3); overflow: hidden;">
                    <div class="ad-content-wrapper" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; padding: 40px; gap: 30px;">
                        <div class="ad-text-section" style="flex: 1; min-width: 300px;">
                            <div style="background: #d4af37; color: #000; padding: 5px 15px; border-radius: 50px; font-size: 11px; font-weight: bold; display: inline-block; margin-bottom: 20px;">
                                <i class="fas fa-crown"></i> SPONSORED
                            </div>
                            <h2 style="font-size: 2rem; margin-bottom: 15px; line-height: 1.2; color: #fff;">የቤትዎን ውበት በዘመናዊ ፈርኒቸሮች ያስውቡ!</h2>
                            <p style="font-size: 16px; color: #bbb; margin-bottom: 25px; line-height: 1.6;">ከ <strong>Abyssinia Furniture</strong> ጋር በሚያደርጉት ግዢ የ20% ልዩ ቅናሽ ተጠቃሚ ይሁኑ።</p>
                            <button class="ad-cta-btn" style="background: #d4af37; color: #000; border: none; padding: 15px 35px; border-radius: 12px; font-weight: bold; font-size: 16px; cursor: pointer;">
                                አሁኑኑ ይዘዙ <i class="fas fa-shopping-cart" style="margin-left: 10px;"></i>
                            </button>
                        </div>
                        <div class="ad-image-section" style="flex: 0 10% 300px; height: 300px; position: relative;width: auto;">
                            <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop" style="width: 100%; height: 100%; border-radius: 20px; object-fit: cover;">
                            <div style="position: absolute; top: -15px; right: -15px; background: #e74c3c; color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: 800; transform: rotate(15deg);">
                                <span style="font-size: 20px;">20%</span>
                                <span style="font-size: 10px;">OFF</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    });

    container.innerHTML = content;
}

export function initHomePropertiesFeature() {
    document.addEventListener("DOMContentLoaded", renderProperties);
}
