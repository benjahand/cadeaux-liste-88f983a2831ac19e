import { lireRole, effacerRole } from "./session.js";
import { libelle } from "./roles.js";
import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
  ajouterIdee, modifierIdee, supprimerIdee, ecouterIdees,
  ecouterTout, ecouterReservations, reserver, annulerReservation,
  ajouterSurprise, supprimerCadeau
} from "./db.js";

const role = lireRole();
const ul = document.getElementById("liste-idees");
const message = document.getElementById("message");
const statut = document.getElementById("statut");

// État local : les écoutes le mettent à jour, afficher() redessine
const etat = { cadeaux: [], reservations: {} };
let idEnEdition = null; // null = mode ajout ; sinon id de l'idée modifiée

function lienSur(valeur) {
  try {
    const url = new URL(valeur);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function creerBouton(texte, action, id, classe) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = `btn btn-petit ${classe}`;
  b.textContent = texte;
  b.dataset.action = action;
  b.dataset.id = id;
  return b;
}

function creerCarte(idee) {
  const li = document.createElement("li");
  const estFamille = role !== "Createur";
  const reservePar = etat.reservations[idee.id];

  if (idee.surprise) {
    const badge = document.createElement("span");
    badge.className = "badge-surprise";
    badge.textContent = `🎁 Surprise de ${libelle(idee.ajoutePar)}`;
    li.append(badge);
  }

  const titre = document.createElement("strong");
  titre.textContent = idee.titre;
  li.append(titre);

  if (idee.description) {
    const desc = document.createElement("small");
    desc.textContent = ` – ${idee.description}`;
    li.append(desc);
  }

  const href = lienSur(idee.lien);
  if (href) {
    const a = document.createElement("a");
    a.className = "lien-produit";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = `Voir sur ${new URL(href).hostname.replace(/^www\./, "")} →`;
    li.append(a);
  }

  const actions = document.createElement("div");
  actions.className = "actions";

  if (estFamille) {
    if (!reservePar) {
      actions.append(creerBouton("Réserver", "reserver", idee.id, "btn-famille"));
    } else if (reservePar === role) {
      const info = document.createElement("span");
      info.textContent = "✅ Réservé par toi";
      actions.append(info, creerBouton("Annuler", "annuler", idee.id, "btn-createur"));
    } else {
      li.classList.add("reserve");
      const info = document.createElement("span");
      info.textContent = `🔒 Réservé par ${libelle(reservePar)}`;
      actions.append(info);
    }

    if (idee.surprise && idee.ajoutePar === role) {
      actions.append(creerBouton("Supprimer", "supprimer", idee.id, "btn-createur"));
    }
  } else {
    // Créateur : jamais de statut de réservation
    actions.append(
      creerBouton("Modifier", "modifier", idee.id, "btn-famille"),
      creerBouton("Supprimer", "supprimer-idee", idee.id, "btn-createur")
    );
  }

  if (actions.children.length) li.append(actions);
  return li;
}

function afficher() {
  ul.replaceChildren();
  [...etat.cadeaux]
    .sort((a, b) => (a.creeLe?.seconds ?? 0) - (b.creeLe?.seconds ?? 0))
    .forEach((idee) => ul.append(creerCarte(idee)));
}

// ---------- Mode Créateur ----------
function demarrerCreateur() {
  const form = document.getElementById("form-idee");
  const champTitre = document.getElementById("idee-titre");
  const champDescription = document.getElementById("idee-description");
  const champLien = document.getElementById("idee-lien");
  const boutonEnvoi = form.querySelector("button[type=submit]");
  form.hidden = false;

  const boutonAnnuler = document.createElement("button");
  boutonAnnuler.type = "button";
  boutonAnnuler.className = "btn btn-createur";
  boutonAnnuler.textContent = "Annuler la modification";
  boutonAnnuler.hidden = true;
  boutonEnvoi.after(boutonAnnuler);

  function sortirEdition() {
    idEnEdition = null;
    form.reset();
    boutonEnvoi.textContent = "Ajouter";
    boutonAnnuler.hidden = true;
  }

  ecouterIdees(
    (liste) => { etat.cadeaux = liste; afficher(); },
    (e) => { console.error(e.code, e.message); message.textContent = "Impossible de charger les idées."; }
  );

  ul.addEventListener("click", async (e) => {
    const bouton = e.target.closest("button[data-action]");
    if (!bouton) return;
    const { action, id } = bouton.dataset;

    if (action === "modifier") {
      const idee = etat.cadeaux.find((c) => c.id === id);
      if (!idee) return;
      idEnEdition = id;
      champTitre.value = idee.titre;
      champDescription.value = idee.description ?? "";
      champLien.value = idee.lien ?? "";
      boutonEnvoi.textContent = "Enregistrer";
      boutonAnnuler.hidden = false;
      form.scrollIntoView({ behavior: "smooth" });
      champTitre.focus();
    }

    if (action === "supprimer-idee") {
      if (!confirm("Supprimer cette idée définitivement ?")) return;
      bouton.disabled = true;
      try {
        await supprimerIdee(id);
        if (idEnEdition === id) sortirEdition();
      } catch (err) {
        console.error(err.code, err.message);
        message.textContent = "Suppression impossible, réessaie.";
        bouton.disabled = false;
      }
    }
  });

  boutonAnnuler.addEventListener("click", sortirEdition);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    boutonEnvoi.disabled = true;
    message.textContent = "";
    const donnees = {
      titre: champTitre.value.trim(),
      description: champDescription.value.trim(),
      lien: champLien.value.trim(),
    };
    try {
      if (idEnEdition) await modifierIdee(idEnEdition, donnees);
      else await ajouterIdee(donnees);
      sortirEdition();
    } catch (err) {
      console.error(err.code, err.message);
      message.textContent = "Enregistrement impossible, réessaie.";
    } finally {
      boutonEnvoi.disabled = false;
    }
  });
}

// ---------- Mode Famille ----------
function demarrerFamille() {
  const erreurChargement = (e) => {
    console.error(e.code, e.message);
    statut.textContent = "Impossible de charger la liste.";
  };

  ecouterTout((liste) => { etat.cadeaux = liste; afficher(); }, erreurChargement);
  ecouterReservations((dico) => { etat.reservations = dico; afficher(); }, erreurChargement);

  ul.addEventListener("click", async (e) => {
    const bouton = e.target.closest("button[data-action]");
    if (!bouton) return;
    const { action, id } = bouton.dataset;
    bouton.disabled = true;
    statut.textContent = "";
    try {
      if (action === "reserver") await reserver(id, role);
      if (action === "annuler") await annulerReservation(id);
      if (action === "supprimer") await supprimerCadeau(id);
    } catch (err) {
      console.error(err.code, err.message);
      statut.textContent = action === "reserver"
        ? "Quelqu'un vient de le réserver."
        : "Action impossible, réessaie.";
      bouton.disabled = false;
    }
  });

  const form = document.getElementById("form-surprise");
  form.hidden = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const bouton = form.querySelector("button[type=submit]");
    bouton.disabled = true;
    statut.textContent = "";
    try {
      await ajouterSurprise({
        titre: document.getElementById("surprise-titre").value.trim(),
        description: document.getElementById("surprise-description").value.trim(),
        lien: document.getElementById("surprise-lien").value.trim(),
      }, role);
      form.reset();
    } catch (err) {
      console.error(err.code, err.message);
      statut.textContent = "Ajout impossible, réessaie.";
    } finally {
      bouton.disabled = false;
    }
  });
}

// ---------- Démarrage ----------
if (!role) {
  window.location.replace("index.html");
} else {
  document.getElementById("titre").textContent =
    role === "Createur" ? "Ma liste" : `Bonjour ${libelle(role)}`;

  onAuthStateChanged(auth, (user) => {
    if (role === "Createur" && !user) {
      effacerRole();
      window.location.replace("index.html");
    }
  });

  if (role === "Createur") demarrerCreateur();
  else demarrerFamille();
}

document.getElementById("btn-changer").addEventListener("click", async () => {
  effacerRole();
  await Promise.race([
    signOut(auth).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  window.location.replace("index.html");
});