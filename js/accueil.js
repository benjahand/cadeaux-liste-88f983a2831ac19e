import { enregistrerRole, lireRole } from "./session.js";
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const form = document.getElementById("form-createur");
const email = document.getElementById("email");
const mdp = document.getElementById("mdp");
const erreur = document.getElementById("erreur");
const boutonEnvoi = form.querySelector("button[type=submit]");

// Déjà identifié ? On saute l'écran de choix.
if (lireRole()) {
  window.location.replace("liste.html");
}

document.addEventListener("click", (event) => {
  const bouton = event.target.closest("button[data-role]");
  if (!bouton) return;

  if (bouton.dataset.role !== "Createur") {
    enregistrerRole(bouton.dataset.role);
    window.location.replace("liste.html");
  } else {
    form.hidden = false;
    email.focus();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  boutonEnvoi.disabled = true;
  boutonEnvoi.textContent = "Connexion…";
  erreur.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, email.value, mdp.value);
    enregistrerRole("Createur");
    window.location.replace("liste.html");
  } catch (e) {
    erreur.textContent = "Identifiants incorrects.";
    boutonEnvoi.disabled = false;
    boutonEnvoi.textContent = "Se connecter";
  }
});