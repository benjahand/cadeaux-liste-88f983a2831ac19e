export const LIBELLES = {
  "Maman": "Maman",
  "Papa": "Papa",
  "Soeur-ainee": "Marilou",
  "Soeur-cadette": "Elisa",
  "Copine": "Margot",
  "Createur": "Créateur",
};

export function libelle(role) {
  // Si l'identifiant est inconnu, on retombe sur l'identifiant lui-même
  return LIBELLES[role] ?? role;
}