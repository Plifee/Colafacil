// ========================================
// COLAFÁCIL - FIREBASE
// ========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    onChildAdded,
    onValue,
    onDisconnect,
    remove,
    set,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";


// CONFIGURAÇÃO DO COLAFÁCIL

const firebaseConfig = {
    apiKey: "AIzaSyDEMKgQPeXNID001YQbf3qFrV5hoENz6Rg",
    authDomain: "colafacil-3d818.firebaseapp.com",
    databaseURL: "https://colafacil-3d818-default-rtdb.firebaseio.com",
    projectId: "colafacil-3d818",
    storageBucket: "colafacil-3d818.firebasestorage.app",
    messagingSenderId: "1003242568143",
    appId: "1:1003242568143:web:622760c2bed12c687efaba",
    measurementId: "G-TGQTP3QB36"
};


// INICIALIZAR FIREBASE

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

const auth = getAuth(app);


// EXPORTAR FUNÇÕES

export {
    database,
    auth,
    ref,
    push,
    onChildAdded,
    onValue,
    onDisconnect,
    remove,
    set,
    runTransaction,
    serverTimestamp,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
};