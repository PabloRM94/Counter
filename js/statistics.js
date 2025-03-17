import { auth, db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Variables globales para gestionar los gráficos
let currentChart = null;  // Referencia al gráfico actual
let currentChartType = 'distribution';  // Tipo de gráfico seleccionado por defecto
let charts = {  // Objeto para almacenar referencias a todos los gráficos
    distribution: null,  // Gráfico de distribución (barras)
    trend: null,         // Gráfico de tendencia (líneas)
    pie: null,           // Gráfico circular
    radar: null          // Gráfico de radar
};

// Inicializar la funcionalidad cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el primer gráfico cuando se carga la página
    const currentGroupId = document.querySelector('.group-item.active')?.dataset.groupId;
    if (currentGroupId) {
        updateStatistics(currentGroupId);
    }

    // Manejar cambios de pestaña entre diferentes tipos de gráficos
    const chartTabs = document.getElementById('chartTabs');
    if (chartTabs) {
        chartTabs.addEventListener('shown.bs.tab', async (e) => {
            const targetTab = e.target.getAttribute('aria-controls');
            
            // Actualizar el tipo de gráfico seleccionado
            currentChartType = targetTab;

            // Obtener datos actuales y actualizar el gráfico
            const currentGroupId = document.querySelector('.group-item.active')?.dataset.groupId;
            if (currentGroupId) {
                await updateStatistics(currentGroupId);
            }
        });
    }
    
    // Añadir event listener para el selector de grupos
    const statsGroupSelector = document.getElementById('statsGroupSelector');
    if (statsGroupSelector) {
        statsGroupSelector.addEventListener('change', async (e) => {
            const selectedGroupId = e.target.value;
            if (selectedGroupId) {
                await updateStatistics(selectedGroupId);
            }
        });
    }
    
    // Añadir event listener para cuando se muestra la sección de estadísticas
    document.getElementById('toggleStatistics').addEventListener('click', async () => {
        await loadGroupsForStatistics();
    });
});

/**
 * Función para cargar los grupos en el selector de estadísticas
 * Obtiene todos los grupos del usuario y los muestra en el selector
 */
async function loadGroupsForStatistics() {
    if (!auth.currentUser) return;  // Verificar que el usuario esté autenticado
    
    const loadingGroups = document.getElementById('loadingGroups');
    const statsGroupSelector = document.getElementById('statsGroupSelector');
    
    if (!statsGroupSelector) return;  // Verificar que exista el selector
    
    try {
        // Mostrar indicador de carga
        if (loadingGroups) loadingGroups.style.display = 'block';
        
        // Limpiar opciones existentes excepto la primera (placeholder)
        while (statsGroupSelector.options.length > 1) {
            statsGroupSelector.remove(1);
        }
        
        // Obtener grupos del usuario desde Firestore
        const groupsRef = collection(db, 'users', auth.currentUser.uid, 'groups');
        const querySnapshot = await getDocs(groupsRef);
        
        const groups = [];
        querySnapshot.forEach((doc) => {
            groups.push({ id: doc.id, ...doc.data() });
        });
        
        // Ordenar grupos por orden
        groups.sort((a, b) => a.order - b.order);
        
        // Añadir grupos al selector
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.title;
            statsGroupSelector.appendChild(option);
        });
        
        // Si hay un grupo activo en la sección de contadores, seleccionarlo
        const currentGroupId = localStorage.getItem('lastVisitedGroupId');
        if (currentGroupId) {
            statsGroupSelector.value = currentGroupId;
            await updateStatistics(currentGroupId);
        } else if (groups.length > 0) {
            // Si no hay grupo activo pero hay grupos, seleccionar el primero
            statsGroupSelector.value = groups[0].id;
            await updateStatistics(groups[0].id);
        }
    } catch (error) {
        console.error('Error al cargar grupos para estadísticas:', error);
    } finally {
        // Ocultar indicador de carga
        if (loadingGroups) loadingGroups.style.display = 'none';
    }
}

/**
 * Genera la configuración para cada tipo de gráfico
 * @param {string} type - Tipo de gráfico (distribution, trend, pie, radar)
 * @param {Array} labels - Etiquetas para los datos (nombres de contadores)
 * @param {Array} data - Valores de los contadores
 * @returns {Object} - Configuración del gráfico
 */
function getChartConfig(type, labels, data) {
    // Configuración base común para todos los gráficos
    const baseConfig = {
        options: {
            responsive: true,  // Hace que el gráfico se adapte al tamaño del contenedor
            maintainAspectRatio: false,  // Permite cambiar la relación de aspecto
            devicePixelRatio: 2,  // Mejora la calidad en pantallas de alta resolución
            animation: {
                duration: 1000  // Duración de la animación inicial
            },
            plugins: {
                legend: {  // Configuración de la leyenda
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 20,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                // Configuración para el botón de compartir
                customShareButton: {
                    enable: true,
                    position: 'top',
                    text: '📤 Compartir',
                    onClick: async function(chart) {
                        try {
                            // Convertir el canvas a imagen
                            const canvas = chart.canvas;
                            const imageData = canvas.toDataURL('image/png');
                            const blob = await (await fetch(imageData)).blob();
                            const file = new File([blob], 'estadisticas.png', { type: 'image/png' });
                            
                            // Usar el API Web Share si está disponible
                            if (navigator.share) {
                                await navigator.share({
                                    files: [file],
                                    title: 'Estadísticas de Contadores',
                                    text: 'Mira mis estadísticas de contadores'
                                });
                            } else {
                                // Alternativa para navegadores que no soportan compartir
                                const link = document.createElement('a');
                                link.download = 'estadisticas.png';
                                link.href = imageData;
                                link.click();
                            }
                        } catch (error) {
                            console.error('Error al compartir gráfico:', error);
                        }
                    }
                }
            },
        }
    };

    // Configuraciones específicas para cada tipo de gráfico
    const configs = {
        // Gráfico de barras (distribución)
        distribution: {
            type: 'bar',
            data: {
                labels: [''],  // Una sola categoría para todas las barras
                datasets: labels.map((label, index) => ({
                    label: label,
                    data: [data[index]],  // Un valor por contador
                    backgroundColor: `rgba(${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, 0.5)`,
                    borderColor: `rgba(${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, 1)`,
                    borderWidth: 1,
                    categoryPercentage: 0.7,  // Ancho de la categoría
                    barPercentage: 0.9  // Ancho de la barra dentro de la categoría
                }))
            },
            options: {
                ...baseConfig.options,
                scales: {  // Configuración de los ejes
                    x: {
                        grid: {
                            display: false  // Oculta las líneas de cuadrícula en el eje X
                        }
                    },
                    y: {
                        beginAtZero: true,  // Comienza el eje Y desde cero
                        ticks: {
                            precision: 0  // Muestra solo valores enteros
                        }
                    }
                }
            }
        },
        
        // Gráfico de líneas (tendencia)
        trend: {
            type: 'line',
            data: {
                labels: labels,
                datasets: labels.map((label) => ({
                    label: label,
                    data: Array(labels.length).fill(undefined),  // Inicialmente vacío
                    fill: false,  // No rellenar área bajo la línea
                    borderColor: `rgba(${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, 1)`,
                    tension: 0.1,  // Suavizado de la línea
                    pointRadius: 6,  // Tamaño de los puntos
                    pointHoverRadius: 8  // Tamaño de los puntos al pasar el ratón
                }))
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Contadores'  // Título del eje X
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0  // Muestra solo valores enteros
                        },
                        title: {
                            display: true,
                            text: 'Valor'  // Título del eje Y
                        }
                    }
                }
            }
        },
        
        // Gráfico circular (pie)
        pie: {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: labels.map((_, i) => 
                        `rgba(${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, 0.5)`
                    )
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        onClick: function(e, legendItem, legend) {
                            const index = legendItem.index;
                            const ci = legend.chart;
                            
                            const meta = ci.getDatasetMeta(0);
                            const alreadyHidden = meta.data[index].hidden || false;
                            
                            meta.data[index].hidden = !alreadyHidden;  // Alternar visibilidad
                            
                            ci.update();  // Actualizar el gráfico
                        }
                    }
                }
            }
        },
        
        // Gráfico de radar
        radar: {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valores',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {  // Configuración del eje radial
                        angleLines: {
                            display: true  // Mostrar líneas angulares
                        },
                        beginAtZero: true,
                        ticks: {
                            display: true,
                            precision: 0,  // Muestra solo valores enteros
                            backdropColor: 'rgba(255, 255, 255, 0.75)'  // Color de fondo para los valores
                        },
                        pointLabels: {
                            display: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        }
    };

    // Configuración común para todos los gráficos
    Object.values(configs).forEach(config => {
        if (!config.options.plugins) {
            config.options.plugins = {};
        }
        
        // Asegurar que la leyenda permita interacción
        if (!config.options.plugins.legend) {
            config.options.plugins.legend = {};
        }
        
        config.options.plugins.legend = {
            ...config.options.plugins.legend,
            display: true,
            position: 'top',
            labels: {
                boxWidth: 20,
                padding: 15,
                font: {
                    size: 12
                }
            }
        };
        
        // Botón de compartir para todos los gráficos
        config.options.plugins.customButtons = {
            position: 'top',
            buttons: [{
                text: '📤 Compartir',
                onClick: async (chart) => {
                    try {
                        // Convertir el canvas a imagen
                        const canvas = chart.canvas;
                        const imageData = canvas.toDataURL('image/png');
                        const blob = await (await fetch(imageData)).blob();
                        const file = new File([blob], 'estadisticas.png', { type: 'image/png' });
                        
                        // Usar la API Web Share si está disponible
                        if (navigator.share) {
                            await navigator.share({
                                files: [file],
                                title: 'Estadísticas de Contadores',
                                text: 'Mira mis estadísticas de contadores'
                            });
                        } else {
                            // Alternativa para navegadores que no soportan compartir
                            const link = document.createElement('a');
                            link.download = 'estadisticas.png';
                            link.href = imageData;
                            link.click();
                        }
                    } catch (error) {
                        console.error('Error sharing chart:', error);
                    }
                }
            }]
        };
    });

    // Configurar animaciones para todos los gráficos
    Object.values(configs).forEach(config => {
        if (!config.options) config.options = {};
        config.options.animation = {
            duration: 1000, // Duración de la animación inicial
            onComplete: () => {
                // Después de la animación inicial, desactivar animaciones posteriores
                if (currentChart) {
                    currentChart.options.animation = false;
                }
            }
        };
    });
    
    // Combinar la configuración base con la configuración específica de cada gráfico
    Object.keys(configs).forEach(key => {
        configs[key].options = {
            ...baseConfig.options,
            ...configs[key].options
        };
    });

    // Devolver la configuración del tipo de gráfico solicitado
    return configs[type];
}

/**
 * Inicializa todos los tipos de gráficos para un grupo específico
 * @param {string} groupId - ID del grupo cuyos datos se mostrarán
 */
async function initializeAllCharts(groupId) {
    if (!auth.currentUser || !groupId) return;
    try {
        // Obtener los contadores del grupo desde Firestore
        const countersRef = collection(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters');
        const querySnapshot = await getDocs(countersRef);
        const counters = [];
        querySnapshot.forEach((doc) => {
            counters.push({ id: doc.id, ...doc.data() });
        });

        // Extraer etiquetas (títulos) y valores de los contadores
        const labels = counters.map(counter => counter.title);
        const values = counters.map(counter => counter.count);

        // Destruir gráficos existentes
        Object.values(charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });

        // Inicializar cada tipo de gráfico
        const chartTypes = ['distribution', 'trend', 'pie', 'radar'];
        chartTypes.forEach(type => {
            const canvasId = `statisticsChart${
                type === 'distribution' ? '1' : 
                type === 'trend' ? '2' : 
                type === 'pie' ? '3' : '4'
            }`;
            
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const config = getChartConfig(type, labels, values);
                
                // Configuración especial para el gráfico de tendencia
                if (type === 'trend') {
                    // Crear un dataset único que muestre la tendencia pero permita seleccionar contadores
                    config.data.datasets = [{
                        label: 'Tendencia de valores',
                        data: values,
                        fill: false,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.3,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: labels.map((_, i) => 
                            `rgba(${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, 1)`
                        ),
                        // Ocultar la etiqueta principal del dataset
                        showLine: true,
                        pointStyle: 'circle'
                    }];
                    // Configurar la leyenda para mostrar cada punto como un elemento independiente
                    config.options.plugins.legend = {
                        display: true,
                        position: 'top',
                        onClick: function(e, legendItem, legend) {
                            const index = legendItem.index;
                            const ci = legend.chart;
                            const dataset = ci.data.datasets[0];
                            
                            // Mantener un registro de los puntos visibles/ocultos
                            dataset.hiddenPoints = dataset.hiddenPoints || [];
                            
                            // Comprobar si el punto está oculto
                            const pointIsHidden = dataset.hiddenPoints.includes(index);
                            
                            if (pointIsHidden) {
                                // Mostrar el punto nuevamente
                                dataset.hiddenPoints = dataset.hiddenPoints.filter(i => i !== index);
                            } else {
                                // Ocultar el punto
                                dataset.hiddenPoints.push(index);
                            }
                            
                            // Reconstruir el dataset con solo los puntos visibles
                            const visibleLabels = [];
                            const visibleData = [];
                            const visibleColors = [];
                            const originalColors = dataset.originalPointBackgroundColor || dataset.pointBackgroundColor;
                            
                            // Guardar los colores originales si aún no se han guardado
                            if (!dataset.originalPointBackgroundColor) {
                                dataset.originalPointBackgroundColor = [...dataset.pointBackgroundColor];
                            }
                            
                            labels.forEach((label, i) => {
                                if (!dataset.hiddenPoints.includes(i)) {
                                    visibleLabels.push(label);
                                    visibleData.push(values[i]);
                                    visibleColors.push(originalColors[i]);
                                }
                            });
                            
                            // Actualizar el gráfico con los datos filtrados
                            ci.data.labels = visibleLabels;
                            ci.data.datasets[0].data = visibleData;
                            ci.data.datasets[0].pointBackgroundColor = visibleColors;
                            
                            ci.update();
                        },
                        labels: {
                            generateLabels: function(chart) {
                                const dataset = chart.data.datasets[0];
                                dataset.hiddenPoints = dataset.hiddenPoints || [];
                                
                                // Usar los colores originales para las etiquetas
                                const originalColors = dataset.originalPointBackgroundColor || dataset.pointBackgroundColor;
                                
                                return labels.map((label, i) => {
                                    const isHidden = dataset.hiddenPoints.includes(i);
                                    const color = originalColors[i];
                                    
                                    return {
                                        text: label,
                                        fillStyle: color,
                                        strokeStyle: color,
                                        lineWidth: 1,
                                        hidden: isHidden,
                                        index: i
                                    };
                                });
                            }
                        }
                    };
                }
                
                charts[type] = new Chart(ctx, config);
            }
        });
        
        // Añadir botón de compartir junto al selector de grupos
        addShareButton();
        
    } catch (error) {
        console.error('Error inicializando gráficos:', error);
    }
}

// Modificar la función updateStatistics para usar initializeAllCharts
async function updateStatistics(groupId) {
    if (!auth.currentUser || !groupId) return;
    try {
        await initializeAllCharts(groupId);
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

// Make sure to export the function
export { updateStatistics };

/**
 * Añade un botón de compartir junto al selector de grupos
 */
function addShareButton() {
    // Buscar el contenedor del selector de grupos
    const selectorContainer = document.getElementById('statsGroupSelector').parentElement;
    
    // Eliminar botón existente para evitar duplicados
    const existingButton = document.querySelector('.share-stats-btn');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Crear nuevo botón
    const shareButton = document.createElement('button');
    shareButton.className = 'btn btn-primary share-stats-btn';
    shareButton.innerHTML = '<i class="fas fa-share-alt"></i> <span>Compartir</span>';
    shareButton.title = 'Compartir gráfico actual';
    
    // Añadir evento de clic
    shareButton.addEventListener('click', async () => {
        // Obtener el gráfico actualmente visible
        const activeTabId = document.querySelector('.tab-pane.active').id;
        let chartType;
        
        switch (activeTabId) {
            case 'distribution':
                chartType = 'distribution';
                break;
            case 'trend':
                chartType = 'trend';
                break;
            case 'pie':
                chartType = 'pie';
                break;
            case 'radar':
                chartType = 'radar';
                break;
            default:
                chartType = 'distribution';
        }
        
        const chart = charts[chartType];
        
        if (chart) {
            try {
                // Mostrar mensaje de carga
                showShareMessage('Preparando imagen para compartir...');
                
                // Convertir el canvas a imagen
                const canvas = chart.canvas;
                const imageData = canvas.toDataURL('image/png');
                const blob = await (await fetch(imageData)).blob();
                const file = new File([blob], 'estadisticas.png', { type: 'image/png' });
                
                // Usar el API Web Share si está disponible
                if (navigator.share) {
                    await navigator.share({
                        files: [file],
                        title: 'Estadísticas de Contadores',
                        text: 'Mira mis estadísticas de contadores'
                    });
                    showShareMessage('¡Compartido con éxito!');
                } else {
                    // Alternativa para navegadores que no soportan compartir
                    const link = document.createElement('a');
                    link.download = 'estadisticas.png';
                    link.href = imageData;
                    link.click();
                    showShareMessage('Imagen descargada');
                }
            } catch (error) {
                console.error('Error al compartir gráfico:', error);
                showShareMessage('No se pudo compartir. Intenta de nuevo.');
            }
        }
    });
    
    // Añadir botón junto al selector
    selectorContainer.appendChild(shareButton);
}

/**
 * Muestra un mensaje temporal al compartir
 * @param {string} message - Mensaje a mostrar
 */
function showShareMessage(message) {
    // Buscar mensaje existente o crear uno nuevo
    let messageElement = document.querySelector('.share-message');
    
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.className = 'share-message';
        document.body.appendChild(messageElement);
    }
    
    // Actualizar el mensaje y mostrarlo
    messageElement.textContent = message;
    messageElement.classList.add('show');
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 3000);
}