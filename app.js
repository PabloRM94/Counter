import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Constantes
    const MONTHS = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Referencias DOM
    const yearBtn = document.getElementById('yearDisplay');
    const monthBtn = document.getElementById('currentMonthDisplay');
    const counterDisplay = document.getElementById('count');
    const incrementButton = document.getElementById('incrementButton');
    const decrementButton = document.getElementById('decrementButton');
    const authSection = document.getElementById('authSection');
    const counterSection = document.getElementById('counterSection');

    // Referencias de autenticación
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const logoutButton = document.getElementById('logoutButton');

    // Verificar que todos los elementos existen
    if (!yearBtn || !monthBtn || !counterDisplay || !incrementButton || !decrementButton || !authSection || !counterSection || !loginForm || !registerForm || !switchToRegister || !switchToLogin || !logoutButton) {
        console.error('No se pudieron encontrar todos los elementos necesarios');
        return;
    }

    // Variables de estado
    let currentCount = 0;
    let selectedDate = new Date();
    const currentDate = new Date();

    // Funciones de utilidad
    function getMonthKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    // Funciones de la interfaz de fecha
    function setupYearList() {
        yearBtn.textContent = selectedDate.getFullYear();
    }

    function setupMonthList() {
        monthBtn.textContent = MONTHS[selectedDate.getMonth()];
    }

    function updateDateDisplay() {
        yearBtn.textContent = selectedDate.getFullYear();
        monthBtn.textContent = MONTHS[selectedDate.getMonth()];
    }

    // Event Listeners
    yearBtn.onclick = (e) => {
        e.stopPropagation();
        selectedDate.setFullYear(parseInt(yearBtn.textContent));
        updateDateDisplay();
        loadUserCounter();
    };

    monthBtn.onclick = (e) => {
        e.stopPropagation();
        selectedDate.setMonth(MONTHS.indexOf(monthBtn.textContent));
        updateDateDisplay();
        loadUserCounter();
    };

    // Funciones del contador
    async function updateCounter(increment) {
        if (getMonthKey(selectedDate) !== getMonthKey(currentDate)) {
            alert('Solo puedes modificar el contador del mes actual');
            return;
        }

        try {
            currentCount += increment;
            counterDisplay.textContent = currentCount;
            
            const monthKey = getMonthKey(currentDate);
            const counterDoc = doc(db, 'users', auth.currentUser.uid, 'counters', monthKey);
            await setDoc(counterDoc, { count: currentCount });
        } catch (error) {
            console.error('Error al actualizar el contador:', error);
            alert('Error al actualizar el contador');
        }
    }

    // Event Listeners para el contador
    incrementButton.onclick = () => updateCounter(1);
    decrementButton.onclick = () => updateCounter(-1);

    // Inicialización
    updateDateDisplay();

    // Cargar contador
    async function loadUserCounter() {
        if (!auth.currentUser) return;

        try {
            const monthKey = getMonthKey(selectedDate);
            const counterDoc = doc(db, 'users', auth.currentUser.uid, 'counters', monthKey);
            const docSnap = await getDoc(counterDoc);
            
            if (docSnap.exists()) {
                currentCount = docSnap.data().count;
            } else {
                currentCount = 0;
                if (monthKey === getMonthKey(currentDate)) {
                    await setDoc(counterDoc, { count: 0 });
                }
            }
            
            counterDisplay.textContent = currentCount;
        } catch (error) {
            console.error('Error al cargar el contador:', error);
        }
    }

    // Función de inicio de sesión
    async function loginUser(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('Inicio de sesión exitoso');
        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            alert('Error en el inicio de sesión: ' + error.message);
        }
    }

    // Función de registro
    async function registerUser(e) {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Registro exitoso');
            
            const monthKey = getMonthKey(new Date());
            await setDoc(doc(db, 'users', userCredential.user.uid, 'counters', monthKey), {
                count: 0
            });
        } catch (error) {
            console.error('Error en el registro:', error);
            alert('Error en el registro: ' + error.message);
        }
    }

    // Función de cierre de sesión
    async function logout() {
        try {
            await signOut(auth);
            console.log('Cierre de sesión exitoso');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Error al cerrar sesión');
        }
    }

    // Event listeners para autenticación
    loginForm.addEventListener('submit', loginUser);
    registerForm.addEventListener('submit', registerUser);
    logoutButton.addEventListener('click', logout);

    // Cambiar entre formularios
    switchToRegister.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    switchToLogin.addEventListener('click', () => {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Observer de autenticación modificado
    auth.onAuthStateChanged(async (user) => {
        console.log('Estado de autenticación cambiado:', user ? 'autenticado' : 'no autenticado');
        const authSection = document.getElementById('authSection');
        const counterSection = document.getElementById('counterSection');
        
        if (user) {
            console.log('Usuario autenticado:', user.email);
            authSection.style.display = 'none';
            counterSection.style.display = 'block';
            selectedDate = new Date();
            updateDateDisplay();
            await loadUserCounter();
        } else {
            console.log('Usuario no autenticado');
            authSection.style.display = 'block';
            counterSection.style.display = 'none';
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            currentCount = 0;
            if (counterDisplay) {
                counterDisplay.textContent = '0';
            }
        }
    });
});