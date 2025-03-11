import { auth, db } from './firebase-config.js';
import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updateStatistics } from './statistics.js';

async function createCounter(groupId, title, color) {
    try {
        const counterId = Date.now().toString();
        const counterDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters', counterId);
        await setDoc(counterDoc, {
            title,
            count: 0,
            color,
            isMinimized: false,
            createdAt: new Date().toISOString(),
            order: Date.now()
        });
        await loadCounters(groupId);
    } catch (error) {
        console.error('Error al crear el contador:', error);
    }
}

async function updateCounter(groupId, counterId, data) {
    try {
        const counterDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters', counterId);
        await updateDoc(counterDoc, data);
        await loadCounters(groupId);
        await updateStatistics(groupId);
    } catch (error) {
        console.error('Error al actualizar el contador:', error);
    }
}

async function deleteCounter(groupId, counterId) {
    try {
        const counterDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters', counterId);
        await deleteDoc(counterDoc);
        await loadCounters(groupId);
    } catch (error) {
        console.error('Error al eliminar el contador:', error);
    }
}

async function toggleMinimizeCounter(groupId, counterId, isCurrentlyMinimized) {
    try {
        const counterDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters', counterId);
        await updateDoc(counterDoc, { isMinimized: !isCurrentlyMinimized });
        await loadCounters(groupId);
    } catch (error) {
        console.error('Error al minimizar el contador:', error);
    }
}

// Asegurarse de que loadCounters esté bien implementada
async function loadCounters(groupId) {
    try {
        if (!auth.currentUser || !groupId) return;
        
        const countersRef = collection(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters');
        const querySnapshot = await getDocs(countersRef);
        
        const counters = [];
        querySnapshot.forEach((doc) => {
            counters.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordenar contadores por orden
        counters.sort((a, b) => a.order - b.order);
        
        // Actualizar la UI con los contadores
        const countersList = document.getElementById('countersList');
        if (countersList) {
            countersList.innerHTML = '';
            
            if (counters.length === 0) {
                countersList.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-info-circle fa-2x mb-3 text-muted"></i>
                        <h5 class="text-muted">No hay contadores en este grupo</h5>
                        <p>Haz clic en "Añadir Contador" para crear uno nuevo</p>
                    </div>
                `;
                return;
            }
            
            counters.forEach(counter => {
                const counterItem = document.createElement('div');
                counterItem.className = `counter-item ${counter.color ? '' : 'default-theme'}`;
                counterItem.style.borderLeftColor = counter.color || '';
                
                counterItem.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <h4 title="${counter.title}">${counter.title}</h4>
                        <div class="counter-content">
                            <span class="count ${counter.isMinimized ? 'minimized' : ''}" 
                                style="color: ${counter.color || ''}" 
                                data-counter-id="${counter.id}" 
                                data-is-minimized="${counter.isMinimized}">
                                ${counter.isMinimized ? '***' : counter.count}
                            </span>
                            <div class="btn-group ms-2">
                                <button class="btn btn-sm btn-outline-secondary edit-counter-btn" data-counter-id="${counter.id}" data-bs-toggle="modal" data-bs-target="#editCounterModal">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-secondary decrement-btn" data-counter-id="${counter.id}">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-primary increment-btn" data-counter-id="${counter.id}">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-counter-btn" data-counter-id="${counter.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                countersList.appendChild(counterItem);
                
                // Añadir event listeners
                const decrementBtn = counterItem.querySelector(`.decrement-btn[data-counter-id="${counter.id}"]`);
                const incrementBtn = counterItem.querySelector(`.increment-btn[data-counter-id="${counter.id}"]`);
                const deleteBtn = counterItem.querySelector(`.delete-counter-btn[data-counter-id="${counter.id}"]`);
                const editBtn = counterItem.querySelector(`.edit-counter-btn[data-counter-id="${counter.id}"]`);
                const countElement = counterItem.querySelector(`.count[data-counter-id="${counter.id}"]`);
                
                decrementBtn.addEventListener('click', () => {
                    updateCounter(groupId, counter.id, { count: counter.count - 1 });
                });
                
                incrementBtn.addEventListener('click', () => {
                    updateCounter(groupId, counter.id, { count: counter.count + 1 });
                });
                
                deleteBtn.addEventListener('click', () => {
                    if (confirm('¿Seguro que quieres eliminar este contador?')) {
                        deleteCounter(groupId, counter.id);
                    }
                });
                
                editBtn.addEventListener('click', () => {
                    // Set the counter data in the edit modal
                    document.getElementById('editCounterId').value = counter.id;
                    document.getElementById('editCounterTitle').value = counter.title;
                    document.getElementById('editCounterColor').value = counter.color || '#0d6efd';
                });
                
                // Add click event to the counter number itself
                countElement.addEventListener('click', () => {
                    toggleMinimizeCounter(groupId, counter.id, counter.isMinimized);
                });
            });
        }
        
        return counters;
    } catch (error) {
        console.error('Error al cargar contadores:', error);
        return [];
    }
}
export { createCounter, updateCounter, deleteCounter, loadCounters, toggleMinimizeCounter };