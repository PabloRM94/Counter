import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { showAlert } from './ui.js'; // Importar la función de alerta

async function loginUser(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Validación básica
    if (!email || !password) {
        showAlert('Por favor, completa todos los campos', 'warning');
        return;
    }
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Inicio de sesión exitoso');
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        
        // Mensajes de error más amigables
        let errorMessage = 'Error en el inicio de sesión';
        
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Email o contraseña incorrectos';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'El formato del email no es válido';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Esta cuenta ha sido deshabilitada';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Demasiados intentos fallidos. Por favor, inténtalo más tarde';
        }
        
        showAlert(errorMessage, 'danger');
    }
}

async function registerUser(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    // Validación básica
    if (!email || !password) {
        showAlert('Por favor, completa todos los campos', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }
    
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Registro exitoso');
        showAlert('¡Registro exitoso! Ya puedes iniciar sesión', 'success');
        
        // Cambiar al formulario de inicio de sesión después del registro exitoso
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    } catch (error) {
        console.error('Error en el registro:', error);
        
        // Mensajes de error más amigables
        let errorMessage = 'Error en el registro';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este correo electrónico ya está registrado';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'El formato del correo electrónico no es válido';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña es demasiado débil';
        }
        
        showAlert(errorMessage, 'danger');
    }
}

async function logout() {
    try {
        await signOut(auth);
        console.log('Cierre de sesión exitoso');
        // Opcional: redirigir a la página de inicio de sesión
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('counterSection').style.display = 'none';
        document.getElementById('statisticsSection').style.display = 'none';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showAlert('Error al cerrar sesión', 'danger');
    }
}

// Asegúrate de exportar todas las funciones
export { loginUser, registerUser, logout };
