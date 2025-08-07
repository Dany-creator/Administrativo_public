





// Session Management
function checkSession() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showDashboard();
    }
}

function setSession() {
    sessionStorage.setItem('adminLoggedIn', 'true');
}

function clearSession() {
    sessionStorage.removeItem('adminLoggedIn');
}

// Login System
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === '123456') {
        setSession();
        showDashboard();
    } else {
        alert('Usuario o contraseña incorrectos');
    }
});

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    initializeDashboard();
}

function logout() {
    clearSession();
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Initialize Dashboard
function initializeDashboard() {
    // Set current date
    const fecha = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = fecha.toLocaleDateString('es-ES', opciones);

    // Set today's date in forms
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('ingresoFecha').value = today;
    document.getElementById('egresoFecha').value = today;

    // Load data
    loadAllData();
    updateSummaryCards();
    updateSelectOptions();
}

// Card Toggle Functionality
function toggleCard(cardName) {
    const content = document.getElementById(cardName + '-content');
    const header = content.previousElementSibling;
    const icon = header.querySelector('.toggle-icon');

    content.classList.toggle('active');
    header.classList.toggle('active');
}

// Data Management Functions
function saveData(type, data) {
    systemData[type] = data;
    localStorage.setItem(type, JSON.stringify(data));
    updateSummaryCards();
    updateSelectOptions();
}

function loadAllData() {
    loadTableData('ingresos');
    loadTableData('egresos');
    loadTableData('bancos');
    loadTableData('proveedores');
}

function loadTableData(type) {
    const tableBody = document.getElementById(type + 'Table');
    tableBody.innerHTML = '';

    systemData[type].forEach((item, index) => {
        const row = document.createElement('tr');

        if (type === 'ingresos') {
            row.innerHTML = `
                        <td>${item.fecha}</td>
                        <td>$${item.monto.toLocaleString()}</td>
                        <td>${item.moneda}</td>
                        <td>${item.descripcion}</td>
                    `;
        } else if (type === 'egresos') {
            row.innerHTML = `
                        <td>${item.fecha}</td>
                        <td>${item.banco}</td>
                        <td>${item.tipo}</td>
                        <td>$${item.monto.toLocaleString()}</td>
                        <td>${item.descripcion}</td>
                    `;
        } else if (type === 'bancos') {
            row.innerHTML = `
                        <td>${item.nombre}</td>
                        <td>${item.cuenta}</td>
                        <td>$${item.saldo.toLocaleString()}</td>
                        <td><span style="color: green;">✅ Activo</span></td>
                    `;
        } else if (type === 'proveedores') {
            row.innerHTML = `
                        <td>${item.nombre}</td>
                        <td>${item.contacto}</td>
                        <td>${item.telefono}</td>
                        <td>${item.email}</td>
                    `;
        }

        tableBody.appendChild(row);
    });
}

function updateSummaryCards() {
    // Total Ingresos
    const totalIngresos = systemData.ingresos.reduce((sum, item) => sum + item.monto, 0);
    document.getElementById('totalIngresos').textContent = '$' + totalIngresos.toLocaleString();

    // Total Egresos
    const totalEgresos = systemData.egresos.reduce((sum, item) => sum + item.monto, 0);
    document.getElementById('totalEgresos').textContent = '$' + totalEgresos.toLocaleString();

    // Total Bancos
    document.getElementById('totalBancos').textContent = systemData.bancos.length;

    // Total Proveedores
    document.getElementById('totalProveedores').textContent = systemData.proveedores.length;
}

function updateSelectOptions() {
    // Update banco select in egresos form
    const bancoSelect = document.getElementById('egresoBanco');
    bancoSelect.innerHTML = '<option value="">Seleccionar banco</option>';
    systemData.bancos.forEach(banco => {
        const option = document.createElement('option');
        option.value = banco.nombre;
        option.textContent = banco.nombre;
        bancoSelect.appendChild(option);
    });

    // Update proveedor select in egresos form
    const proveedorSelect = document.getElementById('egresoProveedor');
    proveedorSelect.innerHTML = '<option value="">Seleccionar proveedor</option>';
    systemData.proveedores.forEach(proveedor => {
        const option = document.createElement('option');
        option.value = proveedor.nombre;
        option.textContent = proveedor.nombre;
        proveedorSelect.appendChild(option);
    });
}

// Form Handlers
document.getElementById('ingresosForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const ingreso = {
        fecha: document.getElementById('ingresoFecha').value,
        moneda: document.getElementById('ingresoMoneda').value,
        monto: parseFloat(document.getElementById('ingresoMonto').value),
        descripcion: document.getElementById('ingresoDescripcion').value
    };

    systemData.ingresos.push(ingreso);
    saveData('ingresos', systemData.ingresos);
    loadTableData('ingresos');
    this.reset();
    document.getElementById('ingresoFecha').value = new Date().toISOString().split('T')[0];

    addMessage(`✅ Ingreso agregado: ${ingreso.monto.toLocaleString()} ${ingreso.moneda}`, 'assistant');
});

document.getElementById('egresosForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const egreso = {
        fecha: document.getElementById('egresoFecha').value,
        banco: document.getElementById('egresoBanco').value,
        tipo: document.getElementById('egresoTipo').value,
        monto: parseFloat(document.getElementById('egresoMonto').value),
        proveedor: document.getElementById('egresoProveedor').value || '',
        descripcion: document.getElementById('egresoDescripcion').value
    };

    systemData.egresos.push(egreso);
    saveData('egresos', systemData.egresos);
    loadTableData('egresos');
    this.reset();
    document.getElementById('egresoFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('proveedorGroup').style.display = 'none';

    addMessage(`✅ Egreso agregado: ${egreso.monto.toLocaleString()} - ${egreso.tipo}`, 'assistant');
});

document.getElementById('bancosForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const banco = {
        nombre: document.getElementById('bancoNombre').value,
        cuenta: document.getElementById('bancoCuenta').value,
        saldo: parseFloat(document.getElementById('bancoSaldo').value)
    };

    systemData.bancos.push(banco);
    saveData('bancos', systemData.bancos);
    loadTableData('bancos');
    this.reset();

    addMessage(`✅ Banco agregado: ${banco.nombre}`, 'assistant');
});

document.getElementById('proveedoresForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const proveedor = {
        nombre: document.getElementById('proveedorNombre').value,
        contacto: document.getElementById('proveedorContacto').value,
        telefono: document.getElementById('proveedorTelefono').value,
        email: document.getElementById('proveedorEmail').value
    };

    systemData.proveedores.push(proveedor);
    saveData('proveedores', systemData.proveedores);
    loadTableData('proveedores');
    this.reset();

    addMessage(`✅ Proveedor agregado: ${proveedor.nombre}`, 'assistant');
});

// Show/Hide proveedor field based on egreso type
document.getElementById('egresoTipo').addEventListener('change', function () {
    const proveedorGroup = document.getElementById('proveedorGroup');
    if (this.value === 'Abono a Proveedores') {
        proveedorGroup.style.display = 'block';
        document.getElementById('egresoProveedor').required = true;
    } else {
        proveedorGroup.style.display = 'none';
        document.getElementById('egresoProveedor').required = false;
    }
});

// Export Data Function
function exportData(type) {
    const data = systemData[type];
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    addMessage(`📁 Datos de ${type} exportados correctamente`, 'assistant');
}

// AI Assistant Functions
document.addEventListener("DOMContentLoaded", () => {
    const toggleChatBtn = document.getElementById("toggleChatBtn");
    const aiAssistant = document.getElementById("aiAssistant");
    const closeChatBtn = document.getElementById("closeChatBtn");

    toggleChatBtn.addEventListener("click", () => {
        aiAssistant.classList.add("visible");
        toggleChatBtn.classList.add("hidden");
    });

    closeChatBtn.addEventListener("click", () => {
        aiAssistant.classList.remove("visible");
        toggleChatBtn.classList.remove("hidden");
    });

    // Close chat when clicking outside
    document.addEventListener("click", (e) => {
        if (!aiAssistant.contains(e.target) && !toggleChatBtn.contains(e.target)) {
            aiAssistant.classList.remove("visible");
            toggleChatBtn.classList.remove("hidden");
        }
    });
});

function addMessage(message, sender) {
    const chat = document.getElementById('aiChat');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${sender}`;
    messageDiv.innerHTML = message;
    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('textInput');
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    setTimeout(() => {
        const response = processAICommand(message);
        addMessage(response, 'assistant');
    }, 1000);
}

function processAICommand(message) {
    const lowerMessage = message.toLowerCase();

    // Financial reports
    if (lowerMessage.includes('finanzas') || lowerMessage.includes('balance') || lowerMessage.includes('resumen')) {
        const totalIngresos = systemData.ingresos.reduce((sum, item) => sum + item.monto, 0);
        const totalEgresos = systemData.egresos.reduce((sum, item) => sum + item.monto, 0);
        const balance = totalIngresos - totalEgresos;

        return `💰 <strong>Resumen Financiero:</strong><br>
                        • Total Ingresos: ${totalIngresos.toLocaleString()}<br>
                        • Total Egresos: ${totalEgresos.toLocaleString()}<br>
                        • Balance: ${balance.toLocaleString()}<br>
                        • Estado: ${balance >= 0 ? '✅ Positivo' : '⚠️ Negativo'}<br>
                        📊 Registros: ${systemData.ingresos.length} ingresos, ${systemData.egresos.length} egresos`;
    }

    // Ingresos report
    if (lowerMessage.includes('ingresos') || lowerMessage.includes('ingresos')) {
        const totalIngresos = systemData.ingresos.reduce((sum, item) => sum + item.monto, 0);
        const promedioIngresos = systemData.ingresos.length > 0 ? totalIngresos / systemData.ingresos.length : 0;

        return `💰 <strong>Reporte de Ingresos:</strong><br>
                        • Total: ${totalIngresos.toLocaleString()}<br>
                        • Registros: ${systemData.ingresos.length}<br>
                        • Promedio: ${promedioIngresos.toLocaleString()}<br>
                        • Último registro: ${systemData.ingresos.length > 0 ? systemData.ingresos[systemData.ingresos.length - 1].fecha : 'N/A'}`;
    }

    // Egresos report
    if (lowerMessage.includes('egresos') || lowerMessage.includes('gastos')) {
        const totalEgresos = systemData.egresos.reduce((sum, item) => sum + item.monto, 0);
        const egresosPorTipo = {};
        systemData.egresos.forEach(egreso => {
            egresosPorTipo[egreso.tipo] = (egresosPorTipo[egreso.tipo] || 0) + egreso.monto;
        });

        let desglose = '';
        Object.entries(egresosPorTipo).forEach(([tipo, monto]) => {
            desglose += `• ${tipo}: ${monto.toLocaleString()}<br>`;
        });

        return `📤 <strong>Reporte de Egresos:</strong><br>
                        • Total: ${totalEgresos.toLocaleString()}<br>
                        • Registros: ${systemData.egresos.length}<br>
                        <br><strong>Por tipo:</strong><br>
                        ${desglose}`;
    }

    // Bancos status
    if (lowerMessage.includes('bancos') || lowerMessage.includes('cuentas')) {
        const totalSaldo = systemData.bancos.reduce((sum, banco) => sum + banco.saldo, 0);
        let bancosList = '';
        systemData.bancos.forEach(banco => {
            bancosList += `• ${banco.nombre}: ${banco.saldo.toLocaleString()}<br>`;
        });

        return `🏦 <strong>Estado de Bancos:</strong><br>
                        • Total bancos: ${systemData.bancos.length}<br>
                        • Saldo total: ${totalSaldo.toLocaleString()}<br>
                        <br><strong>Detalle:</strong><br>
                        ${bancosList || 'No hay bancos registrados'}`;
    }

    // Proveedores status
    if (lowerMessage.includes('proveedores') || lowerMessage.includes('proveedores')) {
        let proveedoresList = '';
        systemData.proveedores.forEach(proveedor => {
            proveedoresList += `• ${proveedor.nombre} - ${proveedor.contacto}<br>`;
        });

        return `🏪 <strong>Proveedores Registrados:</strong><br>
                        • Total: ${systemData.proveedores.length}<br>
                        <br><strong>Lista:</strong><br>
                        ${proveedoresList || 'No hay proveedores registrados'}`;
    }

    // Help command
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
        return `🤖 <strong>Comandos Disponibles:</strong><br><br>
                        💰 <em>"¿Cómo van las finanzas?"</em> - Resumen financiero<br>
                        📈 <em>"Reporte de ingresos"</em> - Estado de ingresos<br>
                        📤 <em>"¿Cómo van los egresos?"</em> - Análisis de gastos<br>
                        🏦 <em>"Estado de bancos"</em> - Información bancaria<br>
                        🏪 <em>"Lista de proveedores"</em> - Proveedores registrados<br>
                        📊 <em>"Balance general"</em> - Resumen completo<br><br>
                        💡 <strong>Tip:</strong> Puedes preguntar sobre cualquier aspecto de tu negocio.`;
    }

    // Default response
    return `🤖 Entiendo que preguntas sobre: "${message}"<br><br>
                    Puedo ayudarte con información sobre:<br>
                    💰 Finanzas • 📈 Ingresos • 📤 Egresos<br>
                    🏦 Bancos • 🏪 Proveedores • 📊 Reportes<br><br>
                    💡 Escribe "ayuda" para ver todos los comandos disponibles.`;
}

// Text input enter key
document.getElementById('textInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize session check on page load
document.addEventListener('DOMContentLoaded', function () {
    checkSession();
});

console.log('Sistema de Administración Inicializado');
console.log('Características: Gestión de ingresos, egresos, bancos y proveedores');