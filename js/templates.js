import { auth, db } from './firebase-config.js';
import { doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Templates for counter groups
const groupTemplates = {
    custom: {
        name: "Personalizado",
        counters: []
    },
    months: {
        name: "Meses del Año",
        theme: "nature-theme",
        counters: [
            { title: "Enero", color: "#4caf50" },
            { title: "Febrero", color: "#4caf50" },
            { title: "Marzo", color: "#4caf50" },
            { title: "Abril", color: "#4caf50" },
            { title: "Mayo", color: "#4caf50" },
            { title: "Junio", color: "#4caf50" },
            { title: "Julio", color: "#4caf50" },
            { title: "Agosto", color: "#4caf50" },
            { title: "Septiembre", color: "#4caf50" },
            { title: "Octubre", color: "#4caf50" },
            { title: "Noviembre", color: "#4caf50" },
            { title: "Diciembre", color: "#4caf50" }
        ]
    },
    weekdays: {
        name: "Días de la Semana",
        theme: "tech-theme",
        counters: [
            { title: "Lunes", color: "#2196f3" },
            { title: "Martes", color: "#2196f3" },
            { title: "Miércoles", color: "#2196f3" },
            { title: "Jueves", color: "#2196f3" },
            { title: "Viernes", color: "#2196f3" },
            { title: "Sábado", color: "#2196f3" },
            { title: "Domingo", color: "#2196f3" }
        ]
    },
    habits: {
        name: "Hábitos Diarios",
        theme: "hobby-theme",
        counters: [
            { title: "Agua (vasos)", color: "#f44336" },
            { title: "Ejercicio (min)", color: "#f44336" },
            { title: "Lectura (páginas)", color: "#f44336" },
            { title: "Meditación (min)", color: "#f44336" },
            { title: "Pasos", color: "#f44336" }
        ]
    },
    fitness: {
        name: "Fitness",
        theme: "sport-theme",
        counters: [
            { title: "Flexiones", color: "#ff9800" },
            { title: "Abdominales", color: "#ff9800" },
            { title: "Sentadillas", color: "#ff9800" },
            { title: "Zancadas", color: "#ff9800" },
            { title: "Burpees", color: "#ff9800" },
            { title: "Km corridos", color: "#ff9800" }
        ]
    },
    projects: {
        name: "Proyectos",
        theme: "work-theme",
        counters: [
            { title: "Tareas completadas", color: "#9c27b0" },
            { title: "Reuniones", color: "#9c27b0" },
            { title: "Horas trabajadas", color: "#9c27b0" },
            { title: "Bugs resueltos", color: "#9c27b0" },
            { title: "Días productivos", color: "#9c27b0" }
        ]
    }
};

// Function to create a group with template counters
async function createGroupFromTemplate(groupId, templateName, customName = null) {
    console.log(`Starting createGroupFromTemplate for ${templateName}`);
    const template = groupTemplates[templateName];
    if (!template) {
        console.log('Template not found');
        return false;
    }
    
    const groupName = customName || template.name;
    console.log(`Creating ${template.counters.length} counters for template ${templateName}`);
    
    // Check if counters already exist for this group
    try {
        const countersRef = collection(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters');
        const querySnapshot = await getDocs(countersRef);
        
        if (!querySnapshot.empty) {
            console.log(`Group ${groupId} already has counters, skipping template creation`);
            return true;
        }
        
        // Create counters from template
        const creationPromises = [];
        for (const counter of template.counters) {
            creationPromises.push(createTemplateCounter(groupId, counter.title, counter.color));
        }
        
        // Wait for all counters to be created
        await Promise.all(creationPromises);
        
        console.log(`Finished creating counters for template ${templateName}`);
        return true;
    } catch (error) {
        console.error('Error checking existing counters:', error);
        return false;
    }
}

// Create a counter from template
async function createTemplateCounter(groupId, title, color) {
    try {
        const counterId = Date.now().toString() + Math.floor(Math.random() * 1000);
        const counterDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters', counterId);
        
        // Asignar orden específico para meses y días de la semana
        let order = Date.now();
        
        // Orden para meses
        const monthOrder = {
            "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, 
            "Mayo": 5, "Junio": 6, "Julio": 7, "Agosto": 8,
            "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12
        };
        
        // Orden para días de la semana
        const weekdayOrder = {
            "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4,
            "Viernes": 5, "Sábado": 6, "Domingo": 7
        };
        
        // Usar orden específico si el título corresponde a un mes o día
        if (monthOrder[title]) {
            order = monthOrder[title];
        } else if (weekdayOrder[title]) {
            order = weekdayOrder[title];
        }
        
        await setDoc(counterDoc, {
            title,
            count: 0,
            color,
            isMinimized: false,
            createdAt: new Date().toISOString(),
            order: order
        });
    } catch (error) {
        console.error('Error al crear contador de plantilla:', error);
    }
}

export { groupTemplates, createGroupFromTemplate };