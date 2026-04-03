/**
 * Firebase initialization — GoldenHour Emergency Triage System
 * Connected to Ignisia Firebase project.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBWTJHUkTUHYYKDCTsEZezOr2N7GudJUdw",
  authDomain: "ignisia-57522.firebaseapp.com",
  projectId: "ignisia-57522",
  storageBucket: "ignisia-57522.firebasestorage.app",
  messagingSenderId: "247706697156",
  appId: "1:247706697156:web:6278a570caa9f99e0cb891",
  measurementId: "G-MD0HN834WR"
};

let app, db, auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log('[Firebase] Initialized — project:', firebaseConfig.projectId);
} catch (error) {
  console.warn('[Firebase] Init failed, demo mode:', error.message);
  db = null;
  auth = null;
}

export { app, db, auth };

// Patient operations
export const savePatient = async (patientData) => {
  if (!db) {
    console.log('[Demo] Saving patient:', patientData);
    return { id: 'demo-' + Date.now(), ...patientData };
  }
  try {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...patientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...patientData };
  } catch (error) {
    console.error('Error saving patient:', error);
    throw error;
  }
};

export const getPatients = async () => {
  if (!db) return [];
  try {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
};

export const getHospitals = async () => {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'hospitals'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return [];
  }
};

export const subscribeToPatients = (callback) => {
  if (!db) return () => {};
  const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(q, (snap) => {
    const patients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(patients);
  });
};
