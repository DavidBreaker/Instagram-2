// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB8e6dMyF3vYaOBOK9G3pzXe3SPFAROXso",
  authDomain: "instagram-clone-b43b6.firebaseapp.com",
  projectId: "instagram-clone-b43b6",
  storageBucket: "instagram-clone-b43b6.appspot.com",
  messagingSenderId: "668435475035",
  appId: "1:668435475035:web:bb1caca599df644cea6d7e",
  measurementId: "G-M237LJTF2X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
