import { lireRole, effacerRole } from "./session.js";
import { libelle } from "./roles.js";
import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import { ajouterIdee, ecouterIdees } from "./db.js";

const role = lireRole();
const ul = document.getElementById("liste-idees");
const message = document.getElementById("message");

// N'accepte que http(s) : bloque "javascript:..."
function lienSur(valeur) {
  try {
    const url = new URL(valeur);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function afficherIdees(idees) {
  ul.replaceChildren();
  idees
    .sort((a, b) => (a.creeLe?.seconds ?? 0) - (b.creeLe?.seconds ?? 0))
    .forEach((idee) => {
      const li = document.createElement("li");

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
        const lien = document.createElement("a");
        lien.className = "lien-produit";
        lien.href = href;
        lien.target = "_blank";
        lien.rel = "noopener noreferrer";
        lien.textContent = `Voir sur ${new URL(href).hostname.replace(/^www\./, "")} →`;
        li.append(lien);
      }
      ul.append(li);
    });
}

function demarrerCreateur() {
  const form = document.getElementById("form-idee");
  form.hidden = false;

  ecouterIdees(afficherIdees, (e) => {
    console.error(e.code, e.message);
    message.textContent = "Impossible de charger les idées.";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const bouton = form.querySelector("button[type=submit]");
    bouton.disabled = true;
    message.textContent = "";
    try {
      await ajouterIdee({
        titre: document.getElementById("idee-titre").value.trim(),
        description: document.getElementById("idee-description").value.trim(),
        lien: document.getElementById("idee-lien").value.trim(),
      });
      form.reset();
    } catch (err) {
      console.error(err.code, err.message);
      message.textContent = "Ajout impossible, réessaie.";
    } finally {
      bouton.disabled = false;
    }
  });
}

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

  if (role === "Createur") {
    demarrerCreateur();
  }
}

document.getElementById("btn-changer").addEventListener("click", async () => {
  effacerRole();
  await Promise.race([
    signOut(auth).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  window.location.replace("index.html");
});