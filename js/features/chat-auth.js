import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../core/firebase.js";

export function toggleChat() {
    const chatBox = document.getElementById("chatBox");
    if (chatBox) {
        chatBox.classList.toggle("active");
    }
}

export async function sendMessage() {
    const input = document.getElementById("chatInput");
    const body = document.getElementById("chatBody");

    if (input && body && input.value.trim() !== "") {
        const userText = input.value;

        const userDiv = document.createElement("div");
        userDiv.className = "user-msg";
        userDiv.textContent = userText;
        body.appendChild(userDiv);

        input.value = "";
        body.scrollTop = body.scrollHeight;

        const botDiv = document.createElement("div");
        botDiv.className = "bot-msg";
        botDiv.textContent = "በማሰብ ላይ...";
        body.appendChild(botDiv);

        try {
            const response = await fetch("http://localhost:5000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userText })
            });

            if (!response.ok) throw new Error(`Server Error: ${response.status}`);
            const data = await response.json();
            botDiv.textContent = data.reply || "ምንም ምላሽ የለም";
        } catch (error) {
            console.error("Fetch Error:", error);
            botDiv.textContent = "ይቅርታ፣ ከሰርቨሩ ጋር መገናኘት አልቻልኩም።";
        }

        body.scrollTop = body.scrollHeight;
        input.focus();
    }
}

export function showForm(formType) {
    const loginSection = document.getElementById("loginFormSection");
    const signupSection = document.getElementById("signupFormSection");
    if (loginSection && signupSection) {
        loginSection.style.display = formType === "login" ? "block" : "none";
        signupSection.style.display = formType === "signup" ? "block" : "none";
    }
}

export function openAuthModal(defaultForm = "login") {
    const modal = document.getElementById("authModal");
    if (modal) {
        modal.style.display = "flex";
        showForm(defaultForm);
    }
}

export function closeAuthModal() {
    const authModal = document.getElementById("authModal");
    if (authModal) authModal.style.display = "none";
}

function bindPropertyForm(toggleModal) {
    const propertyForm = document.getElementById("propertyForm");
    if (!propertyForm) return;

    propertyForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        console.log("Saving Property to Firestore...");

        const newProperty = {
            devId: document.getElementById("pDeveloper").value,
            title: document.getElementById("pTitle").value,
            price: document.getElementById("pPrice").value,
            location: document.getElementById("pLocation").value,
            img: document.getElementById("pImage")?.value || "https://placehold.co/300x200/png",
            status: "pending",
            scope: "dashboard",
            timestamp: new Date().toISOString()
        };
        try {
            const docRef = await addDoc(collection(db, "properties"), newProperty);
            console.log("Successfully Saved! ID: ", docRef.id);
            alert("ቤትዎ በተሳካ ሁኔታ ተለጠፈ!");
            this.reset();
            toggleModal("postPropModal");
            const payModal = document.getElementById("postPaymentModal");
            if (payModal) payModal.style.display = "flex";
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("መረጃውን በመላክ ላይ ችግር ተፈጥሯል: " + error.message);
        }
    });
}

function bindAgentRegForm(toggleModal) {
    const agentRegForm = document.getElementById("agentRegForm");
    if (!agentRegForm) return;

    agentRegForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const agentData = {
            fullName: document.getElementById("regFullName").value,
            businessName: document.getElementById("regBusName").value,
            email: document.getElementById("regEmail").value,
            phone: document.getElementById("regPhone").value,
            role: "agent",
            isVerified: false,
            regDate: new Date().toLocaleDateString()
        };

        console.log("Registering Agent:", agentData);
        alert("የምዝገባ ጥያቄዎ ተልኳል! አስተዳዳሪው ሲያረጋግጥልዎት ማስታወቂያ መለጠፍ ይችላሉ።");
        toggleModal("agentRegModal");
        this.reset();
    });
}

export function initChatAuthFeature({ toggleModal }) {
    const chatInput = document.getElementById("chatInput");
    if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }

    bindPropertyForm(toggleModal);
    bindAgentRegForm(toggleModal);
}
