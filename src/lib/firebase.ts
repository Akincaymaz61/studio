import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "studio-5943294547-f9c69",
  "appId": "1:147845352597:web:2b95749ee8fe1ca7acdf9c",
  "apiKey": "AIzaSyBLuDntCjeiyHNT0bTHcrfl4DY783oZW-E",
  "authDomain": "studio-5943294547-f9c69.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "147845352597"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
