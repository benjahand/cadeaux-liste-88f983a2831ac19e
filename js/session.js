const ROLES_AUTORISES = ["Maman", "Papa", "Soeur-ainee", "Soeur-cadette", "Copine"];

const CLE_FAMILLE = "roleFamille";
const CLE_CREATEUR = "roleCreateur";

export function enregistrerRole(role){
    if (role === "Createur"){
        // sessionStorage : disparaît à la fermeture de l'onglet
        sessionStorage.setItem(CLE_CREATEUR, "oui");
        localStorage.removeItem(CLE_FAMILLE); // évite d'avoir deux rôles à la fois
    } else if (ROLES_AUTORISES.includes(role)) {
    // localStorage : persiste, la famille n'a pas à re-choisir à chaque visite
    localStorage.setItem(CLE_FAMILLE, role);
    sessionStorage.removeItem(CLE_CREATEUR);
  }
  // sinon : valeur inconnue, on ignore
}

export function lireRole() {
  if (sessionStorage.getItem(CLE_CREATEUR) === "oui") {
    return "Createur";
  }
  const role = localStorage.getItem(CLE_FAMILLE);
  // Validation : le localStorage est modifiable à la main (F12)
  return ROLES_AUTORISES.includes(role) ? role : null;
}

export function effacerRole() {
  sessionStorage.removeItem(CLE_CREATEUR);
  localStorage.removeItem(CLE_FAMILLE);
}