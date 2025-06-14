// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDV06m47eD90e8n3vTd6B9NmKsEOUz_r_E",
    authDomain: "foodiee-506f6.firebaseapp.com",
    projectId: "foodiee-506f6",
    storageBucket: "foodiee-506f6.appspot.com",
    messagingSenderId: "628837902932",
    appId: "1:628837902932:web:fcdfcfca84ad76e700dbc1",
    measurementId: "G-3ZNLCPWM94"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM Elements
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const registerError = document.getElementById('registerError');
const loginError = document.getElementById('loginError');
const loginSuccess = document.getElementById('loginSuccess');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

// Toggle password visibility
document.getElementById('toggleRegisterPassword').addEventListener('click', function () {
    togglePasswordVisibility('registerPassword', this);
});

document.getElementById('toggleLoginPassword').addEventListener('click', function () {
    togglePasswordVisibility('loginPassword', this);
});

function togglePasswordVisibility(inputId, icon) {
    const passwordInput = document.getElementById(inputId);
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Chuyển đổi giữa đăng nhập và đăng ký
signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
    clearMessages();
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
    clearMessages();
});

// Xử lý đăng ký
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    registerError.textContent = '';

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (password.length < 6) {
        registerError.textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            registerError.textContent = '';
            registerForm.reset();
            container.classList.remove("right-panel-active");
            loginSuccess.textContent = 'Đăng ký thành công! Vui lòng đăng nhập.';
            setTimeout(() => {
                loginSuccess.textContent = '';
            }, 5000);
        })
        .catch((error) => {
            handleAuthError(error, registerError);
        });
});

// Xử lý đăng nhập
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.textContent = '';
    loginSuccess.textContent = '';

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            loginError.textContent = '';
            window.location.href = "home.html";
        })
        .catch((error) => {
            handleAuthError(error, loginError);
        });
});

// Xử lý quên mật khẩu
forgotPasswordLink.addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;

    if (!email) {
        loginError.textContent = 'Vui lòng nhập email để đặt lại mật khẩu.';
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            loginError.textContent = '';
            loginSuccess.textContent = 'Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.';
            setTimeout(() => loginSuccess.textContent = '', 5000);
        })
        .catch((error) => {
            handleAuthError(error, loginError);
        });
});

// Xử lý lỗi chung
function handleAuthError(error, errorElement) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            errorElement.textContent = 'Email đã được sử dụng. Vui lòng chọn email khác.';
            break;
        case 'auth/invalid-email':
            errorElement.textContent = 'Email không hợp lệ. Vui lòng kiểm tra lại.';
            break;
        case 'auth/weak-password':
            errorElement.textContent = 'Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn.';
            break;
        case 'auth/user-not-found':
            errorElement.textContent = 'Tài khoản không tồn tại. Vui lòng kiểm tra lại.';
            break;
        case 'auth/wrong-password':
            errorElement.textContent = 'Sai mật khẩu. Vui lòng thử lại.';
            break;
        default:
            errorElement.textContent = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
            console.error(error);
    }
}

function clearMessages() {
    registerError.textContent = '';
    loginError.textContent = '';
    loginSuccess.textContent = '';
}

// Kiểm tra trạng thái đăng nhập
auth.onAuthStateChanged(user => {
    if (user) {
        window.location.href = "home.html";
    }
});
