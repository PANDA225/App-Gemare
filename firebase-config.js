import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAhen6fR37lqj53RSbtpFS74kWU3_KNcjE",
  authDomain: "gemare-react.firebaseapp.com",
  databaseURL: "https://gemare-react-default-rtdb.firebaseio.com",
  projectId: "gemare-react",
  storageBucket: "gemare-react.appspot.com",
  messagingSenderId: "567078753341",
  appId: "1:567078753341:web:2eeae3c71baa29e0824654",
  measurementId: "G-7JG532738V",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const storage = getStorage(app);
export { db, auth, storage };
