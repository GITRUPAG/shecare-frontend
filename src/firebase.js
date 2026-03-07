import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyBPZwcVySL5Ke9cWZ0YrRw3Xw4VcO1y23M",
  authDomain:        "shecare-a047c.firebaseapp.com",
  projectId:         "shecare-a047c",
  storageBucket:     "shecare-a047c.firebasestorage.app",
  messagingSenderId: "381680945031",
  appId:             "1:381680945031:web:209ff75c862d8562683522"
};

const app = initializeApp(firebaseConfig);

export const auth           = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: Force account selection every time (good UX)
googleProvider.setCustomParameters({ prompt: "select_account" });