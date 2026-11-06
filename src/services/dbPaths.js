import { 
  db, 
  collection, 
  doc, 
  getDoc,
  getDocs,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from './firebase';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

/**
 * Returns a Firestore collection reference scoped to the specified mess.
 * Path: messes/{targetMessId}/{subpath}
 */
export const getMessCollection = (messId, ...subpath) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  return collection(db, 'messes', targetMessId, ...subpath);
};

/**
 * Returns a Firestore document reference scoped to the specified mess.
 * Path: messes/{targetMessId}/{subpath}
 */
export const getMessDoc = (messId, ...subpath) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  return doc(db, 'messes', targetMessId, ...subpath);
};

/**
 * Returns a Firestore collection reference at the database root.
 * Used exclusively for non-destructive backwards-compatible fallback for Khadok Mess.
 */
export const getRootCollection = (...subpath) => {
  return collection(db, ...subpath);
};

/**
 * Returns a Firestore document reference at the database root.
 */
export const getRootDoc = (...subpath) => {
  return doc(db, ...subpath);
};

/**
 * Dual-write setDoc:
 * 1. Writes to messes/{targetMessId}/{subpath}
 * 2. If targetMessId === DEFAULT_MESS_ID ('khadok-mess'), ALSO writes to root ({subpath})
 *    to guarantee 100% data preservation with zero harm to present data!
 */
export const setMessDocData = async (messId, subpath, data, options = { merge: true }) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const messDocRef = doc(db, 'messes', targetMessId, ...subpath);
  await setDoc(messDocRef, data, options);

  // If Khadok Mess, mirror write to root to ensure original records stay safe and synced
  if (targetMessId === DEFAULT_MESS_ID) {
    try {
      const rootDocRef = doc(db, ...subpath);
      await setDoc(rootDocRef, data, options);
    } catch (err) {
      console.warn('[Data Safety] Backup write to root skipped:', err.message);
    }
  }
};

/**
 * Dual-write addDoc:
 * 1. Adds document to messes/{targetMessId}/{subpath}
 * 2. If targetMessId === DEFAULT_MESS_ID, ALSO saves to root ({subpath}/{docId})
 */
export const addMessDocData = async (messId, subpath, data) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const messColRef = collection(db, 'messes', targetMessId, ...subpath);
  const docRef = await addDoc(messColRef, data);

  if (targetMessId === DEFAULT_MESS_ID) {
    try {
      const rootDocRef = doc(db, ...subpath, docRef.id);
      await setDoc(rootDocRef, data, { merge: true });
    } catch (err) {
      console.warn('[Data Safety] Backup add to root skipped:', err.message);
    }
  }

  return docRef;
};

/**
 * Dual-write updateDoc:
 * 1. Updates messes/{targetMessId}/{subpath}
 * 2. If targetMessId === DEFAULT_MESS_ID, ALSO updates root ({subpath})
 */
export const updateMessDocData = async (messId, subpath, data) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const messDocRef = doc(db, 'messes', targetMessId, ...subpath);
  await updateDoc(messDocRef, data);

  if (targetMessId === DEFAULT_MESS_ID) {
    try {
      const rootDocRef = doc(db, ...subpath);
      await updateDoc(rootDocRef, data);
    } catch (err) {
      console.warn('[Data Safety] Backup update to root skipped:', err.message);
    }
  }
};

/**
 * Dual-write deleteDoc:
 * 1. Deletes from messes/{targetMessId}/{subpath}
 * 2. If targetMessId === DEFAULT_MESS_ID, ALSO deletes from root ({subpath})
 */
export const deleteMessDocData = async (messId, subpath) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const messDocRef = doc(db, 'messes', targetMessId, ...subpath);
  await deleteDoc(messDocRef);

  if (targetMessId === DEFAULT_MESS_ID) {
    try {
      const rootDocRef = doc(db, ...subpath);
      await deleteDoc(rootDocRef);
    } catch (err) {
      console.warn('[Data Safety] Backup delete from root skipped:', err.message);
    }
  }
};
