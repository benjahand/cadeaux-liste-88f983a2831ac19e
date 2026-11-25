import { db } from "./firebase-config.js";
import {
  collection, addDoc, query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const cadeauxRef = collection(db, "cadeaux");

export function ajouterIdee({ titre, description, lien }) {
  return addDoc(cadeauxRef, {
    titre,
    description,
    lien,
    surprise: false,
    ajoutePar: "Createur",
    creeLe: serverTimestamp(),
  });
}

export function ecouterIdees(callback, callbackErreur) {
  // Le filtre est appliqué par Firestore : les surprises n'arrivent jamais ici
  const q = query(cadeauxRef, where("surprise", "==", false));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (erreur) => callbackErreur?.(erreur)
  );
}