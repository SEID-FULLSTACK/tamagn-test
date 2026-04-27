import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "../core/firebase.js";

export function initSharedAuthModal({ googleRedirectPath }) {
    let currentMode = "login";

    function getElements() {
        return {
            modal: document.getElementById("authModal"),
            title: document.getElementById("authTitle"),
            subtitle: document.getElementById("authSubtitle"),
            authBtn: document.getElementById("authBtn"),
            roleSelect: document.getElementById("userRole"),
            signupName: document.getElementById("signupName"),
            signupPhone: document.getElementById("signupPhone")
        };
    }

    function applyMode(mode) {
        const { modal, title, subtitle, authBtn, roleSelect, signupName, signupPhone } = getElements();
        if (!modal || !title || !subtitle || !authBtn || !roleSelect) return;

        currentMode = mode;
        const isLogin = mode === "login";

        title.innerText = isLogin ? "ወደ ታማኝ ቤት እንኳን በሰላም መጡ" : "አዲስ መመዝገቢያ";
        subtitle.innerText = isLogin ? "መግቢያ (Login)" : "አካውንት ይፍጠሩ";
        authBtn.innerText = isLogin ? "ግባ" : "ተመዝገብ";
        roleSelect.style.display = isLogin ? "none" : "block";

        if (signupName) signupName.style.display = isLogin ? "none" : "block";
        if (signupPhone) signupPhone.style.display = isLogin ? "none" : "block";

        modal.style.display = "flex";
    }

    function openAuthModal(mode = "login") {
        applyMode(mode);
    }

    function closeAuthModal() {
        const modal = document.getElementById("authModal");
        if (modal) modal.style.display = "none";
    }

    async function handleAuth() {
        const email = document.getElementById("email")?.value;
        const password = document.getElementById("password")?.value;
        const role = document.getElementById("userRole")?.value;
        if (!email || !password) return;

        try {
            if (currentMode === "login") {
                await signInWithEmailAndPassword(auth, email, password);
                alert("እንኳን በደህና መጡ!");
            } else {
                const user = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", user.user.uid), { role, email });
                alert("ምዝገባው ተሳክቷል!");
            }
            closeAuthModal();
        } catch (error) {
            alert("ስህተት: " + error.message);
        }
    }

    async function handleGoogleLogin() {
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                await setDoc(userRef, {
                    name: user.displayName,
                    email: user.email,
                    role: "buyer"
                });
            }

            window.location.href = googleRedirectPath;
        } catch (error) {
            console.error("የጎግል መግቢያ ስህተት:", error);
        }
    }

    function switchMode() {
        openAuthModal(currentMode === "login" ? "signup" : "login");
    }

    const closeBtn = document.getElementById("closeModal");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeAuthModal);
    }

    return {
        openAuthModal,
        closeAuthModal,
        handleAuth,
        handleGoogleLogin,
        switchMode
    };
}
