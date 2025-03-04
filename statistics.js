import { auth, db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentChart = null;
let currentChartType = 'distribution';
document.addEventListener('DOMContentLoaded', () => {
    const chartTabs = document.getElementById('chartTabs');

    // Cambiar gráfico al seleccionar una pestaña
    chartTabs.addEventListener('shown.bs.tab', async (e) => {
        const targetTab = e.target.getAttribute('aria-controls'); // Obtener el id del tab seleccionado
        switch (targetTab) {
            case 'distribution':
                currentChartType = 'distribution';
                break;
            case 'trend':
                currentChartType = 'trend';
                break;
            case 'pie':
                currentChartType = 'pie';
                break;
            case 'radar':
                currentChartType = 'radar';
                break;
            default:
                currentChartType = 'distribution';
        }

        const currentGroupId = document.querySelector('.group-button.active')?.dataset.groupId;
        if (currentGroupId) {
            await updateStatistics(currentGroupId); // Actualizar el gráfico
        }
    });
});
function getChartConfig(type, labels, data) {
    const configs = {
        distribution: {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Valores de Contadores',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                animation: {
                    duration: 1000 // Animation duration in milliseconds
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución de Contadores'
                    }
                }
            }
        },
        trend: {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tendencia de Contadores',
                    data: data,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Tendencia de Contadores'
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
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribución Circular'
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
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Gráfico Radar'
                    }
                }
            }
        }
    };

    // Add download button to all chart configurations
    Object.values(configs).forEach(config => {
        if (!config.options.plugins) {
            config.options.plugins = {};
        }
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

    // Add common options to all chart types
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
    return configs[type];
}

async function updateStatistics(groupId) {
    if (!auth.currentUser || !groupId) return;

    try {
        const countersRef = collection(db, 'users', auth.currentUser.uid, 'groups', groupId, 'counters');
        const querySnapshot = await getDocs(countersRef);

        const counters = [];
        querySnapshot.forEach((doc) => {
            counters.push({ id: doc.id, ...doc.data() });
        });

        if (counters.length === 0) {
            if (currentChart) {
                currentChart.destroy();
                currentChart = null;
            }
            return;
        }

        const labels = counters.map(counter => counter.title);
        const values = counters.map(counter => counter.count);

        await createOrUpdateChart(labels, values); // Actualizar el gráfico
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

async function createOrUpdateChart(labels, data) {
    try {
        const canvas = document.getElementById('statisticsChart');
        if (!canvas) {
            console.error('Canvas no encontrado');
            return;
        }

        const ctx = canvas.getContext('2d');

        // Destruir el gráfico anterior si existe
        if (currentChart) {
            currentChart.destroy();
        }

        // Crear un nuevo gráfico con el tipo seleccionado
        const config = getChartConfig(currentChartType, labels, data);
        currentChart = new Chart(ctx, config);
    } catch (error) {
        console.error('Error creando/actualizando gráfico:', error);
    }
}

// Remove duplicate event listener
document.addEventListener('DOMContentLoaded', () => {
    const chartSelector = document.getElementById('chartSelector');
    
    chartSelector.addEventListener('change', (e) => {
        currentChartType = e.target.value;
        const currentGroupId = document.querySelector('.group-button.active')?.dataset.groupId;
        if (currentGroupId) {
            updateStatistics(currentGroupId);
        }
    });
});

export { updateStatistics };