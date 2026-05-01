import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCiPdbWkA2oUqu1ONy6R3BdDom6lC8_mnI",
    authDomain: "tamagnbet.firebaseapp.com",
    projectId: "tamagnbet",
    storageBucket: "tamagnbet.firebasestorage.app",
    messagingSenderId: "901462661792",
    appId: "1:901462661792:web:6db51cdf37b97839c607c5",
    measurementId: "G-B4440P71X7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
