import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBO0KVyRPlaDZYOr3GAXAW91DwFDj97j2g",
  authDomain: "camplist-411bf.firebaseapp.com",
  projectId: "camplist-411bf",
  storageBucket: "camplist-411bf.firebasestorage.app",
  messagingSenderId: "99565458366",
  appId: "1:99565458366:web:9e8c5f6d9585e5da451fef",
  measurementId: "G-E99J0TPM3M",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
