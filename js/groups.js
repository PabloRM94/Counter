import { auth, db } from './firebase-config.js';
import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { createGroupFromTemplate, groupTemplates } from './templates.js';

// Variable para evitar la creación simultánea de múltiples grupos
let isCreatingGroup = false;

/**
 * Crea un nuevo grupo con título, color y plantilla especificados
 * @param {string} title - Título del grupo
 * @param {string} color - Color del grupo en formato hexadecimal
 * @param {string} templateName - Nombre de la plantilla a utilizar
 * @returns {string|null} - ID del grupo creado o null si hay error
 */
async function createGroup(title, color = '#0d6efd', templateName = 'custom') {
    // Evita múltiples creaciones simultáneas
    if (isCreatingGroup) {
        console.log('Group creation already in progress, ignoring duplicate request');
        return null;
    }
    
    isCreatingGroup = true;
    console.log(`Creating group with title: ${title}, color: ${color}, template: ${templateName}`);
    
    try {
        // Asegura que siempre se seleccione una plantilla válida
        if (!templateName || !groupTemplates[templateName]) {
            console.log('No valid template provided, defaulting to custom');
            templateName = 'custom';
        }
        
        // Genera un ID único basado en la marca de tiempo actual
        const groupId = Date.now().toString();
        const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
        
        // Guarda los datos del grupo en Firestore
        await setDoc(groupDoc, { 
            title, 
            color,
            createdAt: new Date().toISOString(), 
            order: Date.now(),
            templateType: templateName // Almacena qué plantilla se utilizó
        });
        
        // Crea los contadores según la plantilla seleccionada
        console.log(`Using template: ${templateName} for group ${groupId}`);
        await createGroupFromTemplate(groupId, templateName, title);
        
        // Actualiza la lista de grupos en la interfaz
        await loadGroups();
        return groupId;
    } catch (error) {
        console.error('Error al crear el grupo:', error);
        return null;
    } finally {
        // Restablece la bandera al terminar, independientemente del resultado
        isCreatingGroup = false;
    }
}

/**
 * Elimina un grupo y todos sus contadores
 * @param {string} groupId - ID del grupo a eliminar
 */
async function deleteGroup(groupId) {
    try {
        // Confirmación de seguridad antes de eliminar
        if (!confirm('¿Seguro que quieres eliminar este grupo y sus contadores?')) return;

        // Obtiene y elimina todos los contadores del grupo
        const countersRef = collection(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters');
        const querySnapshot = await getDocs(countersRef);
        const deletions = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletions);

        // Elimina el documento del grupo
        const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
        await deleteDoc(groupDoc);
        
        // Actualiza la lista de grupos en la interfaz
        await loadGroups();
    } catch (error) {
        console.error('Error al eliminar el grupo:', error);
    }
}

/**
 * Actualiza el nombre de un grupo
 * @param {string} groupId - ID del grupo a actualizar
 * @param {string} newTitle - Nuevo título para el grupo
 */
async function updateGroupName(groupId, newTitle) {
    try {
        // Actualiza el título en Firestore
        const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
        await updateDoc(groupDoc, { title: newTitle });
        
        // Actualiza la lista de grupos en la interfaz
        await loadGroups();
    } catch (error) {
        console.error('Error al actualizar el grupo:', error);
    }
}

/**
 * Actualiza el color de un grupo
 * @param {string} groupId - ID del grupo a actualizar
 * @param {string} newColor - Nuevo color en formato hexadecimal
 */
async function updateGroupColor(groupId, newColor) {
    try {
        // Actualiza el color en Firestore
        const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
        await updateDoc(groupDoc, { color: newColor });
    } catch (error) {
        console.error('Error al actualizar el color del grupo:', error);
    }
}

/**
 * Carga todos los grupos del usuario y los muestra en la interfaz
 * @returns {Array} - Array con los datos de todos los grupos
 */
async function loadGroups() {
    try {
        // Obtiene todos los grupos del usuario actual
        const groupsRef = collection(db, 'users', auth.currentUser.uid, 'groups');
        const querySnapshot = await getDocs(groupsRef);
        
        // Obtiene el elemento DOM donde se mostrarán los grupos
        const groupsList = document.getElementById('groupNavigation');
        groupsList.innerHTML = '';
        
        const groups = [];
        
        // Procesa cada grupo y lo añade a la interfaz
        querySnapshot.forEach((doc) => {
            const groupData = doc.data();
            groups.push({
                id: doc.id,
                ...groupData
            });
            
            // Crea el elemento DOM para el grupo
            const groupItem = document.createElement('div');
            groupItem.className = 'group-item';
            groupItem.dataset.groupId = doc.id;
            groupItem.textContent = groupData.title;
            
            // Aplica el color del grupo si está disponible
            if (groupData.color) {
                groupItem.style.borderLeftColor = groupData.color;
            }
            
            // Añade evento para seleccionar el grupo al hacer clic
            groupItem.addEventListener('click', () => {
                selectGroup(doc.id);
            });
            
            // Añade el elemento al contenedor de grupos
            groupsList.appendChild(groupItem);
        });
        
        return groups;
    } catch (error) {
        console.error('Error al cargar los grupos:', error);
        return [];
    }
}

/**
 * Selecciona un grupo y muestra sus contadores
 * @param {string} groupId - ID del grupo a seleccionar
 */
function selectGroup(groupId) {
    // Quita la clase 'active' de todos los grupos
    document.querySelectorAll('.group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Añade la clase 'active' al grupo seleccionado
    const selectedGroup = document.querySelector(`.group-item[data-group-id="${groupId}"]`);
    if (selectedGroup) {
        selectedGroup.classList.add('active');
    }
    
    // Guarda el ID del último grupo visitado en localStorage
    localStorage.setItem('lastVisitedGroupId', groupId);
    
    // Muestra el encabezado del grupo actual
    document.getElementById('currentGroupHeader').style.display = 'block';
    document.getElementById('noGroupSelected').style.display = 'none';
    
    // Establece el ID del grupo actual en la variable global
    if (window.setCurrentGroupId) {
        window.setCurrentGroupId(groupId);
    }
    
    // Carga los contadores del grupo seleccionado
    import('./counter.js').then(module => {
        module.loadCounters(groupId);
    });
    
    // Actualiza el título del grupo en la interfaz
    const groupsRef = collection(db, 'users', auth.currentUser.uid, 'groups');
    getDocs(groupsRef).then(querySnapshot => {
        querySnapshot.forEach(doc => {
            if (doc.id === groupId) {
                document.getElementById('currentGroupTitle').textContent = doc.data().title;
                
                // Almacena el tema del grupo actual en un atributo de datos
                const currentGroupHeader = document.getElementById('currentGroupHeader');
                if (currentGroupHeader) {
                    currentGroupHeader.dataset.theme = doc.data().theme || 'default';
                }
            }
        });
    });
}

// Exporta las funciones para usarlas en otros módulos
export { createGroup, deleteGroup, updateGroupName, updateGroupColor, loadGroups, selectGroup };