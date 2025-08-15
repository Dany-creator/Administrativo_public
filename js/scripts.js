// System Data Storage
let systemData = {
    ingresos: JSON.parse(localStorage.getItem('ingresos') || '[]'),
    egresos: JSON.parse(localStorage.getItem('egresos') || '[]'),
    bancos: JSON.parse(localStorage.getItem('bancos') || '[]'),
    proveedores: JSON.parse(localStorage.getItem('proveedores') || '[]'),
    inventory: [
        { id: 1, name: 'Producto A', quantity: 25, unit: 'unidades', minStock: 10, supplier: 'Proveedor 1' },
        { id: 2, name: 'Producto B', quantity: 8, unit: 'kg', minStock: 5, supplier: 'Proveedor 2' },
        { id: 3, name: 'Producto C', quantity: 15, unit: 'litros', minStock: 20, supplier: 'Proveedor 3' }
    ],
    sales: {
        today: 12450,
        yesterday: 11500,
        clients: 85,
        avgTicket: 146.47
    },
    staff: {
        active: 8,
        total: 10,
        absent: ['Juan Pérez', 'María González']
    }
};

let isRecording = false;
let isMobile = window.innerWidth <= 768;

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
    SPREADSHEET_ID: 'TU_ID_DE_GOOGLE_SHEET_AQUI',
    API_KEY: 'TU_API_KEY_AQUI',
    INVENTORY_RANGE: 'Inventario!A:F',
    SALES_RANGE: 'Ventas!A:E',
    STAFF_RANGE: 'Personal!A:D'
};

// Session Management
function checkSession() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showDashboard();
        return true;
    }
    return false;
}

function setSession() {
    localStorage.setItem('adminLoggedIn', 'true');
}

function clearSession() {
    localStorage.removeItem('adminLoggedIn');
}

// Navbar loading
function loadNavbar() {
    fetch('navbar.html')
        .then(response => response.text())
        .then(html => {
            const navbarContainer = document.getElementById('navbar-container');
            if (navbarContainer) {
                navbarContainer.innerHTML = html;
            }
        })
        .then(() => {
            // Define global navigation functions
            window.toggleNav = function () {
                var sidebar = document.getElementById("mySidebar");
                if (sidebar) {
                    sidebar.classList.toggle("open");
                }
            }

            window.closeNav = function () {
                const sidebar = document.getElementById("mySidebar");
                if (sidebar) {
                    sidebar.classList.remove("open");
                }
            }

            window.logout = function () {
                clearSession();
                window.location.href = "index.html";
            }
        });
}

// Date initialization
function initializeDate() {
    const fechaElement = document.getElementById("fechaActual");
    if (fechaElement) {
        const fecha = new Date();
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        fechaElement.innerText = fecha.toLocaleDateString('es-ES', opciones);
    }

    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const fecha = new Date();
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = fecha.toLocaleDateString('es-ES', opciones);
    }
}

// Login System
function initializeLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
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
    }
}

function showDashboard() {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');

    if (loginScreen && dashboard) {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        initializeDashboard();
    }
}

// Initialize Dashboard
function initializeDashboard() {
    initializeDate();

    // Set today's date in forms
    const today = new Date().toISOString().split('T')[0];
    const ingresoFecha = document.getElementById('ingresoFecha');
    const egresoFecha = document.getElementById('egresoFecha');

    if (ingresoFecha) ingresoFecha.value = today;
    if (egresoFecha) egresoFecha.value = today;

    // Load data and update displays
    loadAllData();
    updateSummaryCards();
    updateSelectOptions();

    // Initialize AI assistant
    initializeAIAssistant();

    // Add welcome message to AI
    const aiChat = document.getElementById('aiChat');
    if (aiChat && aiChat.children.length <= 1) {
        addMessage('¡Sistema de consultas inicializado! ¿Qué información necesitas?', 'assistant');
    }

    initializeFormListeners();
}

function toggleCard(cardName) {
    // Helper para abrir/cerrar una card
    function toggleSingleCard(name, forceOpen = false) {
        const content = document.getElementById(name + '-content');
        if (content) {
            const header = content.previousElementSibling;
            if (forceOpen) {
                content.classList.add('active');
                header.classList.add('active');
            } else {
                content.classList.toggle('active');
                header.classList.toggle('active');
            }
        }
    }

    // Pares de cards que deben abrirse/cerrarse juntos
    if (cardName === 'ingresos' || cardName === 'egresos') {
        // Si cualquiera de los dos se toca, ambos se alternan juntos
        const ingresosContent = document.getElementById('ingresos-content');
        const egresosContent = document.getElementById('egresos-content');
        const ingresosHeader = ingresosContent ? ingresosContent.previousElementSibling : null;
        const egresosHeader = egresosContent ? egresosContent.previousElementSibling : null;

        const isActive = ingresosContent && ingresosContent.classList.contains('active') &&
            egresosContent && egresosContent.classList.contains('active');

        if (isActive) {
            // Si ambos están abiertos, ciérralos
            if (ingresosContent) ingresosContent.classList.remove('active');
            if (egresosContent) egresosContent.classList.remove('active');
            if (ingresosHeader) ingresosHeader.classList.remove('active');
            if (egresosHeader) egresosHeader.classList.remove('active');
        } else {
            // Si alguno está cerrado, ábrelos ambos
            if (ingresosContent) ingresosContent.classList.add('active');
            if (egresosContent) egresosContent.classList.add('active');
            if (ingresosHeader) ingresosHeader.classList.add('active');
            if (egresosHeader) egresosHeader.classList.add('active');
        }
    } else if (cardName === 'bancos' || cardName === 'proveedores') {
        // Si cualquiera de los dos se toca, ambos se alternan juntos
        const bancosContent = document.getElementById('bancos-content');
        const proveedoresContent = document.getElementById('proveedores-content');
        const bancosHeader = bancosContent ? bancosContent.previousElementSibling : null;
        const proveedoresHeader = proveedoresContent ? proveedoresContent.previousElementSibling : null;

        const isActive = bancosContent && bancosContent.classList.contains('active') &&
            proveedoresContent && proveedoresContent.classList.contains('active');

        if (isActive) {
            // Si ambos están abiertos, ciérralos
            if (bancosContent) bancosContent.classList.remove('active');
            if (proveedoresContent) proveedoresContent.classList.remove('active');
            if (bancosHeader) bancosHeader.classList.remove('active');
            if (proveedoresHeader) proveedoresHeader.classList.remove('active');
        } else {
            // Si alguno está cerrado, ábrelos ambos
            if (bancosContent) bancosContent.classList.add('active');
            if (proveedoresContent) proveedoresContent.classList.add('active');
            if (bancosHeader) bancosHeader.classList.add('active');
            if (proveedoresHeader) proveedoresHeader.classList.add('active');
        }
    } else {
        // Para las demás cards, alterna normalmente
        toggleSingleCard(cardName);
    }
}

// Make toggleCard globally available
window.toggleCard = toggleCard;

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
    if (!tableBody) return;

    tableBody.innerHTML = '';

    systemData[type].forEach((item, index) => {
        const row = document.createElement('tr');

        if (type === 'ingresos') {
            row.innerHTML = `
                <td>${item.fecha}</td>
                <td>${item.banco}</td>
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
                <td>${item.nombre || ''}</td>
                <td>${item.cuenta || ''}</td>
                <td>$${(item.saldo ? Number(item.saldo) : 0).toLocaleString()}</td>
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
    const totalIngresosElement = document.getElementById('totalIngresos');
    if (totalIngresosElement) {
        totalIngresosElement.textContent = '$' + totalIngresos.toLocaleString();
    }

    // Total Egresos
    const totalEgresos = systemData.egresos.reduce((sum, item) => sum + item.monto, 0);
    const totalEgresosElement = document.getElementById('totalEgresos');
    if (totalEgresosElement) {
        totalEgresosElement.textContent = '$' + totalEgresos.toLocaleString();
    }

    // Total Bancos
    const totalBancosElement = document.getElementById('totalBancos');
    if (totalBancosElement) {
        totalBancosElement.textContent = systemData.bancos.length;
    }

    // Total Proveedores
    const totalProveedoresElement = document.getElementById('totalProveedores');
    if (totalProveedoresElement) {
        totalProveedoresElement.textContent = systemData.proveedores.length;
    }
}

function updateSelectOptions() {
    // Update banco select in egresos form
    const bancoSelect = document.getElementById('egresoBanco');
    const bancoSelect2 = document.getElementById('ingresoBanco');
    if (bancoSelect) {
        bancoSelect.innerHTML = '<option value="">Seleccionar banco</option>';
        systemData.bancos.forEach(banco => {
            const option = document.createElement('option');
            option.value = banco.nombre;
            option.textContent = banco.nombre;
            bancoSelect.appendChild(option);
        });
    }
    if (bancoSelect2) {
        bancoSelect2.innerHTML = '<option value="">Seleccionar banco</option>';
        systemData.bancos.forEach(banco => {
            const option = document.createElement('option');
            option.value = banco.nombre;
            option.textContent = banco.nombre;
            bancoSelect2.appendChild(option);
        });
    }

    // Update proveedor select in egresos form
    const proveedorSelect = document.getElementById('egresoProveedor');
    if (proveedorSelect) {
        proveedorSelect.innerHTML = '<option value="">Seleccionar proveedor</option>';
        systemData.proveedores.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor.nombre;
            option.textContent = proveedor.nombre;
            proveedorSelect.appendChild(option);
        });
    }
}

// Form Event Listeners
function initializeFormListeners() {
    // Ingresos Form
    const ingresosForm = document.getElementById('ingresosForm');
    if (ingresosForm) {
        ingresosForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const fecha = document.getElementById('ingresoFecha').value;
            const banco = document.getElementById('ingresoBanco').value;
            const moneda = document.getElementById('ingresoMoneda').value;
            const monto = parseFloat(document.getElementById('ingresoMonto').value);
            const descripcion = document.getElementById('ingresoDescripcion').value;

            // Validación
            if (!fecha || !banco || !moneda || isNaN(monto) || !descripcion) {
                return;
            }

            const ingreso = { fecha, banco, moneda, monto, descripcion };
            systemData.ingresos.push(ingreso);
            saveData('ingresos', systemData.ingresos);
            loadTableData('ingresos');
            this.reset();
            document.getElementById('ingresoFecha').value = new Date().toISOString().split('T')[0];

            addMessage(`✅ Ingreso agregado: $${ingreso.monto.toLocaleString()} ${ingreso.moneda}`, 'assistant');
        });
    }

    // Egresos Form
    const egresosForm = document.getElementById('egresosForm');
    if (egresosForm) {
        egresosForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const fecha = document.getElementById('egresoFecha').value;
            const banco = document.getElementById('egresoBanco').value;
            const tipo = document.getElementById('egresoTipo').value;
            const monto = parseFloat(document.getElementById('egresoMonto').value);
            const proveedor = document.getElementById('egresoProveedor').value || '';
            const descripcion = document.getElementById('egresoDescripcion').value;

            // Validación
            if (!fecha || !banco || !tipo || isNaN(monto) || !descripcion) {
                return;
            }

            const egreso = { fecha, banco, tipo, monto, proveedor, descripcion };
            systemData.egresos.push(egreso);
            saveData('egresos', systemData.egresos);
            loadTableData('egresos');
            this.reset();
            document.getElementById('egresoFecha').value = new Date().toISOString().split('T')[0];
            document.getElementById('proveedorGroup').style.display = 'none';

            addMessage(`✅ Egreso agregado: $${egreso.monto.toLocaleString()} - ${egreso.tipo}`, 'assistant');
        });
    }

    // Bancos Form
    const bancosForm = document.getElementById('bancosForm');
    if (bancosForm) {
        bancosForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const nombre = document.getElementById('bancoNombre').value;
            const cuenta = document.getElementById('bancoCuenta').value;
            const saldo = parseFloat(document.getElementById('bancoSaldo').value);

            // Validación
            if (!nombre || !cuenta || isNaN(saldo)) {
                return;
            }

            const banco = { nombre, cuenta, saldo };
            systemData.bancos.push(banco);
            saveData('bancos', systemData.bancos);
            loadTableData('bancos');
            this.reset();

            addMessage(`✅ Banco agregado: ${banco.nombre}`, 'assistant');
        });
    }

    // Proveedores Form
    const proveedoresForm = document.getElementById('proveedoresForm');
    if (proveedoresForm) {
        proveedoresForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const nombre = document.getElementById('proveedorNombre').value;
            const contacto = document.getElementById('proveedorContacto').value;
            const telefono = document.getElementById('proveedorTelefono').value;
            const email = document.getElementById('proveedorEmail').value;

            // Validación
            if (!nombre || !contacto || !telefono || !email) {
                return;
            }

            const proveedor = { nombre, contacto, telefono, email };
            systemData.proveedores.push(proveedor);
            saveData('proveedores', systemData.proveedores);
            loadTableData('proveedores');
            this.reset();

            addMessage(`✅ Proveedor agregado: ${proveedor.nombre}`, 'assistant');
        });
    }

    // Egreso tipo change event
    const egresoTipo = document.getElementById('egresoTipo');
    if (egresoTipo) {
        egresoTipo.addEventListener('change', function () {
            const proveedorGroup = document.getElementById('proveedorGroup');
            const egresoProveedor = document.getElementById('egresoProveedor');

            if (proveedorGroup && egresoProveedor) {
                if (this.value === 'Abono a Proveedores') {
                    proveedorGroup.style.display = 'block';
                    egresoProveedor.required = true;
                } else {
                    proveedorGroup.style.display = 'none';
                    egresoProveedor.required = false;
                }
            }
        });
    }
}

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

// Make exportData globally available
window.exportData = exportData;

// AI Assistant Functions
function initializeAIAssistant() {
    const toggleChatBtn = document.getElementById("toggleChatBtn");
    const aiAssistant = document.getElementById("aiAssistant");
    const closeChatBtn = document.getElementById("closeChatBtn");
    const textInput = document.getElementById('textInput');

    function toggleAI() {
        aiAssistant.classList.toggle("visible");
        toggleChatBtn.classList.toggle("hidden");
    }

    if (toggleChatBtn && aiAssistant && closeChatBtn) {
        toggleChatBtn.addEventListener("click", toggleAI);
        closeChatBtn.addEventListener("click", toggleAI);

        // Opcional: cerrar si haces clic fuera del asistente
        document.addEventListener("click", (e) => {
            if (
                aiAssistant.classList.contains("visible") &&
                !aiAssistant.contains(e.target) &&
                !toggleChatBtn.contains(e.target)
            ) {
                aiAssistant.classList.remove("visible");
                toggleChatBtn.classList.remove("hidden");
            }
        });
    }

    // Text input enter key
    if (textInput) {
        textInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function addMessage(message, sender) {
    const chat = document.getElementById('aiChat');
    if (!chat) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${sender}`;
    messageDiv.innerHTML = message;
    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('textInput');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    setTimeout(() => {
        const response = processAICommand(message);
        addMessage(response, 'assistant');
    }, 1000);
}

// Make sendMessage globally available
window.sendMessage = sendMessage;

function processAICommand(message) {
    const lowerMessage = message.toLowerCase();

    // Financial reports
    if (lowerMessage.includes('finanzas') || lowerMessage.includes('balance') || lowerMessage.includes('resumen') || lowerMessage.includes('dinero') || lowerMessage.includes('ganancia')) {
        const totalIngresos = systemData.ingresos.reduce((sum, item) => sum + item.monto, 0);
        const totalEgresos = systemData.egresos.reduce((sum, item) => sum + item.monto, 0);
        const balance = totalIngresos - totalEgresos;

        return `💰 <strong>Resumen Financiero:</strong><br>
                • Total Ingresos: $${totalIngresos.toLocaleString()}<br>
                • Total Egresos: $${totalEgresos.toLocaleString()}<br>
                • Balance: $${balance.toLocaleString()}<br>
                • Estado: ${balance >= 0 ? '✅ Positivo' : '⚠️ Negativo'}<br>
                📊 Registros: ${systemData.ingresos.length} ingresos, ${systemData.egresos.length} egresos`;
    }

    // Sales report
    if (lowerMessage.includes('ventas') || lowerMessage.includes('sales')) {
        return `📊 <strong>Reporte de Ventas Hoy:</strong><br>
                • Total: $${systemData.sales.today.toLocaleString()}<br>
                • Clientes: ${systemData.sales.clients}<br>
                • Ticket promedio: $${systemData.sales.avgTicket.toFixed(2)}<br>
                • Variación: +${((systemData.sales.today - systemData.sales.yesterday) / systemData.sales.yesterday * 100).toFixed(1)}% vs ayer`;
    }

    // Inventory status
    if (lowerMessage.includes('inventario') || lowerMessage.includes('stock')) {
        const lowStock = systemData.inventory.filter(item => item.quantity < item.minStock);
        const totalProducts = systemData.inventory.length;
        const stockSummary = systemData.inventory.map(item =>
            `• ${item.name}: ${item.quantity} ${item.unit} ${item.quantity < item.minStock ? '⚠️' : '✅'}`
        ).join('<br>');

        return `📦 <strong>Estado del Inventario:</strong><br>
                • Total de productos: ${totalProducts}<br>
                • Productos con stock bajo: ${lowStock.length}<br>
                ${lowStock.length > 0 ? `• Críticos: ${lowStock.map(item => item.name).join(', ')}<br>` : ''}
                <br><strong>Detalle completo:</strong><br>
                ${stockSummary}<br>
                <br>💡 ${lowStock.length > 0 ? 'Recomiendo reabastecer productos marcados con ⚠️' : 'Todos los productos tienen stock adecuado'}`;
    }

    // Ingresos report
    if (lowerMessage.includes('ingresos')) {
        const totalIngresos = systemData.ingresos.reduce((sum, item) => sum + item.monto, 0);
        const promedioIngresos = systemData.ingresos.length > 0 ? totalIngresos / systemData.ingresos.length : 0;

        return `💰 <strong>Reporte de Ingresos:</strong><br>
                • Total: $${totalIngresos.toLocaleString()}<br>
                • Registros: ${systemData.ingresos.length}<br>
                • Promedio: $${promedioIngresos.toLocaleString()}<br>
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
            desglose += `• ${tipo}: $${monto.toLocaleString()}<br>`;
        });

        return `📤 <strong>Reporte de Egresos:</strong><br>
                • Total: $${totalEgresos.toLocaleString()}<br>
                • Registros: ${systemData.egresos.length}<br>
                <br><strong>Por tipo:</strong><br>
                ${desglose}`;
    }

    // Bancos status
    if (lowerMessage.includes('bancos') || lowerMessage.includes('cuentas')) {
        const totalSaldo = systemData.bancos.reduce((sum, banco) => sum + banco.saldo, 0);
        let bancosList = '';
        systemData.bancos.forEach(banco => {
            bancosList += `• ${banco.nombre}: $${banco.saldo.toLocaleString()}<br>`;
        });

        return `🏦 <strong>Estado de Bancos:</strong><br>
                • Total bancos: ${systemData.bancos.length}<br>
                • Saldo total: $${totalSaldo.toLocaleString()}<br>
                <br><strong>Detalle:</strong><br>
                ${bancosList || 'No hay bancos registrados'}`;
    }

    // Proveedores status
    if (lowerMessage.includes('proveedores')) {
        let proveedoresList = '';
        systemData.proveedores.forEach(proveedor => {
            proveedoresList += `• ${proveedor.nombre} - ${proveedor.contacto}<br>`;
        });

        return `🏪 <strong>Proveedores Registrados:</strong><br>
                • Total: ${systemData.proveedores.length}<br>
                <br><strong>Lista:</strong><br>
                ${proveedoresList || 'No hay proveedores registrados'}`;
    }

    // Staff status
    if (lowerMessage.includes('personal') || lowerMessage.includes('empleados') || lowerMessage.includes('staff')) {
        return `👥 <strong>Estado del Personal:</strong><br>
                • Empleados activos: ${systemData.staff.active}/${systemData.staff.total}<br>
                • Ausentes hoy: ${systemData.staff.absent.length > 0 ? systemData.staff.absent.join(', ') : 'Ninguno'}<br>
                • Tasa de asistencia: ${(systemData.staff.active / systemData.staff.total * 100).toFixed(1)}%<br>
                • Estado: ${systemData.staff.active >= systemData.staff.total * 0.8 ? '✅ Óptimo' : '⚠️ Requiere atención'}`;
    }

    // Help command
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
        return `🤖 <strong>Comandos Disponibles:</strong><br><br>
                💰 <em>"¿Cómo van las finanzas?"</em> - Resumen financiero<br>
                📈 <em>"Reporte de ingresos"</em> - Estado de ingresos<br>
                📤 <em>"¿Cómo van los egresos?"</em> - Análisis de gastos<br>
                🏦 <em>"Estado de bancos"</em> - Información bancaria<br>
                🏪 <em>"Lista de proveedores"</em> - Proveedores registrados<br>
                📊 <em>"¿Cómo van las ventas?"</em> - Reporte de ventas<br>
                📦 <em>"¿Cómo está el inventario?"</em> - Estado del stock<br>
                👥 <em>"¿Cómo está el personal?"</em> - Información de empleados<br><br>
                💡 <strong>Tip:</strong> Puedes preguntar sobre cualquier aspecto de tu negocio.`;
    }

    // Default response
    return `🤖 Entiendo que preguntas sobre: "${message}"<br><br>
            Puedo ayudarte con información sobre:<br>
            💰 Finanzas • 📈 Ingresos • 📤 Egresos<br>
            🏦 Bancos • 🏪 Proveedores • 📊 Ventas<br>
            📦 Inventario • 👥 Personal<br><br>
            💡 Escribe "ayuda" para ver todos los comandos disponibles.`;
}

// Stepper functionality for graficas.html
function showStep(index) {
    const steps = document.querySelectorAll('.step');
    const contents = document.querySelectorAll('.step-content');

    if (steps.length > 0 && contents.length > 0) {
        steps.forEach((step, i) => {
            step.classList.toggle('active', i === index);
        });

        contents.forEach((content, i) => {
            content.style.display = i === index ? 'block' : 'none';
        });
    }
}

// Make showStep globally available
window.showStep = showStep;

// Update mobile detection on resize
window.addEventListener('resize', function () {
    isMobile = window.innerWidth <= 768;
});

// Google Sheets Functions (keeping for future use)
async function loadDataFromGoogleSheets() {
    try {
        const inventoryData = await fetchGoogleSheetData(GOOGLE_SHEETS_CONFIG.INVENTORY_RANGE);
        const salesData = await fetchGoogleSheetData(GOOGLE_SHEETS_CONFIG.SALES_RANGE);
        const staffData = await fetchGoogleSheetData(GOOGLE_SHEETS_CONFIG.STAFF_RANGE);

        if (inventoryData && inventoryData.values) {
            systemData.inventory = parseInventoryData(inventoryData.values);
        }

        if (salesData && salesData.values) {
            systemData.sales = parseSalesData(salesData.values);
        }

        if (staffData && staffData.values) {
            systemData.staff = parseStaffData(staffData.values);
        }

        addMessage('✅ Datos actualizados desde Google Sheets', 'assistant');

    } catch (error) {
        console.error('Error loading data from Google Sheets:', error);
        addMessage('❌ Error al cargar datos de Google Sheets. Usando datos locales.', 'assistant');
    }
}

async function fetchGoogleSheetData(range) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}/values/${range}?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

function parseInventoryData(values) {
    const inventory = [];
    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row.length >= 6) {
            inventory.push({
                id: parseInt(row[0]) || i,
                name: row[1] || '',
                quantity: parseFloat(row[2]) || 0,
                unit: row[3] || '',
                minStock: parseFloat(row[4]) || 0,
                supplier: row[5] || ''
            });
        }
    }
    return inventory;
}

function parseSalesData(values) {
    if (values.length > 1) {
        const row = values[1];
        return {
            today: parseFloat(row[1]) || 0,
            yesterday: parseFloat(row[2]) || 0,
            clients: parseInt(row[3]) || 0,
            avgTicket: parseFloat(row[4]) || 0
        };
    }
    return systemData.sales;
}

function parseStaffData(values) {
    if (values.length > 1) {
        const row = values[1];
        const absent = [];
        for (let i = 2; i < row.length; i++) {
            if (row[i] && row[i].trim()) {
                absent.push(row[i].trim());
            }
        }

        return {
            active: parseInt(row[0]) || 0,
            total: parseInt(row[1]) || 0,
            absent: absent
        };
    }
    return systemData.staff;
}

// Main initialization function
function initializeSystem() {
    // Load navbar first
    loadNavbar();

    // Check if user is logged in
    const isLoggedIn = checkSession();

    // Initialize login form if present
    initializeLogin();

    // Initialize date display
    initializeDate();

    // If we're on a page that needs to be logged in and user is not logged in
    const hasLoginScreen = document.getElementById('loginScreen');
    const hasDashboard = document.getElementById('dashboard');

    if (hasLoginScreen && hasDashboard) {
        // This is the main index page
        if (!isLoggedIn) {
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
        } else {
            showDashboard();
        }
    } else if (!hasLoginScreen && !isLoggedIn) {
        // This is a secondary page (like graficas.html) and user is not logged in
        window.location.href = 'index.html';
    } else {
        // User is logged in and we're on a secondary page
        initializeFormListeners();
        initializeAIAssistant();
    }
}

// Voice Recognition (Simulated)
function toggleVoice() {
    const btn = document.getElementById('voiceBtn');
    const status = document.getElementById('aiStatus');

    if (!isRecording) {
        isRecording = true;
        if (btn) {
            btn.classList.add('recording');
            btn.textContent = '🔴 Grabando... (suelta para enviar)';
        }
        if (status) {
            status.textContent = 'Escuchando...';
        }

        setTimeout(() => {
            if (isRecording) {
                stopRecording();
                const simulatedCommands = [
                    '¿Cómo van las ventas hoy?',
                    '¿Cuál es el estado del inventario?',
                    '¿Cuántos empleados están trabajando?',
                    '¿Cómo van las finanzas?',
                    'Reporte de ingresos'
                ];
                const command = simulatedCommands[Math.floor(Math.random() * simulatedCommands.length)];
                const textInput = document.getElementById('textInput');
                if (textInput) {
                    textInput.value = command;
                    sendMessage();
                }
            }
        }, 2000);
    } else {
        stopRecording();
    }
}

function stopRecording() {
    isRecording = false;
    const btn = document.getElementById('voiceBtn');
    const status = document.getElementById('aiStatus');

    if (btn) {
        btn.classList.remove('recording');
        btn.textContent = '🎤 Mantén presionado para hablar';
    }
    if (status) {
        status.textContent = 'Listo para consultas';
    }
}

// Voice button events
function initializeVoiceControls() {
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
        voiceBtn.addEventListener('mousedown', toggleVoice);
        voiceBtn.addEventListener('mouseup', function () {
            if (isRecording) {
                setTimeout(stopRecording, 100);
            }
        });

        // Touch events for mobile
        voiceBtn.addEventListener('touchstart', function (e) {
            e.preventDefault();
            toggleVoice();
        });

        voiceBtn.addEventListener('touchend', function (e) {
            e.preventDefault();
            if (isRecording) {
                setTimeout(stopRecording, 100);
            }
        });
    }
}

// Auto-refresh data every 5 minutes (for Google Sheets)
function startAutoRefresh() {
    setInterval(function () {
        if (typeof loadDataFromGoogleSheets === 'function') {
            loadDataFromGoogleSheets();
            console.log('Auto-refreshing data from Google Sheets...');
        }
    }, 300000); // 5 minutes
}

const ctx = document.getElementById('comboTimeChart').getContext('2d');

// Valores de ejemplo (pon aquí los totales del día)
const totalIngresosHoy = 12450;
const totalEgresosHoy = 9800;

const comboTimeChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Ingresos', 'Egresos'],
        datasets: [
            {
                label: 'Ingresos',
                data: [totalIngresosHoy, 0],
                backgroundColor: '#1abc9c',
                borderRadius: 8,
                barPercentage: 0.7,
                categoryPercentage: 0.6
            },
            {
                label: 'Egresos',
                data: [0, totalEgresosHoy],
                backgroundColor: '#e74c3c',
                borderRadius: 8,
                barPercentage: 0.7,
                categoryPercentage: 0.6
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
            x: {
                ticks: { color: '#fff' },
                grid: { color: '#333' }
            },
            y: {
                beginAtZero: true,
                ticks: { color: '#fff' },
                grid: { color: '#333' }
            }
        },
        plugins: {
            legend: {
                labels: { color: '#fff' }
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const v = ctx.parsed.y ?? ctx.parsed.x;
                        return `${ctx.dataset.label}: ${v.toLocaleString()}`;
                    }
                }
            }
        }
    }
});

const pieEmitidas = document.getElementById('pieChartEmitidas');
const pieRecibidas = document.getElementById('pieChartRecibidas');

const pieColors = ['#00b894', '#0984e3', '#6c5ce7'];
const borderColor = '#2d3436';

const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.6,
    devicePixelRatio: window.devicePixelRatio || 1,
    plugins: {
        legend: {
            position: 'top',
            align: 'center',
            labels: {
                color: '#fff',
                font: { size: 14, weight: 'bold' },
                padding: 18,
                boxWidth: 14
            }
        },
        datalabels: {
            color: '#fff',
            formatter: (value, context) => {
                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = (value / total * 100).toFixed(1);
                return `${percentage}%`;
            },
            font: { weight: 'bold', size: 13 }
        }
    },
    animation: {
        animateScale: true,
        animateRotate: true
    },
    interaction: {
        mode: 'nearest',
        intersect: true
    },
    hover: {
        mode: 'nearest',
        intersect: true
    }
};

if (pieEmitidas) {
    new Chart(pieEmitidas, {
        type: 'pie',
        data: {
            labels: ['Socios', 'Clientes', 'Inversionistas'],
            datasets: [{
                label: 'Facturas Emitidas',
                data: [10, 70, 20],
                backgroundColor: pieColors,
                borderColor: borderColor,
                borderWidth: 2
            }]
        },
        options: pieOptions,
        plugins: [ChartDataLabels]
    });
}

if (pieRecibidas) {
    new Chart(pieRecibidas, {
        type: 'pie',
        data: {
            labels: ['Socios', 'Reponer Inventario', 'Facturas'],
            datasets: [{
                label: 'Facturas Recibidas',
                data: [25, 40, 35],
                backgroundColor: pieColors,
                borderColor: borderColor,
                borderWidth: 2
            }]
        },
        options: pieOptions,
        plugins: [ChartDataLabels]
    });
}

const barCtx = document.getElementById('barChart').getContext('2d');

const barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
        labels: ['Articulo 1', ' Articulo 2', 'Articulo 3', 'Articulo 4'],
        datasets: [{
            label: 'Cantidad vendida',
            data: [120, 95, 85, 60],
            backgroundColor: [
                '#1abc9c',
                '#3498db',
                '#9b59b6',
                '#e67e22'
            ],
            borderRadius: 8,
            barThickness: 25
        }]
    },
    options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        scales: {
            x: {
                ticks: { color: '#fff' },
                grid: { color: '#333' }
            },
            y: {
                ticks: { color: '#fff' },
                grid: { color: '#333' }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.parsed.x} unidades`
                }
            },
            title: {
                display: true,
                text: 'Productos más vendidos',
                color: '#fff',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            }
        }
    }
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeSystem();
    initializeVoiceControls();
    startAutoRefresh();

    console.log('Sistema de Administración Inicializado');
    console.log('Características: Gestión de ingresos, egresos, bancos y proveedores');
});