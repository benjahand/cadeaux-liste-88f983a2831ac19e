export const EMAIL_FAMILLE = "famille@cadeaux-liste.fr";

export const LIBELLES = {
  "Maman": "Maman",
  "Papa": "Papa",
  "Soeur-ainee": "Marilou",
  "Soeur-cadette": "Elisa",
  "Copine": "Margot",
  "Createur": "Créateur",
};

export function libelle(role) {
  return LIBELLES[role] ?? role;
}