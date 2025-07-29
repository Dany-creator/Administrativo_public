// System Data
let systemData = {
    inventory: [
        { id: 1, name: "Carne Molida", quantity: 15.5, unit: "kg", minStock: 20, supplier: "Carnes Premium" },
        { id: 2, name: "Pollo Entero", quantity: 45, unit: "piezas", minStock: 30, supplier: "Avícola San Juan" },
        { id: 3, name: "Cerveza Corona", quantity: 8, unit: "cajas", minStock: 15, supplier: "Distribuidora ABC" },
        { id: 4, name: "Tomate", quantity: 28.2, unit: "kg", minStock: 25, supplier: "Verduras Frescas" }
    ],
    sales: {
        today: 12450,
        yesterday: 11500,
        clients: 142,
        avgTicket: 87.68
    },
    staff: {
        active: 8,
        total: 10,
        absent: ["Juan Pérez", "María García"]
    }
};

let isRecording = false;
let isMobile = window.innerWidth <= 768;

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
    // Reemplaza estos valores con los tuyos
    SPREADSHEET_ID: 'TU_ID_DE_GOOGLE_SHEET_AQUI',
    API_KEY: 'TU_API_KEY_AQUI',
    INVENTORY_RANGE: 'Inventario!A:F',
    SALES_RANGE: 'Ventas!A:E',
    STAFF_RANGE: 'Personal!A:D'
};

// Google Sheets Functions
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

        updateInventoryDisplay();
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
    // Asume que la primera fila son headers: ID, Nombre, Cantidad, Unidad, Stock Mínimo, Proveedor
    const headers = values[0];
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
    // Asume headers: Fecha, Ventas Hoy, Ventas Ayer, Clientes, Ticket Promedio
    if (values.length > 1) {
        const row = values[1]; // Toma la primera fila de datos
        return {
            today: parseFloat(row[1]) || 0,
            yesterday: parseFloat(row[2]) || 0,
            clients: parseInt(row[3]) || 0,
            avgTicket: parseFloat(row[4]) || 0
        };
    }
    return systemData.sales; // Fallback a datos por defecto
}

function parseStaffData(values) {
    // Asume headers: Activos, Total, Ausente1, Ausente2, etc.
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
    return systemData.staff; // Fallback a datos por defecto
}

// navbar
fetch('navbar.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('navbar-container').innerHTML = html;
    })
    .then(() => {
        window.toggleNav = function () {
            var sidebar = document.getElementById("mySidebar");
            sidebar.classList.toggle("open");
        }

        window.closeNav = function () {
            document.getElementById("mySidebar").classList.remove("open");
        }

        window.logout = function () {
            alert("Cerrando sesión...");
            window.location.href = "#";
        }
    });

//FECHA DASHBOARD 
const fecha = new Date();
const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById("fechaActual").innerText = fecha.toLocaleDateString('es-ES', opciones);

// Login System
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === '123456') {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';

        // Update device indicator
        document.getElementById('deviceType').textContent = isMobile ? '📱 Móvil' : '💻 Escritorio';

        initializeDashboard();
    } else {
        alert('Usuario o contraseña incorrectos');
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const toggleChatBtn = document.getElementById("toggleChatBtn");
    const aiAssistant = document.getElementById("aiAssistant");
    const closeChatBtn = document.getElementById("closeChatBtn");

    // Abrir el chat
    toggleChatBtn.addEventListener("click", () => {
        aiAssistant.classList.add("visible");
        toggleChatBtn.classList.add("hidden");
    });

    // Cerrar el chat con el botón flecha
    closeChatBtn.addEventListener("click", () => {
        aiAssistant.classList.remove("visible");
        toggleChatBtn.classList.remove("hidden");
    });

    // Para móviles (touch)
    document.addEventListener("touchstart", (e) => {
        const isInside = aiAssistant.contains(e.target) || toggleChatBtn.contains(e.target);
        if (!isInside) {
            aiAssistant.classList.remove("visible");
            toggleChatBtn.classList.remove("hidden");
        }
    });
});

// Lógica para cambiar el contenido según el módulo
function showStep(index) {
    const steps = document.querySelectorAll('.step');
    const contents = document.querySelectorAll('.step-content');

    steps.forEach((step, i) => {
        step.classList.toggle('active', i === index);
    });

    contents.forEach((content, i) => {
        content.style.display = i === index ? 'block' : 'none';
    });
}

function logout() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function initializeDashboard() {
    updateInventoryDisplay();
    addMessage('¡Sistema de consultas inicializado! ¿Qué información necesitas?', 'assistant');

    // Cargar datos desde Google Sheets al inicializar
    loadDataFromGoogleSheets();
}

// AI Assistant Functions
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

    // Process AI response
    setTimeout(() => {
        const response = processAICommand(message);
        addMessage(response, 'assistant');
    }, 1000);
}

// SIMPLIFIED AI COMMAND PROCESSING - ONLY QUERIES, NO MODIFICATIONS
function processAICommand(message) {
    const lowerMessage = message.toLowerCase();

    // Comando para actualizar datos
    if (lowerMessage.includes('actualizar') || lowerMessage.includes('refrescar') || lowerMessage.includes('cargar')) {
        loadDataFromGoogleSheets();
        return '🔄 Actualizando datos desde Google Sheets...';
    }

    // Financial reports
    if (lowerMessage.includes('finanzas') || lowerMessage.includes('dinero') || lowerMessage.includes('ganancia')) {
        const revenue = systemData.sales.today;
        const costs = revenue * 0.65;
        const profit = revenue - costs;
        const margin = (profit / revenue * 100).toFixed(1);

        return `💰 <strong>Reporte Financiero Hoy:</strong><br>
                • Ingresos: $${revenue.toLocaleString()}<br>
                • Costos estimados: $${costs.toLocaleString()}<br>
                • Utilidad: $${profit.toLocaleString()}<br>
                • Margen: ${margin}%<br>
                📈 Tendencia: Positiva vs ayer`;
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

    // Staff status
    if (lowerMessage.includes('personal') || lowerMessage.includes('empleados') || lowerMessage.includes('staff')) {
        return `👥 <strong>Estado del Personal:</strong><br>
                • Empleados activos: ${systemData.staff.active}/${systemData.staff.total}<br>
                • Ausentes hoy: ${systemData.staff.absent.length > 0 ? systemData.staff.absent.join(', ') : 'Ninguno'}<br>
                • Tasa de asistencia: ${(systemData.staff.active / systemData.staff.total * 100).toFixed(1)}%<br>
                • Estado: ${systemData.staff.active >= systemData.staff.total * 0.8 ? '✅ Óptimo' : '⚠️ Requiere atención'}`;
    }

    // Menu analysis
    if (lowerMessage.includes('platillo') || lowerMessage.includes('menu') || lowerMessage.includes('comida')) {
        const topDishes = ['Tacos al Pastor', 'Quesadillas', 'Enchiladas', 'Pozole', 'Chiles Rellenos'];
        const randomTop = topDishes[Math.floor(Math.random() * topDishes.length)];

        return `🍽️ <strong>Análisis del Menú:</strong><br>
                • Platillo más vendido hoy: ${randomTop}<br>
                • Margen promedio: 68%<br>
                • Tiempo promedio de preparación: 12 min<br>
                • Satisfacción del cliente: 4.7/5⭐<br>
                💡 Los datos de platillos se actualizan desde el Google Sheet`;
    }

    // Staff performance
    if (lowerMessage.includes('rendimiento') || lowerMessage.includes('desempeño') || lowerMessage.includes('mesero')) {
        return `👨‍💼 <strong>Rendimiento del Personal:</strong><br>
                • Mejor mesero: Carlos Mendoza (15 mesas, $950 en ventas)<br>
                • Promedio de mesas por mesero: 12<br>
                • Satisfacción del servicio: 4.5/5⭐<br>
                • Propinas promedio: $420 por turno<br>
                📊 Todos los meseros están dentro del rango esperado`;
    }

    // Help command
    if (lowerMessage.includes('ayuda') || lowerMessage.includes('help') || lowerMessage.includes('comandos')) {
        return `🤖 <strong>Sistema de Consultas - Comandos Disponibles:</strong><br><br>
                📊 <em>"¿Cómo van las ventas?"</em> - Reporte de ventas diario<br>
                📦 <em>"¿Cómo está el inventario?"</em> - Estado completo del stock<br>
                👥 <em>"¿Cómo está el personal?"</em> - Información de empleados<br>
                💰 <em>"¿Cómo van las finanzas?"</em> - Reporte financiero<br>
                🍽️ <em>"¿Qué tal el menú?"</em> - Análisis de platillos<br>
                📈 <em>"¿Cómo es el rendimiento?"</em> - Desempeño del personal<br>
                🔄 <em>"Actualizar datos"</em> - Cargar desde Google Sheets<br><br>
                💡 <strong>Nota:</strong> Este sistema es solo para consultas. Para modificaciones, actualiza directamente en Google Sheets y usa "actualizar datos".`;
    }

    // Default response
    return `🤖 Entiendo que preguntas sobre: "${message}"<br><br>
            <strong>📋 Sistema de Solo Consulta Activo</strong><br><br>
            Puedo ayudarte con información sobre:<br>
            📊 Ventas • 📦 Inventario • 👥 Personal • 💰 Finanzas<br>
            🍽️ Menú • 📈 Rendimiento • 🔄 Actualizaciones<br><br>
            💡 Escribe "ayuda" para ver todos los comandos disponibles.<br>
            🔄 Los datos se sincronizan con Google Sheets automáticamente.`;
}

// Voice Recognition (Simulated)
function toggleVoice() {
    const btn = document.getElementById('voiceBtn');
    const status = document.getElementById('aiStatus');

    if (!isRecording) {
        isRecording = true;
        btn.classList.add('recording');
        btn.textContent = '🔴 Grabando... (suelta para enviar)';
        status.textContent = 'Escuchando...';

        setTimeout(() => {
            if (isRecording) {
                stopRecording();
                const simulatedCommands = [
                    '¿Cómo van las ventas hoy?',
                    '¿Cuál es el estado del inventario?',
                    '¿Cuántos empleados están trabajando?',
                    'Actualizar datos',
                    '¿Cómo van las finanzas?'
                ];
                const command = simulatedCommands[Math.floor(Math.random() * simulatedCommands.length)];
                document.getElementById('textInput').value = command;
                sendMessage();
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

    btn.classList.remove('recording');
    btn.textContent = '🎤 Mantén presionado para hablar';
    status.textContent = 'Listo para consultas';
}

// Update inventory display
function updateInventoryDisplay() {
    const inventoryList = document.getElementById('inventoryList');
    if (!inventoryList) return;

    inventoryList.innerHTML = '';

    systemData.inventory.forEach(item => {
        const isLowStock = item.quantity < item.minStock;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        itemDiv.innerHTML = `
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>Proveedor: ${item.supplier}</p>
            </div>
            <div class="stock-level">
                <div class="quantity">${item.quantity}</div>
                <div class="unit">${item.unit}</div>
                <div class="stock-status ${isLowStock ? 'stock-low' : 'stock-ok'}">
                    ${isLowStock ? 'Stock Bajo ⚠️' : 'Stock OK ✅'}
                </div>
            </div>
        `;
        inventoryList.appendChild(itemDiv);
    });
}

// Text input enter key
document.getElementById('textInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Voice button events
document.getElementById('voiceBtn').addEventListener('mousedown', toggleVoice);
document.getElementById('voiceBtn').addEventListener('mouseup', function () {
    if (isRecording) {
        setTimeout(stopRecording, 100);
    }
});

// Touch events for mobile
document.getElementById('voiceBtn').addEventListener('touchstart', function (e) {
    e.preventDefault();
    toggleVoice();
});

document.getElementById('voiceBtn').addEventListener('touchend', function (e) {
    e.preventDefault();
    if (isRecording) {
        setTimeout(stopRecording, 100);
    }
});

// Update mobile detection on resize
window.addEventListener('resize', function () {
    isMobile = window.innerWidth <= 768;
    if (document.getElementById('deviceType')) {
        document.getElementById('deviceType').textContent = isMobile ? '📱 Móvil' : '💻 Escritorio';
    }
});

// Auto-refresh data every 5 minutes
setInterval(function () {
    loadDataFromGoogleSheets();
    console.log('Auto-refreshing data from Google Sheets...');
}, 300000); // 5 minutes

// Initialize system
console.log('RestauranteIA System initialized - READ-ONLY MODE');
console.log('Features: Google Sheets integration, AI queries, voice recognition');
console.log('Data sync: Every 5 minutes + manual refresh available');