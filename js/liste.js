import { lireRole, effacerRole } from "./session.js";
import { libelle, EMAIL_FAMILLE } from "./roles.js";
import { auth } from "./firebase-config.js";
import { lienSur, liensDe, creerEditeurLiens } from "./liens.js";
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

  // Ligne 1 : titre
  const titre = document.createElement("div");
  titre.className = "ligne-titre";
  titre.textContent = idee.titre;
  titre.title = idee.titre;
  li.append(titre);

  // Ligne 2 : description (grise)
  if (idee.description) {
    const desc = document.createElement("div");
    desc.className = "ligne-description";
    desc.textContent = idee.description;
    desc.title = idee.description;
    li.append(desc);
  }

  // Ligne 3 : liens côte à côte (rouges)
  const hrefs = liensDe(idee).map(lienSur).filter(Boolean);
  if (hrefs.length) {
    const ligneLiens = document.createElement("div");
    ligneLiens.className = "ligne-liens";
    hrefs.forEach((href, i) => {
      const a = document.createElement("a");
      a.className = "chip-lien";
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.title = href;
      a.textContent = hrefs.length === 1
        ? `🔗 ${new URL(href).hostname.replace(/^www\./, "")}`
        : `🔗 Lien ${i + 1}`;
      ligneLiens.append(a);
    });
    li.append(ligneLiens);
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
  const editeur = creerEditeurLiens(
    document.getElementById("liens-conteneur"),
    document.getElementById("btn-ajout-lien")
  );
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
    editeur.vider();
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
      editeur.remplir(liensDe(idee));
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
      liens: editeur.lire(),
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

  // CORRECTIF : cette ligne manquait dans ta version (ReferenceError)
  const form = document.getElementById("form-surprise");
  const editeur = creerEditeurLiens(
    document.getElementById("liens-conteneur-surprise"),
    document.getElementById("btn-ajout-lien-surprise")
  );
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
        liens: editeur.lire(),
      }, role);
      form.reset();
      editeur.vider();
    } catch (err) {
      console.error(err.code, err.message);
      statut.textContent = "Ajout impossible, réessaie.";
    } finally {
      bouton.disabled = false;
    }
  });
}

// ---------- Démarrage ----------
function refuser() {
  effacerRole();
  window.location.replace("index.html");
}

let demarre = false;

if (!role) {
  window.location.replace("index.html");
} else {
  document.getElementById("titre").textContent =
    role === "Createur" ? "Ma liste de cadeaux" : `Bonjour ${libelle(role)}`;

  // Aucune requête Firestore avant que la session Firebase soit validée
  onAuthStateChanged(auth, (user) => {
    const familleConnectee = user?.email === EMAIL_FAMILLE;

    if (role === "Createur") {
      if (!user || familleConnectee) return refuser();
    } else if (!familleConnectee) {
      return refuser();
    }

    if (demarre) return;
    demarre = true;
    if (role === "Createur") demarrerCreateur();
    else demarrerFamille();
  });
}

document.getElementById("btn-changer").addEventListener("click", async () => {
  effacerRole();
  // Le Créateur est déconnecté ; la famille reste connectée (pas de code à retaper)
  if (role === "Createur") {
    await Promise.race([
      signOut(auth).catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  }
  window.location.replace("index.html");
});