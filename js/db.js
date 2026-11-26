import { db } from "./firebase-config.js";
import {
  collection, addDoc, setDoc, updateDoc, deleteDoc, doc,
  query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const cadeauxRef = collection(db, "cadeaux");
const reservationsRef = collection(db, "reservations");

// ---------- Créateur ----------
export function ajouterIdee({ titre, description, liens }) {
  return addDoc(cadeauxRef, {
    titre, description, liens,
    surprise: false,
    ajoutePar: "Createur",
    creeLe: serverTimestamp(),
  });
}

export function modifierIdee(id, { titre, description, liens }) {
  return updateDoc(doc(db, "cadeaux", id), { titre, description, liens });
}

// Ne touche pas à "reservations" : le Créateur n'y a pas accès
export function supprimerIdee(id) {
  return deleteDoc(doc(db, "cadeaux", id));
}

// Le filtre where garantit que les surprises n'arrivent jamais chez le Créateur
export function ecouterIdees(callback, callbackErreur) {
  const q = query(cadeauxRef, where("surprise", "==", false));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (e) => callbackErreur?.(e)
  );
}

// ---------- Famille ----------
export function ecouterTout(callback, callbackErreur) {
  return onSnapshot(
    cadeauxRef,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (e) => callbackErreur?.(e)
  );
}

// Dictionnaire { idCadeau: prénom }
export function ecouterReservations(callback, callbackErreur) {
  return onSnapshot(
    reservationsRef,
    (snap) => callback(Object.fromEntries(snap.docs.map((d) => [d.id, d.data().reservePar]))),
    (e) => callbackErreur?.(e)
  );
}

// ID du document = ID du cadeau : impossible de réserver deux fois
export function reserver(idCadeau, role) {
  return setDoc(doc(db, "reservations", idCadeau), {
    reservePar: role,
    reserveLe: serverTimestamp(),
  });
}

export function annulerReservation(idCadeau) {
  return deleteDoc(doc(db, "reservations", idCadeau));
}

export function ajouterSurprise({ titre, description, liens }, role) {
  return addDoc(cadeauxRef, {
    titre, description, liens,
    surprise: true,
    ajoutePar: role,
    creeLe: serverTimestamp(),
  });
}

export function supprimerCadeau(idCadeau) {
  return Promise.all([
    deleteDoc(doc(db, "cadeaux", idCadeau)),
    deleteDoc(doc(db, "reservations", idCadeau)),
  ]);
}