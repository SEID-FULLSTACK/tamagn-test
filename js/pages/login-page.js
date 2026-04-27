import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "/js/core/firebase.js";
import { byId, getValue, onIfPresent, setDisplay } from "./page-utils.js";

const getLoginInputs = () => ({
    email: getValue("email"),
    password: getValue("password")
});

const redirectUser = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const role = userDoc.data().role;
            window.location.href = role === "seller" ? "sell.html" : "buy.html";
        } else {
            console.error("ተጠቃሚው በዳታቤዝ ውስጥ የለም");
        }
    } catch (error) {
        console.error("ዳታ ለማምጣት ችግር ተፈጥሯል:", error);
    }
};

const loginBtn = byId("loginBtn");
onIfPresent(loginBtn, "click", async () => {
    const inputs = getLoginInputs();
    try {
        const userCredential = await signInWithEmailAndPassword(auth, inputs.email, inputs.password);
        redirectUser(userCredential.user.uid);
    } catch (error) {
        alert("የተሳሳተ መረጃ! እባክዎ እንደገና ይሞክሩ።");
    }
});

const modal = byId("signupModal");
const signupLink = byId("signupBtn");
const closeModalBtn = byId("closeModal");

onIfPresent(signupLink, "click", (e) => {
    e.preventDefault();
    setDisplay(modal, "flex");
});

onIfPresent(closeModalBtn, "click", () => {
    setDisplay(modal, "none");
});

const confirmSignupBtn = byId("confirmSignup");
onIfPresent(confirmSignupBtn, "click", async () => {
    const email = getValue("signupEmail");
    const password = getValue("signupPassword");
    const role = getValue("signupRole");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            role,
            email,
            createdAt: new Date()
        });

        alert("ምዝገባዎ ተሳክቷል!");
        setDisplay(modal, "none");
        redirectUser(userCredential.user.uid);
    } catch (error) {
        alert("ስህተት: " + error.message);
    }
});
