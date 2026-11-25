import { enregistrerRole, lireRole } from "./session.js";

// Déjà identifié ? On saute l'écran de choix.
if (lireRole()) {
  window.location.href = "liste.html";
}

// Un seul écouteur sur toute la page (délégation d'événements)
document.addEventListener("click", (event) => {
  const bouton = event.target.closest("button[data-role]");
  if (!bouton) return;

  enregistrerRole(bouton.dataset.role);
  window.location.href = "liste.html";
});