import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA8XyWGKoXTxjYQQkhiyuTGdDeskerhgGU",
  authDomain: "verisahaflu-38861.firebaseapp.com",
  projectId: "verisahaflu-38861",
  storageBucket: "verisahaflu-38861.appspot.com",
  messagingSenderId: "136877018432",
  appId: "1:136877018432:web:58109a0a9a2242d7f1fea5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});

export default app; 