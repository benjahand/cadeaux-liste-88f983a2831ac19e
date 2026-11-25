import { lireRole, effacerRole } from "./session.js";
import { libelle } from "./roles.js";

const role = lireRole();

if (!role) {
  // Accès direct sans rôle : retour à l'accueil
  window.location.replace("index.html");
} else {
  document.getElementById("titre").textContent =
    role === "Createur" ? "Espace créateur" : `Bonjour ${libelle(role)}`;
}

document.getElementById("btn-changer").addEventListener("click", () => {
  effacerRole();
  window.location.href = "index.html";
});