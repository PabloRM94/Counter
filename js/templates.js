import { auth, db } from './firebase-config.js';
import { doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Plantillas para grupos de contadores
const groupTemplates = {
    custom: {
        name: "Personalizado",
        counters: []  // Sin contadores predefinidos para permitir personalización
    },
    months: {
        name: "Meses del Año",
        theme: "nature-theme",  // Tema visual relacionado con la naturaleza
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
        theme: "tech-theme",  // Tema visual relacionado con tecnología
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
        theme: "hobby-theme",  // Tema visual relacionado con hobbies
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
        theme: "sport-theme",  // Tema visual relacionado con deportes
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
        theme: "work-theme",  // Tema visual relacionado con trabajo
        counters: [
            { title: "Tareas completadas", color: "#9c27b0" },
            { title: "Reuniones", color: "#9c27b0" },
            { title: "Horas trabajadas", color: "#9c27b0" },
            { title: "Bugs resueltos", color: "#9c27b0" },
            { title: "Días productivos", color: "#9c27b0" }
        ]
    }
};

/**
 * Función para crear un grupo con contadores basados en una plantilla
 * @param {string} groupId - ID del grupo a crear
 * @param {string} templateName - Nombre de la plantilla a utilizar
 * @param {string} customName - Nombre personalizado para el grupo (opcional)
 * @returns {boolean} - Verdadero si la creación fue exitosa, falso en caso contrario
 */
async function createGroupFromTemplate(groupId, templateName, customName = null) {
    console.log(`Iniciando createGroupFromTemplate para ${templateName}`);
    const template = groupTemplates[templateName];
    if (!template) {
        console.log('Plantilla no encontrada');
        return false;
    }
    
    const groupName = customName || template.name;
    console.log(`Creando ${template.counters.length} contadores para la plantilla ${templateName}`);
    
    // Verificar si ya existen contadores para este grupo
    try {
        const countersRef = collection(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters');
        const querySnapshot = await getDocs(countersRef);
        
        if (!querySnapshot.empty) {
            console.log(`El grupo ${groupId} ya tiene contadores, omitiendo creación de plantilla`);
            return true;
        }
        
        // Crear contadores desde la plantilla
        const creationPromises = [];
        for (const counter of template.counters) {
            creationPromises.push(createTemplateCounter(groupId, counter.title, counter.color));
        }
        
        // Esperar a que todos los contadores sean creados
        await Promise.all(creationPromises);
        
        console.log(`Finalizada la creación de contadores para la plantilla ${templateName}`);
        return true;
    } catch (error) {
        console.error('Error al verificar contadores existentes:', error);
        return false;
    }
}

/**
 * Crea un contador individual basado en una plantilla
 * @param {string} groupId - ID del grupo al que pertenecerá el contador
 * @param {string} title - Título del contador
 * @param {string} color - Color del contador en formato hexadecimal
 */
async function createTemplateCounter(groupId, title, color) {
    try {
        // Generar un ID único para el contador basado en la marca de tiempo actual y un número aleatorio
        const counterId = Date.now().toString() + Math.floor(Math.random() * 1000);
        const counterDoc = doc(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters', counterId);
        
        // Asignar orden específico para meses y días de la semana
        let order = Date.now();
        
        // Orden para meses (1-12)
        const monthOrder = {
            "Enero": 1, "Febrero": 2, "Marzo": 3, "Abril": 4, 
            "Mayo": 5, "Junio": 6, "Julio": 7, "Agosto": 8,
            "Septiembre": 9, "Octubre": 10, "Noviembre": 11, "Diciembre": 12
        };
        
        // Orden para días de la semana (1-7)
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
        
        // Guardar el contador en Firestore
        await setDoc(counterDoc, {
            title,              // Título del contador
            count: 0,           // Valor inicial en cero
            color,              // Color personalizado
            isMinimized: false, // No minimizado por defecto
            createdAt: new Date().toISOString(), // Fecha de creación
            order: order        // Orden para mostrar en la interfaz
        });
    } catch (error) {
        console.error('Error al crear contador de plantilla:', error);
    }
}

// Exportar las funciones y objetos para usarlos en otros archivos
export { groupTemplates, createGroupFromTemplate };