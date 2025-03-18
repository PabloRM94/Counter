import { auth, db } from './firebase-config.js';
import { loadGroups, selectGroup, createGroup } from './groups.js';
import { createCounter, updateCounter, deleteCounter } from './counter.js';
import { showAlert } from './ui.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loginUser, registerUser, logout } from './auth.js'; // Importar las funciones de autenticación


document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const authSection = document.getElementById('authSection');
    const counterSection = document.getElementById('counterSection');
    const statisticsSection = document.getElementById('statisticsSection');
    const logoutButton = document.getElementById('logoutButton');
    const newGroupForm = document.getElementById('newGroupForm');
    const saveGroupBtn = document.getElementById('saveGroupBtn');
    const newCounterForm = document.getElementById('newCounterForm');
    const saveCounterBtn = document.getElementById('saveCounterBtn');
    const deleteGroupBtn = document.getElementById('deleteGroupBtn');
    const editGroupBtn = document.getElementById('editGroupBtn');
    
    // Formularios de autenticación
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Agregar event listeners para los formularios de autenticación
    if (loginForm) loginForm.addEventListener('submit', loginUser);
    if (registerForm) registerForm.addEventListener('submit', registerUser);
    
    // Botones para cambiar entre formularios de login y registro
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    
    if (switchToRegister) {
        switchToRegister.addEventListener('click', function() {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });
    }
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function() {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }
    
    // Botón de cerrar sesión
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    // Variables globales
    let currentGroupId = null;
    
    window.setCurrentGroupId = (groupId) => {
        currentGroupId = groupId;
    };
    
    // Manejar cambios de estado de autenticación
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Usuario autenticado
            authSection.style.display = 'none';
            counterSection.style.display = 'block';
            
            // Cargar grupos del usuario
            loadGroups().then(groups => {
                if (groups && groups.length > 0) {
                    // Cargar el último grupo visitado o el primero
                    const lastVisitedGroupId = localStorage.getItem('lastVisitedGroupId');
                    const groupToSelect = lastVisitedGroupId && groups.find(g => g.id === lastVisitedGroupId) 
                        ? lastVisitedGroupId 
                        : groups[0].id;
                    
                    selectGroup(groupToSelect);
                } else {
                    // No hay grupos, mostrar mensaje
                    document.getElementById('currentGroupHeader').style.display = 'none';
                    document.getElementById('noGroupSelected').style.display = 'block';
                }
            });
        } else {
            // Usuario no autenticado
            authSection.style.display = 'flex';
            counterSection.style.display = 'none';
            statisticsSection.style.display = 'none';
        }
    });

    // Selección de plantilla en el modal de nuevo grupo
    const templateCards = document.querySelectorAll('.template-card');
    const selectedTemplateInput = document.getElementById('selectedTemplate');
    
    if (templateCards.length > 0 && selectedTemplateInput) {
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                // Eliminar clase seleccionada de todas las tarjetas
                templateCards.forEach(c => c.classList.remove('selected'));
                
                // Añadir clase seleccionada a la tarjeta clickeada
                card.classList.add('selected');
                
                // Actualizar valor del input oculto
                selectedTemplateInput.value = card.dataset.template;
                
                // Si la plantilla no es personalizada, sugerir un nombre
                const groupNameInput = document.getElementById('groupName');
                const templateName = card.dataset.template;
                
                if (templateName !== 'custom' && (!groupNameInput.value || groupNameInput.value === '')) {
                    const templateTitle = card.querySelector('.template-title').textContent;
                    groupNameInput.value = templateTitle;
                }
            });
        });
        
        // Seleccionar plantilla personalizada por defecto
        const customTemplateCard = document.querySelector('.template-card[data-template="custom"]');
        if (customTemplateCard) {
            customTemplateCard.classList.add('selected');
        }
    }
    
    // Guardar el grupo con plantilla
    if (saveGroupBtn) {
        saveGroupBtn.addEventListener('click', async () => {
            const groupName = document.getElementById('groupName').value.trim();
            const templateName = document.getElementById('selectedTemplate').value;
            
            if (groupName) {
                const groupModal = bootstrap.Modal.getInstance(document.getElementById('newGroupModal'));
                groupModal.hide();
                
                const newGroupId = await createGroup(groupName, 'default', templateName);
                if (newGroupId) {
                    selectGroup(newGroupId);
                }
            }
        });
    }
    
    // Event listeners para formularios
    if (saveGroupBtn) {
        saveGroupBtn.addEventListener('click', () => {
            const groupName = document.getElementById('groupName').value.trim();
            if (groupName) {
                import('./groups.js').then(module => {
                    module.createGroup(groupName);
                    // Cerrar modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('newGroupModal'));
                    modal.hide();
                    // Limpiar formulario
                    document.getElementById('groupName').value = '';
                });
            } else {
                showAlert('Por favor, ingresa un nombre para el grupo', 'warning');
            }
        });
    }

    if (saveCounterBtn) {
        saveCounterBtn.addEventListener('click', () => {
            const counterTitleElement = document.getElementById('counterTitle');
            const counterColorElement = document.getElementById('counterColor');
            
            if (!counterTitleElement || !counterColorElement) {
                showAlert('Error: Form elements not found', 'danger');
                return;
            }
            
            const counterTitle = counterTitleElement.value.trim();
            const counterColor = counterColorElement.value;
            
            if (counterTitle && currentGroupId) {
                createCounter(currentGroupId, counterTitle, counterColor);
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('newCounterModal'));
                if (modal) {
                    modal.hide();
                }
                // Limpiar formulario
                counterTitleElement.value = '';
            } else {
                showAlert('Por favor, ingresa un título para el contador', 'warning');
            }
        });
    }

    if (deleteGroupBtn) {
        deleteGroupBtn.addEventListener('click', () => {
            if (currentGroupId) {
                import('./groups.js').then(module => {
                    module.deleteGroup(currentGroupId);
                });
            }
        });
    }

    if (editGroupBtn) { 
    editGroupBtn.addEventListener('click', () => {
    });
    }
    
    document.getElementById('editGroupBtn').addEventListener('click', function() {
        const currentGroupHeader = document.getElementById('currentGroupHeader');
        const currentGroupId = window.getCurrentGroupId ? window.getCurrentGroupId() : localStorage.getItem('lastVisitedGroupId');
        
        if (!currentGroupId) {
            alert('Por favor, selecciona un grupo primero');
            return;
        }
        
        // Coger los datos
        const groupsRef = collection(db, 'users', auth.currentUser.uid, 'groups');
        getDocs(groupsRef).then(querySnapshot => {
            querySnapshot.forEach(doc => {
                if (doc.id === currentGroupId) {
                    const groupData = doc.data();
                    
                    // Populate the edit form
                    document.getElementById('editGroupName').value = groupData.title || '';
                    document.getElementById('editGroupColor').value = groupData.color || '#0d6efd';
                    
                    // Show the modal
                    const editGroupModal = new bootstrap.Modal(document.getElementById('editGroupModal'));
                    editGroupModal.show();
                }
            });
        });
    });
    
    // Guardar el grupo editado
    document.getElementById('saveEditGroupBtn').addEventListener('click', async function() {
        const currentGroupId = window.getCurrentGroupId ? window.getCurrentGroupId() : localStorage.getItem('lastVisitedGroupId');
        
        if (!currentGroupId) {
            alert('Error: No se pudo identificar el grupo');
            return;
        }
        
        const newTitle = document.getElementById('editGroupName').value.trim();
        const newColor = document.getElementById('editGroupColor').value;
        
        if (!newTitle) {
            alert('Por favor, ingresa un nombre para el grupo');
            return;
        }
        
        try {
            // Adaptar el titulo y color
            await import('./groups.js').then(module => {
                module.updateGroupName(currentGroupId, newTitle);
                module.updateGroupColor(currentGroupId, newColor);
            });
            
            document.getElementById('currentGroupTitle').textContent = newTitle;
            
            const groupItem = document.querySelector(`.group-item[data-group-id="${currentGroupId}"]`);
            if (groupItem) {
                groupItem.style.borderLeftColor = newColor;
            }
            
            // cerrar el modal
            const editGroupModal = bootstrap.Modal.getInstance(document.getElementById('editGroupModal'));
            editGroupModal.hide();
            
            import('./groups.js').then(module => {
                module.loadGroups();
            });
            
        } catch (error) {
            console.error('Error al guardar los cambios del grupo:', error);
            alert('Error al guardar los cambios');
        }
    }); 
})


document.getElementById('saveEditCounterBtn').addEventListener('click', async function() {
    const counterId = document.getElementById('editCounterId').value;
    const newTitle = document.getElementById('editCounterTitle').value.trim();
    const newColor = document.getElementById('editCounterColor').value;
    const newCount = parseInt(document.getElementById('editCounterValue').value, 10);
    const currentGroupId = window.getCurrentGroupId ? window.getCurrentGroupId() : localStorage.getItem('lastVisitedGroupId');
    
    if (!counterId || !currentGroupId) {
        alert('Error: No se pudo identificar el contador');
        return;
    }
    
    if (!newTitle) {
        alert('Por favor, ingresa un nombre para el contador');
        return;
    }
    
    if (isNaN(newCount)) {
        alert('Por favor, ingresa un valor numérico válido para el contador');
        return;
    }
    
    try {
        await import('./counter.js').then(module => {
            module.updateCounter(currentGroupId, counterId, { 
                title: newTitle,
                color: newColor,
                count: newCount
            });
        });
        
        const editCounterModal = bootstrap.Modal.getInstance(document.getElementById('editCounterModal'));
        editCounterModal.hide();
        
    } catch (error) {
        console.error('Error al guardar los cambios del contador:', error);
        alert('Error al guardar los cambios');
    }
});