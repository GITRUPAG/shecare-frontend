import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBPZwcVySL5Ke9cWZ0YrRw3Xw4VcO1y23M",
  authDomain: "shecare-a047c.firebaseapp.com",
  projectId: "shecare-a047c",
  storageBucket: "shecare-a047c.appspot.com",
  messagingSenderId: "381680945031",
  appId: "1:381680945031:web:209ff75c862d8562683522"
};

// Prevent multiple Firebase initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});