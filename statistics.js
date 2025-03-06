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
    const currentGroupId = document.querySelector('.group-button.active')?.dataset.groupId;
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
            const currentGroupId = document.querySelector('.group-button.active')?.dataset.groupId;
            if (currentGroupId) {
                await updateStatistics(currentGroupId);
            }
        });
    }
});
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
                ...baseConfig.options,
                scales: {
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
// Eliminar la función createOrUpdateChart ya que no la necesitamos más
export { updateStatistics };