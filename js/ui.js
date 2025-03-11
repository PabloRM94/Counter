document.getElementById('toggleStatistics').addEventListener('click', function() {
    document.getElementById('counterSection').style.display = 'none';
    document.getElementById('statisticsSection').style.display = 'block';
});

document.getElementById('backToCounters').addEventListener('click', function() {
    document.getElementById('statisticsSection').style.display = 'none';
    document.getElementById('counterSection').style.display = 'block';
});

const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
    const container = document.querySelector('.container');
    if (container) container.classList.toggle('dark-mode');

    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
};

document.getElementById('toggleDarkMode')?.addEventListener('click', toggleDarkMode);
document.getElementById('toggleDarkMode2')?.addEventListener('click', toggleDarkMode);

if (localStorage.getItem('darkMode') === 'true') {
    toggleDarkMode();
}

// Función para mostrar alertas
function showAlert(message, type = 'info') {
    // Eliminar alertas anteriores
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Crear nueva alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar alerta antes del formulario
    const authSection = document.getElementById('authSection');
    if (authSection) {
        authSection.insertBefore(alertDiv, authSection.firstChild);
    } else {
        // Si no estamos en la sección de autenticación, insertar al inicio del contenedor principal
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(alertDiv, container.firstChild);
        }
    }
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        const alert = bootstrap.Alert.getOrCreateInstance(alertDiv);
        if (alert) {
            alert.close();
        } else {
            alertDiv.remove();
        }
    }, 5000);
}



export { showAlert, toggleDarkMode };
