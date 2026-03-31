import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc, collection, onSnapshot, setDoc, deleteDoc, writeBatch, getDocs,
} from 'firebase/firestore';
import { firestore } from '../firebase';

export default function useFirestoreSync(user) {
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState(null);
  const [observations, setObservations] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const loadedParts = useRef({ profile: false, students: false, observations: false });

  const uid = user?.uid;

  // Check if all parts have loaded
  const checkAllLoaded = useCallback(() => {
    const p = loadedParts.current;
    if (p.profile && p.students && p.observations) setLoaded(true);
  }, []);

  // Subscribe to Firestore collections
  useEffect(() => {
    if (!uid) {
      setClassroom(null);
      setStudents(null);
      setObservations(null);
      setApiKey(null);
      setLoaded(false);
      loadedParts.current = { profile: false, students: false, observations: false };
      return;
    }

    const userRef = doc(firestore, 'users', uid);

    // Profile listener
    const unsubProfile = onSnapshot(doc(firestore, 'users', uid, 'profile', 'main'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setClassroom(data.classroom || null);
        setApiKey(data.apiKey || '');
      }
      loadedParts.current.profile = true;
      checkAllLoaded();
    });

    // Students listener
    const unsubStudents = onSnapshot(collection(firestore, 'users', uid, 'students'), (snap) => {
      const list = snap.docs.map(d => d.data()).sort((a, b) => a.number - b.number);
      setStudents(list);
      loadedParts.current.students = true;
      checkAllLoaded();
    });

    // Observations listener
    const unsubObs = onSnapshot(collection(firestore, 'users', uid, 'observations'), (snap) => {
      const list = snap.docs.map(d => d.data());
      setObservations(list);
      setSyncing(snap.metadata.hasPendingWrites);
      loadedParts.current.observations = true;
      checkAllLoaded();
    });

    return () => { unsubProfile(); unsubStudents(); unsubObs(); };
  }, [uid, checkAllLoaded]);

  // --- Write functions ---

  const saveClassroom = useCallback(async (data) => {
    if (!uid) return;
    await setDoc(doc(firestore, 'users', uid, 'profile', 'main'), { classroom: data }, { merge: true });
  }, [uid]);

  const saveApiKey = useCallback(async (key) => {
    if (!uid) return;
    await setDoc(doc(firestore, 'users', uid, 'profile', 'main'), { apiKey: key }, { merge: true });
  }, [uid]);

  const saveStudents = useCallback(async (list) => {
    if (!uid) return;
    const colRef = collection(firestore, 'users', uid, 'students');
    // Delete existing, write new (batch)
    const existing = await getDocs(colRef);
    const batches = [];
    let batch = writeBatch(firestore);
    let count = 0;

    existing.docs.forEach(d => { batch.delete(d.ref); count++; });
    list.forEach(s => {
      if (count >= 490) { batches.push(batch); batch = writeBatch(firestore); count = 0; }
      batch.set(doc(colRef, s.id), s);
      count++;
    });
    batches.push(batch);
    await Promise.all(batches.map(b => b.commit()));
  }, [uid]);

  const addObservation = useCallback(async (obs) => {
    if (!uid) return;
    await setDoc(doc(firestore, 'users', uid, 'observations', obs.id), obs);
  }, [uid]);

  const deleteObservation = useCallback(async (id) => {
    if (!uid) return;
    await deleteDoc(doc(firestore, 'users', uid, 'observations', id));
  }, [uid]);

  const updateObservation = useCallback(async (obs) => {
    if (!uid) return;
    await setDoc(doc(firestore, 'users', uid, 'observations', obs.id), obs);
  }, [uid]);

  const replaceAllObservations = useCallback(async (list) => {
    if (!uid) return;
    const colRef = collection(firestore, 'users', uid, 'observations');
    const existing = await getDocs(colRef);
    const batches = [];
    let batch = writeBatch(firestore);
    let count = 0;

    existing.docs.forEach(d => { batch.delete(d.ref); count++; });
    list.forEach(o => {
      if (count >= 490) { batches.push(batch); batch = writeBatch(firestore); count = 0; }
      batch.set(doc(colRef, o.id), o);
      count++;
    });
    batches.push(batch);
    await Promise.all(batches.map(b => b.commit()));
  }, [uid]);

  return {
    classroom, students, observations, apiKey, loaded, syncing,
    saveClassroom, saveApiKey, saveStudents,
    addObservation, deleteObservation, updateObservation, replaceAllObservations,
  };
}
