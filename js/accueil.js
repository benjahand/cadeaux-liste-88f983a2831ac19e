import { enregistrerRole, lireRole } from "./session.js";
import { EMAIL_FAMILLE } from "./roles.js";
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const form = document.getElementById("form-createur");
const email = document.getElementById("email");
const mdp = document.getElementById("mdp");
const erreur = document.getElementById("erreur");
const boutonEnvoi = form.querySelector("button[type=submit]");

const formCode = document.getElementById("form-code");
const champCode = document.getElementById("code");
const erreurCode = document.getElementById("erreur-code");
const boutonCode = formCode.querySelector("button[type=submit]");

let profilChoisi = null; // prénom en attente de validation du code

// Seul le bouton choisi change d'apparence
function marquer(boutonChoisi) {
  document.querySelectorAll("button[data-role]").forEach((b) => {
    const actif = b === boutonChoisi;
    b.classList.toggle("selectionne", actif);
    b.setAttribute("aria-pressed", String(actif));
  });
}

// Un rôle invalide (session Firebase absente) est effacé par liste.js : pas de boucle
if (lireRole()) {
  window.location.replace("liste.html");
}

document.addEventListener("click", async (event) => {
  const bouton = event.target.closest("button[data-role]");
  if (!bouton) return;
  const role = bouton.dataset.role;
  marquer(bouton);

  if (role === "Createur") {
    formCode.hidden = true;
    form.hidden = false;
    email.focus();
    return;
  }

  // Profil famille : déjà connecté avec le compte famille ?
  await auth.authStateReady();
  if (auth.currentUser?.email === EMAIL_FAMILLE) {
    enregistrerRole(role);
    window.location.replace("liste.html");
  } else {
    profilChoisi = role;
    form.hidden = true;
    formCode.hidden = false;
    champCode.focus();
  }
});

// Code famille = mot de passe du compte famille, vérifié par Firebase
formCode.addEventListener("submit", async (event) => {
  event.preventDefault();
  boutonCode.disabled = true;
  erreurCode.textContent = "";
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, EMAIL_FAMILLE, champCode.value);
    enregistrerRole(profilChoisi);
    window.location.replace("liste.html");
  } catch (e) {
    console.error(e.code, e.message);
    erreurCode.textContent = e.code === "auth/too-many-requests"
      ? "Trop d'essais, réessaie dans quelques minutes."
      : "Code incorrect.";
    champCode.value = "";
    boutonCode.disabled = false;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  boutonEnvoi.disabled = true;
  boutonEnvoi.textContent = "Connexion…";
  erreur.textContent = "";
  try {
    await setPersistence(auth, browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email.value, mdp.value);
    enregistrerRole("Createur");
    window.location.replace("liste.html");
  } catch (e) {
    console.error(e.code, e.message);
    erreur.textContent = "Identifiants incorrects.";
    boutonEnvoi.disabled = false;
    boutonEnvoi.textContent = "Se connecter";
  }
});