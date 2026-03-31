import { doc, collection, writeBatch } from 'firebase/firestore';
import { firestore } from './firebase';

/**
 * Migrate local Dexie data to Firestore for the given user.
 * Handles Firestore's 500-operation batch limit by splitting into multiple batches.
 */
export async function migrateToFirestore(uid, { classroom, students, observations, apiKey }) {
  const batches = [];
  let batch = writeBatch(firestore);
  let count = 0;

  const flush = () => {
    if (count > 0) { batches.push(batch); batch = writeBatch(firestore); count = 0; }
  };

  const addOp = (fn) => {
    if (count >= 490) flush();
    fn(batch);
    count++;
  };

  // Profile
  addOp((b) => b.set(doc(firestore, 'users', uid, 'profile', 'main'), {
    classroom: classroom || null,
    apiKey: apiKey || '',
  }));

  // Students
  const studentsCol = collection(firestore, 'users', uid, 'students');
  students.forEach(s => {
    addOp((b) => b.set(doc(studentsCol, s.id), s));
  });

  // Observations
  const obsCol = collection(firestore, 'users', uid, 'observations');
  observations.forEach(o => {
    addOp((b) => b.set(doc(obsCol, o.id), o));
  });

  flush();
  await Promise.all(batches.map(b => b.commit()));
}
