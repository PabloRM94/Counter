// Tu configuración de Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAUl-WvmEgcnHzI_52e1XF4gUWYfeypvdc",
    authDomain: "counter-8e128.firebaseapp.com",
    projectId: "counter-8e128",
    storageBucket: "counter-8e128.firebasestorage.app",
    messagingSenderId: "128852291589",
    appId: "1:128852291589:web:d7f9db00b48a4d2046ec6c",
    measurementId: "G-R71H4P72ZL"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);