// Wklej tutaj dane swojego projektu Firebase (Project settings -> Your apps -> Web app -> SDK setup and configuration).
// Te wartości NIE są tajne - bezpieczeństwo zapewniają reguły Firestore, nie ukrywanie tego pliku.
const firebaseConfig = {
  apiKey: "AIzaSyAuHkiFVBYsjWp5ZC2rhU4dM9Ym3Ckcwec",
  authDomain: "asystent-finansow.firebaseapp.com",
  projectId: "asystent-finansow",
  storageBucket: "asystent-finansow.firebasestorage.app",
  messagingSenderId: "773374468671",
  appId: "1:773374468671:web:57725270c46878168d4e8a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
