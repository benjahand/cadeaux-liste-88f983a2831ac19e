// N'accepte que http(s) : bloque "javascript:..."
export function lienSur(valeur) {
  try {
    const url = new URL(valeur);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

// Renvoie toujours un tableau d'adresses, quel que soit l'ancien format
export function liensDe(idee) {
  if (Array.isArray(idee.liens)) {
    return idee.liens.map((l) => (typeof l === "string" ? l : l?.url)).filter(Boolean);
  }
  return idee.lien ? [idee.lien] : [];
}

// Éditeur de liens réutilisable (formulaire Créateur et formulaire surprise)
export function creerEditeurLiens(conteneur, boutonAjout, max = 10) {
  function ajouterLigne(url = "") {
    if (conteneur.children.length >= max) return;

    const ligne = document.createElement("div");
    ligne.className = "ligne-lien";

    const champUrl = document.createElement("input");
    champUrl.className = "lien-url";
    champUrl.type = "url";
    champUrl.placeholder = "https://...";
    champUrl.setAttribute("aria-label", "Adresse du lien");
    champUrl.value = url;

    const retirer = document.createElement("button");
    retirer.type = "button";
    retirer.className = "btn-retirer";
    retirer.textContent = "✕";
    retirer.setAttribute("aria-label", "Retirer ce lien");
    retirer.addEventListener("click", () => {
      ligne.remove();
      if (!conteneur.children.length) ajouterLigne();
    });

    ligne.append(champUrl, retirer);
    conteneur.append(ligne);
  }

  boutonAjout.addEventListener("click", () => ajouterLigne());

  function remplir(liens) {
    conteneur.replaceChildren();
    if (liens.length) liens.forEach((u) => ajouterLigne(u));
    else ajouterLigne();
  }

  function vider() {
    remplir([]);
  }

  function lire() {
    return [...conteneur.querySelectorAll(".lien-url")]
      .map((c) => lienSur(c.value.trim()))
      .filter(Boolean);
  }

  vider();
  return { lire, remplir, vider };
}