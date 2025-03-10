import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc,
    collection,
    getDocs,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateStatistics } from './statistics.js';
// Add this to your existing JavaScript code
// Toggle between counter and statistics sections
document.getElementById('toggleStatistics').addEventListener('click', function() {
    document.getElementById('counterSection').style.display = 'none';
    document.getElementById('statisticsSection').style.display = 'block';
});

document.getElementById('backToCounters').addEventListener('click', function() {
    document.getElementById('statisticsSection').style.display = 'none';
    document.getElementById('counterSection').style.display = 'block';
});
// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');
    
    // Referencias DOM
    const currentGroupHeader = document.getElementById('currentGroupHeader');
    const currentGroupTitle = document.getElementById('currentGroupTitle');
    const noGroupSelected = document.getElementById('noGroupSelected');
    const newGroupForm = document.getElementById('newGroupForm');
    const newCounterForm = document.getElementById('newCounterForm');
    const authSection = document.getElementById('authSection');
    const counterSection = document.getElementById('counterSection');
    const groupNavigation = document.getElementById('groupNavigation');
    const deleteGroupBtn = document.getElementById('deleteGroupBtn');
 // Referencias de autenticación
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const logoutButton = document.getElementById('logoutButton');
 // Estado de la aplicación
    let currentGroupId = null;
    let currentGroup = null;
    let lastVisitedGroupId = null;
 // Verificar elementos críticos y mostrar advertencias específicas
    const missingElements = [];
    
    if (!authSection) missingElements.push('authSection');
    if (!counterSection) missingElements.push('counterSection');
    if (!loginForm) missingElements.push('loginForm');
    if (!registerForm) missingElements.push('registerForm');
    
    if (missingElements.length > 0) {
        console.error('Elementos críticos no encontrados:', missingElements.join(', '));
        return;
    }
    
    // Verificar elementos no críticos con advertencias
    if (!currentGroupHeader) console.warn('Elemento no encontrado: currentGroupHeader');
    if (!currentGroupTitle) console.warn('Elemento no encontrado: currentGroupTitle');
    if (!noGroupSelected) console.warn('Elemento no encontrado: noGroupSelected');
    if (!newGroupForm) console.warn('Elemento no encontrado: newGroupForm');
    if (!newCounterForm) console.warn('Elemento no encontrado: newCounterForm');
    if (!groupNavigation) console.warn('Elemento no encontrado: groupNavigation');
    if (!deleteGroupBtn) console.warn('Elemento no encontrado: deleteGroupBtn');
    if (!switchToRegister) console.warn('Elemento no encontrado: switchToRegister');
    if (!switchToLogin) console.warn('Elemento no encontrado: switchToLogin');
    if (!logoutButton) console.warn('Elemento no encontrado: logoutButton');
    if (!switchToRegister || !switchToLogin || !logoutButton || !groupNavigation || !deleteGroupBtn) {
        console.error('No se pudieron encontrar todos los elementos necesarios');
        return;
    }

 // Funciones para manejar grupos
    async function createGroup(title, theme) {
        try {
            const groupId = Date.now().toString();
            const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
            await setDoc(groupDoc, {
                title,
                theme,
                createdAt: new Date().toISOString(),
                order: Date.now()
            });
            await loadGroups();
            navigateToGroup(groupId);
            // Update modal handling with safer approach
            const modalElement = document.getElementById('newGroupModal');
            if (modalElement && bootstrap) {
                try {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    } else {
                        const newModal = new bootstrap.Modal(modalElement);
                        newModal.hide();
                    }
                } catch (error) {
                    console.warn('Error handling modal:', error);
                    // Fallback method to hide modal
                    modalElement.classList.remove('show');
                    modalElement.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                }
            }
        } catch (error) {
            console.error('Error al crear el grupo:', error);
            showAlert('Error al crear el grupo', 'error');
        }
    }
    async function deleteGroup(groupId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este grupo y todos sus contadores?')) {
            return;
        }
        try {
            // Primero eliminar todos los contadores del grupo
            const countersRef = collection(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters');
            const querySnapshot = await getDocs(countersRef);
            const deletions = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletions);
            // Luego eliminar el grupo
            const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
            await deleteDoc(groupDoc);
            currentGroupId = null;
            currentGroup = null;
            lastVisitedGroupId = null;
            localStorage.removeItem('lastVisitedGroupId');
            await loadGroups();
            updateGroupDisplay();
        } catch (error) {
            console.error('Error al eliminar el grupo:', error);
            alert('Error al eliminar el grupo');
        }
    }
    // Funciones para manejar contadores
    async function createCounter(groupId, title, color) {
        try {
            const counterId = Date.now().toString();
            const counterDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters', counterId);
            await setDoc(counterDoc, {
                title,
                count: parseInt(document.getElementById('counterInitialValue').value) || 0,
                color: document.getElementById('counterColor').value, // Store the color value
                isMinimized: false,
                createdAt: new Date().toISOString(),
                order: Date.now()
            });
            await loadCounters(groupId);
            const modalElement = document.getElementById('newCounterModal');
            if (modalElement && bootstrap) {
                try {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    } else {
                        const newModal = new Modal(modalElement);
                        newModal.hide();
                    }
                } catch (error) {
                    console.warn('Error handling modal:', error);
                    const groupModalElement = document.getElementById('newGroupModal');
                    if (groupModalElement) {
                    // Manual approach to hide the modal
                    groupModalElement.classList.remove('show');
                    groupModalElement.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                    }
                    // For createCounter function:
                    const modalElement = document.getElementById('newCounterModal');
                    if (modalElement) {
                    // Manual approach to hide the modal
                    modalElement.classList.remove('show');
                    groupModalElement.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) backdrop.remove();
                    }
                }
            }
        } catch (error) {
            console.error('Error al crear el contador:', error);
            alert('Error al crear el contador');
        }
    }
    async function updateCounter(groupId, counterId, data) {
        try {
            const counterDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters', counterId);
            await updateDoc(counterDoc, data);
            await loadCounters(groupId); // Recargar los contadores para reflejar el cambio
            await updateStatistics(groupId);
            showAlert('Contador actualizado correctamente', 'success');
        } catch (error) {
            console.error('Error al actualizar el contador:', error);
            showAlert('Error al actualizar el contador', 'error');
        }
    }
    async function deleteCounter(groupId, counterId) {
        try {
            const counterDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters', counterId);
            await deleteDoc(counterDoc);
            await loadCounters(groupId);
        } catch (error) {
            console.error('Error al eliminar el contador:', error);
            alert('Error al eliminar el contador');
        }
    }
    async function toggleCounterMinimized(groupId, counterId, isMinimized) {
        await updateCounter(groupId, counterId, { isMinimized });
    }
    // Funciones de carga y navegación
    async function loadGroups() {
        if (!auth.currentUser) return;
        try {
            const groupsRef = collection(db, 'users', auth.currentUser.uid, 'groups');
            const querySnapshot = await getDocs(groupsRef);
            
            groupNavigation.innerHTML = '';
            
            const groups = [];
            querySnapshot.forEach((doc) => {
                groups.push({ id: doc.id, ...doc.data() });
            });
            // Ordenar grupos por orden
            groups.sort((a, b) => a.order - b.order);
            groups.forEach(group => {
                const groupButton = document.createElement('button');
                groupButton.className = `btn ${currentGroupId === group.id ? 'btn-primary' : 'btn-outline-primary'} me-2`;
                groupButton.innerHTML = `
                    <span class="group-title">${group.title}</span>
                    <span class="theme-indicator ${group.theme}-theme"></span>
                `;
                groupButton.onclick = () => navigateToGroup(group.id);
                groupNavigation.appendChild(groupButton);
            });
            // Si no hay grupo seleccionado y hay grupos, seleccionar el último visitado o el primero
            if (!currentGroupId && groups.length > 0) {
                const targetGroupId = lastVisitedGroupId || groups[0].id;
                const targetGroup = groups.find(g => g.id === targetGroupId);
                if (targetGroup) {
                    navigateToGroup(targetGroupId);
                }
            }
            // Actualizar la visualización del grupo actual
            updateGroupDisplay();
        } catch (error) {
            console.error('Error al cargar los grupos:', error);
        }
    }
    async function loadCounters(groupId) {
        if (!groupId) return;
        try {
            const countersRef = collection(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters');
            const querySnapshot = await getDocs(countersRef);
            const countersList = document.getElementById('countersList');
            countersList.innerHTML = '';
    
            const counters = [];
            querySnapshot.forEach((doc) => {
                counters.push({ id: doc.id, ...doc.data() });
            });
    
            // Sort counters by order
            counters.sort((a, b) => a.order - b.order);
    
            counters.forEach(counter => {
                const counterElement = document.createElement('div');
                counterElement.className = 'counter-item card mb-3';
                counterElement.dataset.counterId = counter.id;
                
                // Apply custom color if it exists
                if (counter.color) {
                    counterElement.style.setProperty('--counter-color', counter.color);
                    counterElement.style.borderLeftColor = counter.color;
                }
                counterElement.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="card-title mb-0">${counter.title}</h5>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-secondary rename">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary change-color">
                                    <i class="fas fa-palette"></i>
                                <button class="btn btn-sm btn-outline-danger delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="counter-content ${counter.isMinimized ? 'd-none' : ''}">
                            <div class="counter-controls">
                                <button class="btn btn-danger btn-sm decrement">-</button>
                                <span class="count" style="${counter.color ? 'color:'+counter.color+';' : ''}">${counter.count}</span>
                                <button class="btn btn-success btn-sm increment">+</button>
                            </div>
                        </div>
                    </div>`;    
                // Event listeners
                const incrementBtn = counterElement.querySelector('.increment');
                const decrementBtn = counterElement.querySelector('.decrement');
                const deleteBtn = counterElement.querySelector('.delete');
                const renameBtn = counterElement.querySelector('.rename');
                const cardBody = counterElement.querySelector('.card-body');
                const colorBtn = counterElement.querySelector('.change-color');
                 // Incrementar contador
                incrementBtn.addEventListener('click', () =>
                    updateCounter(groupId, counter.id, { count: counter.count + 1 })
                );
                // Decrementar contador
                decrementBtn.addEventListener('click', () =>
                    updateCounter(groupId, counter.id, { count: counter.count - 1 })
                );
                // Eliminar contador
                deleteBtn.addEventListener('click', () => {
                    if (confirm('¿Estás seguro de que quieres eliminar este contador?')) {
                        deleteCounter(groupId, counter.id);
                    }
                });
                // Renombrar contador
                renameBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newTitle = prompt('Nuevo título:', counter.title);
                    if (newTitle !== null && newTitle.trim() !== '') {
                        updateCounter(groupId, counter.id, { title: newTitle });
                    }
                });
                // Color change functionality
                colorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const colorPicker = document.createElement('input');
                colorPicker.type = 'color';
                colorPicker.value = counter.color || '#667eea'; // Default to primary color
                colorPicker.style.position = 'absolute';
                colorPicker.style.left = '-9999px';
                document.body.appendChild(colorPicker);
                
                colorPicker.click();
                
                colorPicker.addEventListener('change', () => {
                const newColor = colorPicker.value;
                // Update counter color in database
                updateCounter(groupId, counter.id, { color: newColor });
                
                // Update UI immediately
                counterElement.style.borderLeftColor = newColor;
                const countElement = counterElement.querySelector('.count');
                if (countElement) {
                countElement.style.color = newColor;
                }
                
                document.body.removeChild(colorPicker);
                });
                });
                // Minimizar/Maximizar contador
                cardBody.addEventListener('click', (e) => {
                    // Evitar que el evento se active si el usuario está interactuando con los botones de control
                    if (!e.target.closest('.btn-group') && !e.target.closest('.increment') && !e.target.closest('.decrement')) {
                        toggleCounterMinimized(groupId, counter.id, !counter.isMinimized);
                    }
                });
                countersList.appendChild(counterElement);
            });
        } catch (error) {
            console.error('Error al cargar los contadores:', error);
            showAlert('Error al cargar los contadores', 'error');
        }
    }

    async function navigateToGroup(groupId) {
        currentGroupId = groupId;
        lastVisitedGroupId = groupId;
        localStorage.setItem('lastVisitedGroupId', groupId);
    
        // Cargar información del grupo
        if (groupId) {
            const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
            const docSnap = await getDoc(groupDoc);
            if (docSnap.exists()) {
                currentGroup = { id: groupId, ...docSnap.data() };
                currentGroupTitle.textContent = currentGroup.title; // Actualizar el título en la interfaz
            }
        }
    
        await loadGroups(); // Recargar la lista de grupos
        await loadCounters(groupId); // Recargar los contadores del grupo seleccionado
        await updateStatistics(groupId); // Actualizar las estadísticas
        updateGroupDisplay(); // Actualizar la interfaz
    }

    function updateGroupDisplay() {
        if (currentGroup) {
            currentGroupHeader.style.display = 'block';
            noGroupSelected.style.display = 'none';
            currentGroupTitle.textContent = currentGroup.title;
            currentGroupHeader.className = `current-group-header mb-4 ${currentGroup.theme}-theme`;
    
            // Asegurarse de que el botón 'Editar' no se duplique
            if (!currentGroupHeader.querySelector('.rename-group')) {
                const renameGroupBtn = document.createElement('button');
                renameGroupBtn.className = 'btn btn-outline-secondary rename-group';
                renameGroupBtn.innerHTML = '<i class="fas fa-edit"></i> Editar';
    
                // Asignar el evento de clic al botón
                renameGroupBtn.addEventListener('click', () => {
                    editGroupTitle(currentGroupId, currentGroupTitle.textContent);
                });
    
                // Añadir el botón al DOM
                currentGroupHeader.querySelector('.btn-group').appendChild(renameGroupBtn);
            }
        } else {
            currentGroupHeader.style.display = 'none';
            noGroupSelected.style.display = 'block';
        }
    }   
// Evento para el botón de editar
    const editGroupBtn = document.getElementById('editGroupBtn');
    // Add null check before attaching event listener
    if (editGroupBtn) {
        editGroupBtn.addEventListener('click', () => {
            if (currentGroupId) {
                editGroupTitle(currentGroupId, currentGroupTitle.textContent);
            } else {
                console.error("No se ha seleccionado un grupo válido.");
            }
        });
    } else {
        console.warn('Elemento no encontrado: editGroupBtn');
    }
// Función para editar el título del grupo
    async function editGroupTitle(groupId, currentTitle) {
        const titleElement = document.getElementById('currentGroupTitle');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'form-control';
        titleElement.replaceWith(input);
        input.focus();
// Guardar cambios al perder el foco
        input.addEventListener('blur', async () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== currentTitle) {
                await updateGroupName(groupId, newTitle);
            }
            // Reemplazar el campo de entrada con el título actualizado
            input.replaceWith(titleElement);
            titleElement.textContent = newTitle || currentTitle;
        });
// Guardar cambios al presionar Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Forzar el guardado al presionar Enter
            }
        });
    }

    async function updateGroupName(groupId, newTitle) {
        try {
            const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
            await updateDoc(groupDoc, { title: newTitle });
            await loadGroups(); // Recargar los grupos para reflejar el cambio
            showAlert('Nombre del grupo actualizado correctamente', 'success');
        } catch (error) {
            console.error('Error al actualizar el grupo:', error);
            showAlert('Error al actualizar el grupo: ' + error.message, 'error');
        }
    }
// Event listeners para formularios
    const saveGroupBtn = document.getElementById('saveGroupBtn');
    if (saveGroupBtn) {
        saveGroupBtn.addEventListener('click', () => {
            const title = document.getElementById('groupName').value.trim();
            if (title) {
                createGroup(title, 'default'); // Using 'default' as theme since there's no theme selector
                document.getElementById('groupName').value = '';
                const modalElement = document.getElementById('newGroupModal');
                if (modalElement && bootstrap) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
            }
        });
    }

    const saveCounterBtn = document.getElementById('saveCounterBtn');
    if (saveCounterBtn) {
        saveCounterBtn.addEventListener('click', () => {
            if (!currentGroupId) {
                alert('Por favor, selecciona o crea un grupo primero');
                return;
            }
            const title = document.getElementById('counterName').value.trim();
            const initialValue = parseInt(document.getElementById('counterInitialValue').value) || 0;
            const color = document.getElementById('counterColor').value;
            
            if (title) {
                createCounter(currentGroupId, title, color);
                document.getElementById('counterName').value = '';
                document.getElementById('counterInitialValue').value = '0';
                document.getElementById('counterColor').value = '#0d6efd';
                
                const modalElement = document.getElementById('newCounterModal');
                if (modalElement && bootstrap) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
            }
        });
    }
// Event listener para eliminar grupo
    deleteGroupBtn.addEventListener('click', () => {
        if (currentGroupId) {
            deleteGroup(currentGroupId);
        }
    });
// Funciones de autenticación
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

    async function registerUser(e) {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('Registro exitoso');
        } catch (error) {
            console.error('Error en el registro:', error);
            alert('Error en el registro: ' + error.message);
        }
    }

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
// Observer de autenticación
    auth.onAuthStateChanged(async (user) => {
        console.log('Estado de autenticación cambiado:', user ? 'autenticado' : 'no autenticado');
        
        if (user) {
            console.log('Usuario autenticado:', user.email);
            authSection.style.display = 'none';
            counterSection.style.display = 'block';
            lastVisitedGroupId = localStorage.getItem('lastVisitedGroupId');
            await loadGroups();
        } else {
            console.log('Usuario no autenticado');
            authSection.style.display = 'block';
            counterSection.style.display = 'none';
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            currentGroupId = null;
            currentGroup = null;
            lastVisitedGroupId = null;
            updateGroupDisplay();
        }
    });
// Evento para alternar entre modo claro y oscuro
    const toggleDarkModeBtn = document.getElementById('toggleDarkMode');
    const toggleDarkModeBtn2 = document.getElementById('toggleDarkMode2');
    
    // Function to toggle dark mode
    const toggleDarkMode = () => {
        document.body.classList.toggle('dark-mode');
        const container = document.querySelector('.container');
        if (container) container.classList.toggle('dark-mode');
        
        // Update both buttons' icons
        const isDarkMode = document.body.classList.contains('dark-mode');
        const newIcon = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        if (toggleDarkModeBtn) toggleDarkModeBtn.innerHTML = newIcon;
        if (toggleDarkModeBtn2) toggleDarkModeBtn2.innerHTML = newIcon;
        
        // Save preference to localStorage
        localStorage.setItem('darkMode', isDarkMode);
    };
    
    // Add event listeners to both buttons
    if (toggleDarkModeBtn) {
        toggleDarkModeBtn.addEventListener('click', toggleDarkMode);
    }
    
    if (toggleDarkModeBtn2) {
        toggleDarkModeBtn2.addEventListener('click', toggleDarkMode);
    }
    
    // Apply saved preference on load
    if (localStorage.getItem('darkMode') === 'true') {
        toggleDarkMode();
    }
});
// Función para mostrar alertas al usuario
function showAlert(message, type = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(alertDiv);

    // Eliminar la alerta después de 3 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}
