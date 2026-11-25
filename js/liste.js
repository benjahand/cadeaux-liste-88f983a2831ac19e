import { lireRole, effacerRole } from "./session.js";
import { libelle } from "./roles.js";
import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const role = lireRole();

if (!role) {
  window.location.replace("index.html");
} else {
  document.getElementById("titre").textContent =
    role === "Createur" ? "Espace créateur" : `Bonjour ${libelle(role)}`;

  onAuthStateChanged(auth, (user) => {
    if (role === "Createur" && !user) {
      effacerRole();
      window.location.replace("index.html");
    }
  });
}

document.getElementById("btn-changer").addEventListener("click", async () => {
  effacerRole();
  // On attend signOut au maximum 1,5 s, puis on part quoi qu'il arrive
  await Promise.race([
    signOut(auth).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  window.location.replace("index.html");
});