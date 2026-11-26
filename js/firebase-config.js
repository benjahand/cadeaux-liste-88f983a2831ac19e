import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { initializeAuth, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA4gj-2JbMShzoPtCECA52PQMhns2y__VY",
  authDomain: "cadeaux-liste.firebaseapp.com",
  projectId: "cadeaux-liste",
  storageBucket: "cadeaux-liste.firebasestorage.app",
  messagingSenderId: "665217305405",
  appId: "1:665217305405:web:33263f425de46c0780d354"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: [browserLocalPersistence, browserSessionPersistence],
});

export { db, auth };