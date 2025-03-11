import { auth, db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentChart = null;
let currentChartType = 'distribution';
let charts = {
    distribution: null,
    trend: null,
    pie: null,
    radar: null
};

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el primer gráfico cuando se carga la página
    const currentGroupId = document.querySelector('.group-item.active')?.dataset.groupId;
    if (currentGroupId) {
        updateStatistics(currentGroupId);
    }

    // Manejar cambios de pestaña
    const chartTabs = document.getElementById('chartTabs');
    if (chartTabs) {
        chartTabs.addEventListener('shown.bs.tab', async (e) => {
            const targetTab = e.target.getAttribute('aria-controls');
            
            // Actualizar el tipo de gráfico
            currentChartType = targetTab;

            // Obtener datos actuales
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

// Función para cargar los grupos en el selector de estadísticas
async function loadGroupsForStatistics() {
    if (!auth.currentUser) return;
    
    const loadingGroups = document.getElementById('loadingGroups');
    const statsGroupSelector = document.getElementById('statsGroupSelector');
    
    if (!statsGroupSelector) return;
    
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
function getChartConfig(type, labels, data) {
    const baseConfig = {
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: 2,
            animation: {
                duration: 1000
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 20,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }
            }
        }
    };

    const configs = {
        distribution: {
            type: 'bar',
            data: {
                labels: [''],
                datasets: labels.map((label, index) => ({
                    label: label,
                    data: [data[index]],
                    backgroundColor: `rgba(${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, 0.5)`,
                    borderColor: `rgba(${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, 1)`,
                    borderWidth: 1,
                    categoryPercentage: 0.7,
                    barPercentage: 0.9
                }))
            },
            options: {
                ...baseConfig.options,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        },
        trend: {
            type: 'line',
            data: {
                labels: labels,
                datasets: labels.map((label) => ({
                    label: label,
                    data: Array(labels.length).fill(undefined),
                    fill: false,
                    borderColor: `rgba(${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, ${50 + Math.floor(Math.random() * 150)}, 1)`,
                    tension: 0.1,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }))
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Contadores'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        },
                        title: {
                            display: true,
                            text: 'Valor'
                        }
                    }
                }
            }
        },
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
                            
                            meta.data[index].hidden = !alreadyHidden;
                            
                            ci.update();
                        }
                    }
                }
            }
        },
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
                    r: {
                        angleLines: {
                            display: true
                        },
                        beginAtZero: true,
                        ticks: {
                            display: true,
                            precision: 0,
                            backdropColor: 'rgba(255, 255, 255, 0.75)'
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
        
        // Botón de compartir
        config.options.plugins.customButtons = {
            position: 'top',
            buttons: [{
                text: '📤 Compartir',
                onClick: async (chart) => {
                    try {
                        const canvas = chart.canvas;
                        const imageData = canvas.toDataURL('image/png');
                        const blob = await (await fetch(imageData)).blob();
                        const file = new File([blob], 'estadisticas.png', { type: 'image/png' });
                        
                        if (navigator.share) {
                            await navigator.share({
                                files: [file],
                                title: 'Estadísticas de Contadores',
                                text: 'Mira mis estadísticas de contadores'
                            });
                        } else {
                            // Fallback for browsers that don't support sharing
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


    Object.values(configs).forEach(config => {
        if (!config.options) config.options = {};
        config.options.animation = {
            duration: 1000, // Initial animation duration
            onComplete: () => {
                // After initial animation, disable subsequent animations
                if (currentChart) {
                    currentChart.options.animation = false;
                }
            }
        };
    });
    // Merge base config with specific chart config
    Object.keys(configs).forEach(key => {
        configs[key].options = {
            ...baseConfig.options,
            ...configs[key].options
        };
    });

    return configs[type];
}

async function initializeAllCharts(groupId) {
    if (!auth.currentUser || !groupId) return;
    try {
        const countersRef = collection(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters');
        const querySnapshot = await getDocs(countersRef);
        const counters = [];
        querySnapshot.forEach((doc) => {
            counters.push({ id: doc.id, ...doc.data() });
        });

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