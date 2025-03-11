import { auth, db } from './firebase-config.js';
import { doc, setDoc, deleteDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { createGroupFromTemplate, groupTemplates } from './templates.js';

// Flag to prevent multiple simultaneous group creations
let isCreatingGroup = false;

async function createGroup(title, color = '#0d6efd', templateName = 'custom') {
    // Prevent multiple simultaneous creations
    if (isCreatingGroup) {
        console.log('Group creation already in progress, ignoring duplicate request');
        return null;
    }
    
    isCreatingGroup = true;
    console.log(`Creating group with title: ${title}, color: ${color}, template: ${templateName}`);
    
    try {
        // Ensure a template is always selected
        if (!templateName || !groupTemplates[templateName]) {
            console.log('No valid template provided, defaulting to custom');
            templateName = 'custom';
        }
        
        const groupId = Date.now().toString();
        const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
        
        await setDoc(groupDoc, { 
            title, 
            color,
            createdAt: new Date().toISOString(), 
            order: Date.now(),
            templateType: templateName // Store which template was used
        });
        
        // Always create template counters (even for custom, which will be empty)
        console.log(`Using template: ${templateName} for group ${groupId}`);
        await createGroupFromTemplate(groupId, templateName, title);
        
        await loadGroups();
        return groupId;
    } catch (error) {
        console.error('Error al crear el grupo:', error);
        return null;
    } finally {
        // Reset the flag when done, regardless of success or failure
        isCreatingGroup = false;
    }
}

async function deleteGroup(groupId) {
    try {
        if (!confirm('¿Seguro que quieres eliminar este grupo y sus contadores?')) return;

        const countersRef = collection(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters');
        const querySnapshot = await getDocs(countersRef);
        const deletions = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletions);

        const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
        await deleteDoc(groupDoc);
        await loadGroups();
    } catch (error) {
        console.error('Error al eliminar el grupo:', error);
    }
}

async function updateGroupName(groupId, newTitle) {
    try {
        const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
        await updateDoc(groupDoc, { title: newTitle });
        await loadGroups();
    } catch (error) {
        console.error('Error al actualizar el grupo:', error);
    }
}

// Add this function to update group color
async function updateGroupColor(groupId, newColor) {
    try {
        const groupDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId);
        await updateDoc(groupDoc, { color: newColor });
    } catch (error) {
        console.error('Error al actualizar el color del grupo:', error);
    }
}

// Update the loadGroups function to apply the color to group items
async function loadGroups() {
    try {
        const groupsRef = collection(db, 'users', auth.currentUser.uid, 'groups');
        const querySnapshot = await getDocs(groupsRef);
        
        const groupsList = document.getElementById('groupNavigation');
        groupsList.innerHTML = '';
        
        const groups = [];
        
        querySnapshot.forEach((doc) => {
            const groupData = doc.data();
            groups.push({
                id: doc.id,
                ...groupData
            });
            
            const groupItem = document.createElement('div');
            groupItem.className = 'group-item';
            groupItem.dataset.groupId = doc.id;
            groupItem.textContent = groupData.title;
            
            // Apply the group color if available
            if (groupData.color) {
                groupItem.style.borderLeftColor = groupData.color;
            }
            
            groupItem.addEventListener('click', () => {
                selectGroup(doc.id);
            });
            
            groupsList.appendChild(groupItem);
        });
        
        return groups;
    } catch (error) {
        console.error('Error al cargar los grupos:', error);
        return [];
    }
}

// Función para seleccionar un grupo
// Modificar la función selectGroup para establecer el ID del grupo actual
function selectGroup(groupId) {
    // Remover clase active de todos los grupos
    document.querySelectorAll('.group-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Añadir clase active al grupo seleccionado
    const selectedGroup = document.querySelector(`.group-item[data-group-id="${groupId}"]`);
    if (selectedGroup) {
        selectedGroup.classList.add('active');
    }
    
    // Guardar el último grupo visitado
    localStorage.setItem('lastVisitedGroupId', groupId);
    
    // Mostrar el encabezado del grupo actual
    document.getElementById('currentGroupHeader').style.display = 'block';
    document.getElementById('noGroupSelected').style.display = 'none';
    
    // Establecer el ID del grupo actual
    if (window.setCurrentGroupId) {
        window.setCurrentGroupId(groupId);
    }
    
    // Cargar los contadores del grupo
    import('./counter.js').then(module => {
        module.loadCounters(groupId);
    });
    
    // Actualizar el título del grupo
    const groupsRef = collection(db, 'users', auth.currentUser.uid, 'groups');
    getDocs(groupsRef).then(querySnapshot => {
        querySnapshot.forEach(doc => {
            if (doc.id === groupId) {
                document.getElementById('currentGroupTitle').textContent = doc.data().title;
                
                // Store the current group theme in a data attribute
                const currentGroupHeader = document.getElementById('currentGroupHeader');
                if (currentGroupHeader) {
                    currentGroupHeader.dataset.theme = doc.data().theme || 'default';
                }
            }
        });
    });
}

export { createGroup, deleteGroup, updateGroupName, updateGroupColor, loadGroups, selectGroup };