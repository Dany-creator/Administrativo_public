// System Data Storage
let systemData = {
    ingresos: [],
    egresos: [],
    bancos: [],
    proveedores: [],
    inventory: [],
    sales: {},
    staff: {}
};

let isRecording = false;
let isMobile = window.innerWidth <= 768;

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
    SPREADSHEET_ID: '1zh5En4C6KyTajqt50pXTUQVuzxMTBOninxqLMngJngU',
    API_KEY: 'AIzaSyBXOXiYxqiO_vwxcXMRFxDimjDQ1_GO-xI',
};

async function saveToGoogleSheet(sheetName, rowData) {
    const apiUrl = 'http://127.0.0.1:5000/add?sheet=' + sheetName; // Cambia la IP si usas otro servidor
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(rowData),
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.status === "OK") {
            addMessage('✅ Datos guardados en Google Sheets', 'assistant');
        } else {
            addMessage('❌ Error al guardar en Google Sheets: ' + (result.error || ''), 'assistant');
        }
    } catch (error) {
        addMessage('❌ Error de conexión con el backend Python', 'assistant');
    }
}

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
    const content = document.getElementById(cardName + '-content');
    const header = content ? content.previousElementSibling : null;
    const isActive = content && content.classList.contains('active');

    // Cierra todas las cards
    const allContents = document.querySelectorAll('.card-content');
    const allHeaders = document.querySelectorAll('.card-header');
    allContents.forEach(c => c.classList.remove('active'));
    allHeaders.forEach(h => h.classList.remove('active'));

    // Si no estaba activa, ábrela; si estaba activa, déjala cerrada
    if (!isActive && content) {
        content.classList.add('active');
        if (header) header.classList.add('active');
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
        ingresosForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const fecha = document.getElementById('ingresoFecha').value;
            const banco = document.getElementById('ingresoBanco').value;
            const moneda = document.getElementById('ingresoMoneda').value;
            const monto = parseFloat(document.getElementById('ingresoMonto').value);
            const descripcion = document.getElementById('ingresoDescripcion').value;

            if (!fecha || !banco || !moneda || isNaN(monto) || !descripcion) {
                alert('Por favor, completa todos los campos de ingreso.');
                return;
            }

            const ingreso = [fecha, banco, moneda, monto, descripcion];
            await saveToGoogleSheet('Ingresos', ingreso);
            loadDataFromGoogleSheets();
            this.reset();
            document.getElementById('ingresoFecha').value = new Date().toISOString().split('T')[0];
        });
    }

    // Egresos Form
    const egresosForm = document.getElementById('egresosForm');
    if (egresosForm) {
        egresosForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const fecha = document.getElementById('egresoFecha').value;
            const banco = document.getElementById('egresoBanco').value;
            const tipo = document.getElementById('egresoTipo').value;
            const monto = parseFloat(document.getElementById('egresoMonto').value);
            const proveedor = document.getElementById('egresoProveedor').value || '';
            const descripcion = document.getElementById('egresoDescripcion').value;

            if (!fecha || !banco || !tipo || isNaN(monto) || !descripcion) {
                alert('Por favor, completa todos los campos de egreso.');
                return;
            }

            const egreso = [fecha, banco, tipo, monto, proveedor, descripcion];
            await saveToGoogleSheet('Egresos', egreso);
            loadDataFromGoogleSheets();
            this.reset();
            document.getElementById('egresoFecha').value = new Date().toISOString().split('T')[0];
            document.getElementById('proveedorGroup').style.display = 'none';
        });
    }

    // Bancos Form
    const bancosForm = document.getElementById('bancosForm');
    if (bancosForm) {
        bancosForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const nombre = document.getElementById('bancoNombre').value;
            const cuenta = document.getElementById('bancoCuenta').value;
            const saldo = parseFloat(document.getElementById('bancoSaldo').value);

            if (!nombre || !cuenta || isNaN(saldo)) {
                alert('Por favor, completa todos los campos de banco.');
                return;
            }

            const banco = [nombre, cuenta, saldo];
            await saveToGoogleSheet('Bancos', banco);
            loadDataFromGoogleSheets();
            this.reset();
        });
    }

    // Proveedores Form
    const proveedoresForm = document.getElementById('proveedoresForm');
    if (proveedoresForm) {
        proveedoresForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const nombre = document.getElementById('proveedorNombre').value;
            const contacto = document.getElementById('proveedorContacto').value;
            const telefono = document.getElementById('proveedorTelefono').value;
            const email = document.getElementById('proveedorEmail').value;

            if (!nombre || !contacto || !telefono || !email) {
                alert('Por favor, completa todos los campos de proveedor.');
                return;
            }

            const proveedor = [nombre, contacto, telefono, email];
            await saveToGoogleSheet('Proveedores', proveedor);
            loadDataFromGoogleSheets();
            this.reset();
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

    document.addEventListener('DOMContentLoaded', function () {
        loadDataFromGoogleSheets();
        initializeSystem();
        initializeVoiceControls();
        startAutoRefresh();
        console.log('Sistema de Administración Inicializado');
    });

    try {
        // Cargar cada pestaña
        const ingresosData = await fetchGoogleSheetData('Ingresos!A:E');
        const egresosData = await fetchGoogleSheetData('Egresos!A:F');
        const bancosData = await fetchGoogleSheetData('Bancos!A:C');
        const proveedoresData = await fetchGoogleSheetData('Proveedores!A:D');

        // Parsear y guardar en systemData
        if (ingresosData && ingresosData.values) {
            systemData.ingresos = parseIngresosData(ingresosData.values);
        }
        if (egresosData && egresosData.values) {
            systemData.egresos = parseEgresosData(egresosData.values);
        }
        if (bancosData && bancosData.values) {
            systemData.bancos = parseBancosData(bancosData.values);
        }
        if (proveedoresData && proveedoresData.values) {
            systemData.proveedores = parseProveedoresData(proveedoresData.values);
        }

        addMessage('✅ Datos actualizados desde Google Sheets', 'assistant');
        // Actualiza la UI
        loadAllData();
        updateSummaryCards();
        updateSelectOptions();
        updateComboTimeChart();

    } catch (error) {
        console.error('Error loading data from Google Sheets:', error);
        addMessage('❌ Error al cargar datos de Google Sheets. Usando datos locales.', 'assistant');
    }
}

function parseIngresosData(values) {
    const ingresos = [];
    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row.length >= 5) {
            ingresos.push({
                fecha: row[0] || '',
                banco: row[1] || '',
                moneda: row[2] || '',
                monto: parseFloat(row[3]) || 0,
                descripcion: row[4] || ''
            });
        }
    }
    return ingresos;
}

function parseEgresosData(values) {
    const egresos = [];
    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row.length >= 6) {
            egresos.push({
                fecha: row[0] || '',
                banco: row[1] || '',
                tipo: row[2] || '',
                monto: parseFloat(row[3]) || 0,
                proveedor: row[4] || '',
                descripcion: row[5] || ''
            });
        }
    }
    return egresos;
}

function parseBancosData(values) {
    const bancos = [];
    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row.length >= 3) {
            bancos.push({
                nombre: row[0] || '',
                cuenta: row[1] || '',
                saldo: parseFloat(row[2]) || 0
            });
        }
    }
    return bancos;
}

function parseProveedoresData(values) {
    const proveedores = [];
    for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row.length >= 4) {
            proveedores.push({
                nombre: row[0] || '',
                contacto: row[1] || '',
                telefono: row[2] || '',
                email: row[3] || ''
            });
        }
    }
    return proveedores;
}

async function fetchGoogleSheetData(range) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID}/values/${range}?key=${GOOGLE_SHEETS_CONFIG.API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
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

let comboTimeChartInstance = null;

function updateComboTimeChart() {
    const totalIngresosHoy = systemData.ingresos
        .filter(item => item.fecha === new Date().toISOString().split('T')[0])
        .reduce((sum, item) => sum + item.monto, 0);

    const totalEgresosHoy = systemData.egresos
        .filter(item => item.fecha === new Date().toISOString().split('T')[0])
        .reduce((sum, item) => sum + item.monto, 0);

    const ctx = document.getElementById('comboTimeChart').getContext('2d');

    const chartData = {
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
    };

    const chartOptions = {
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
    };

    // Destruye el gráfico anterior si existe
    if (comboTimeChartInstance) {
        comboTimeChartInstance.destroy();
        comboTimeChartInstance = null;
    }

    comboTimeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    loadDataFromGoogleSheets();
    initializeSystem();
    initializeVoiceControls();
    startAutoRefresh();

    console.log('Sistema de Administración Inicializado');
    console.log('Características: Gestión de ingresos, egresos, bancos y proveedores');
});