import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js"

import { getFirestore } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js"

const firebaseConfig = {
  apiKey: "AIzaSyBdBK4-dXVcJcEq1309SQw2cG6dIeTThDo",
  authDomain: "noel-liste-e9b13.firebaseapp.com",
  projectId: "noel-liste-e9b13",
  storageBucket: "noel-liste-e9b13.firebasestorage.app",
  messagingSenderId: "166461130138",
  appId: "1:166461130138:web:dfca365ba3b3bce2032623"
};

const app = initializeApp(firebaseConfig);

const db  = getFirestore(app);

export { db };