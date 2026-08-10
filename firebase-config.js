// Wklej tutaj dane swojego projektu Firebase (Project settings -> Your apps -> Web app -> SDK setup and configuration).
// Te wartości NIE są tajne - bezpieczeństwo zapewniają reguły Firestore, nie ukrywanie tego pliku.
const firebaseConfig = {
  apiKey: "TWOJ_API_KEY",
  authDomain: "TWOJ_PROJEKT.firebaseapp.com",
  projectId: "TWOJ_PROJEKT",
  storageBucket: "TWOJ_PROJEKT.appspot.com",
  messagingSenderId: "TWOJ_SENDER_ID",
  appId: "TWOJ_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
