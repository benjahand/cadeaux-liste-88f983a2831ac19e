const ROLES_AUTORISES = ["Maman", "Papa", "Soeur-ainee", "Soeur-cadette", "Copine"];

const CLE_FAMILLE = "roleFamille";
const CLE_CREATEUR = "roleCreateur";

export function enregistrerRole(role) {
  if (role === "Createur") {
    sessionStorage.setItem(CLE_CREATEUR, "oui");
    localStorage.removeItem(CLE_FAMILLE);
  } else if (ROLES_AUTORISES.includes(role)) {
    localStorage.setItem(CLE_FAMILLE, role);
    sessionStorage.removeItem(CLE_CREATEUR);
  }
}

export function lireRole() {
  if (sessionStorage.getItem(CLE_CREATEUR) === "oui") return "Createur";
  const role = localStorage.getItem(CLE_FAMILLE);
  return ROLES_AUTORISES.includes(role) ? role : null;
}

export function effacerRole() {
  sessionStorage.removeItem(CLE_CREATEUR);
  localStorage.removeItem(CLE_FAMILLE);
}