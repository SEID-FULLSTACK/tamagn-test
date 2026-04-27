import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../core/firebase.js";

export async function getUserDisplayProfile(user, defaultName = "ተጠቃሚ") {
    let displayName = user?.email ? user.email.split("@")[0] : defaultName;

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            displayName = userDoc.data().name || displayName;
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
    }

    const safeName = (displayName || defaultName).toString().trim() || defaultName;
    return {
        displayName: safeName,
        initial: safeName.charAt(0).toUpperCase()
    };
}
