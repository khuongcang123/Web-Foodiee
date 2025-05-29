// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDV06m47eD90e8n3vTd6B9NmKsEOUz_r_E",
    authDomain: "foodiee-506f6.firebaseapp.com",
    projectId: "foodiee-506f6",
    storageBucket: "foodiee-506f6.appspot.com",
    messagingSenderId: "628837902932",
    appId: "1:628837902932:web:fcdfcfca84ad76e700dbc1",
    measurementId: "G-3ZNLCPWM94"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html";
    }
});

// Toggle Sidebar
const toggleBtn = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');

toggleBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('closed');
});
