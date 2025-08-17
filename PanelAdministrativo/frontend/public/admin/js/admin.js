// Configuración de Axios
axios.defaults.baseURL = '/api';
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token')}`;

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    // Verificar si el token es válido
    axios.get('/auth/verify')
        .then(response => {
            // El token es válido, continuar
            console.log('Autenticación verificada');
        })
        .catch(error => {
            // El token no es válido, redirigir al login
            localStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin_token');
            window.location.href = '/login.html';
        });
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    window.location.href = '/login.html';
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    checkAuth();
    
    // Tabs functionality
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Logout buttons
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('logout-dropdown').addEventListener('click', logout);
    
    // File upload functionality
    const fileUpload = document.getElementById('file-upload');
    const fileInput = document.getElementById('imagen-rifa');
    const fileName = document.getElementById('file-name');
    
    if (fileUpload && fileInput) {
        fileUpload.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                fileName.textContent = fileInput.files[0].name;
            }
        });
    }
    
    // Form submission for rifa creation
    const formRifa = document.getElementById('form-rifa');
    if (formRifa) {
        formRifa.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('nombre', document.getElementById('nombre-rifa').value);
            formData.append('descripcion', document.getElementById('descripcion-rifa').value);
            formData.append('precioDolar', document.getElementById('precio-dolar').value);
            formData.append('precioBolivar', document.getElementById('precio-bolivar').value);
            formData.append('minBoletos', document.getElementById('min-boletos').value);
            formData.append('maxBoletos', document.getElementById('max-boletos').value);
            formData.append('totalBoletos', document.getElementById('total-boletos').value);
            formData.append('fechaFin', document.getElementById('fecha-fin').value);
            
            if (fileInput.files.length > 0) {
                formData.append('imagen', fileInput.files[0]);
            }
            
            try {
                const response = await axios.post('/rifas', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                showNotification('Rifa creada exitosamente!', 'success');
                formRifa.reset();
                fileName.textContent = '';
                
                // Actualizar la tabla de rifas
                loadRifas();
                
            } catch (error) {
                showNotification('Error al crear la rifa: ' + (error.response?.data?.message || error.message), 'error');
            }
        });
    }
    
    // Approve selected purchases
    const approveSelected = document.getElementById('approve-selected');
    if (approveSelected) {
        approveSelected.addEventListener('click', async () => {
            const selectedCheckboxes = document.querySelectorAll('.approve-checkbox:checked');
            if (selectedCheckboxes.length === 0) {
                showNotification('Por favor, selecciona al menos una compra para aprobar', 'error');
                return;
            }
            
            const purchaseIds = Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-id'));
            
            try {
                for (const id of purchaseIds) {
                    await axios.put(`/compradores/${id}/aprobar`);
                }
                
                showNotification(`Se han aprobado ${purchaseIds.length} compras`, 'success');
                
                // Actualizar la tabla de compras
                loadPurchases();
                
            } catch (error) {
                showNotification('Error al aprobar compras: ' + (error.response?.data?.message || error.message), 'error');
            }
        });
    }
    
    // Select all checkbox
    const selectAll = document.getElementById('select-all');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            document.querySelectorAll('.comprador-checkbox').forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });
    }
    
    // Load data functions
    async function loadRifas() {
        try {
            const response = await axios.get('/rifas');
            // Aquí deberías actualizar la tabla de rifas con los datos recibidos
            console.log('Rifas cargadas:', response.data);
        } catch (error) {
            showNotification('Error al cargar rifas: ' + (error.response?.data?.message || error.message), 'error');
        }
    }
    
    async function loadPurchases() {
        try {
            const response = await axios.get('/compradores/pendientes');
            // Aquí deberías actualizar la tabla de compras con los datos recibidos
            console.log('Compras pendientes cargadas:', response.data);
        } catch (error) {
            showNotification('Error al cargar compras: ' + (error.response?.data?.message || error.message), 'error');
        }
    }
    
    // Load initial data
    loadRifas();
    loadPurchases();
});