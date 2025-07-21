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
let pendingAction = null;

// navbar



fetch('navbar.html')
  .then(response => response.text())
  .then(html => {
    document.getElementById('navbar-container').innerHTML = html;
  })
  .then(() => {
   
    window.toggleNav = function() {
      var sidebar = document.getElementById("mySidebar");
      sidebar.classList.toggle("open");
    }

    window.closeNav = function() {
      document.getElementById("mySidebar").classList.remove("open");
    }

    window.logout = function() {
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
    addMessage('¡Sistema inicializado! ¿En qué puedo ayudarte?', 'assistant');
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

function processAICommand(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('ventas') || lowerMessage.includes('sales')) {
        return `📊 <strong>Reporte de Ventas Hoy:</strong><br>
                       • Total: $${systemData.sales.today.toLocaleString()}<br>
                       • Clientes: ${systemData.sales.clients}<br>
                       • Ticket promedio: $${systemData.sales.avgTicket}<br>
                       • Variación: +${((systemData.sales.today - systemData.sales.yesterday) / systemData.sales.yesterday * 100).toFixed(1)}% vs ayer`;
    }

    if (lowerMessage.includes('inventario') || lowerMessage.includes('stock')) {
        const lowStock = systemData.inventory.filter(item => item.quantity < item.minStock);
        return `📦 <strong>Estado del Inventario:</strong><br>
                       • Total de productos: ${systemData.inventory.length}<br>
                       • Productos con stock bajo: ${lowStock.length}<br>
                       • Críticos: ${lowStock.map(item => item.name).join(', ')}<br>
                       💡 Recomiendo reabastecer pronto.`;
    }

    if (lowerMessage.includes('personal') || lowerMessage.includes('empleados')) {
        return `👥 <strong>Estado del Personal:</strong><br>
                       • Empleados activos: ${systemData.staff.active}/${systemData.staff.total}<br>
                       • Ausentes hoy: ${systemData.staff.absent.join(', ')}<br>
                       • Tasa de asistencia: ${(systemData.staff.active / systemData.staff.total * 100).toFixed(1)}%`;
    }

    // Modification commands (only on desktop)
    if (lowerMessage.includes('agregar') || lowerMessage.includes('añadir')) {
        if (isMobile) {
            return '📱 Las modificaciones solo están disponibles desde escritorio. Puedes consultar datos desde aquí.';
        }

        // Parse add command
        const matches = lowerMessage.match(/agregar (\d+(?:\.\d+)?)\s*(\w+)?\s*de?\s*(.+)/);
        if (matches) {
            const quantity = parseFloat(matches[1]);
            const unit = matches[2] || '';
            const itemName = matches[3];

            pendingAction = {
                type: 'add_inventory',
                item: itemName,
                quantity: quantity,
                unit: unit
            };

            showConfirmation(`¿Agregar ${quantity} ${unit} de ${itemName} al inventario?`);
            return 'Esperando confirmación para agregar al inventario...';
        }
    }

    // Default response
    return `🤖 Entiendo que preguntas sobre: "${message}"<br><br>
                   Puedo ayudarte con:<br>
                   • "¿Cómo van las ventas?" - Reporte de ventas<br>
                   • "¿Cómo está el inventario?" - Estado del stock<br>
                   • "¿Cómo está el personal?" - Info de empleados<br>
                   • "Agregar 50 kg de carne molida" - Modificar inventario (solo escritorio)`;
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

        // Simulate voice recognition
        setTimeout(() => {
            if (isRecording) {
                stopRecording();
                // Simulate recognized text
                const simulatedCommands = [
                    '¿Cómo van las ventas hoy?',
                    '¿Cuál es el estado del inventario?',
                    '¿Cuántos empleados están trabajando?',
                    'Agregar 30 kg de carne molida'
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
    status.textContent = 'Listo para ayudar';
}

// Confirmation System
function showConfirmation(message) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'flex';
}

function confirmAction() {
    if (pendingAction) {
        executeAction(pendingAction);
        pendingAction = null;
    }
    document.getElementById('confirmModal').style.display = 'none';
}

function cancelAction() {
    pendingAction = null;
    document.getElementById('confirmModal').style.display = 'none';
    addMessage('Acción cancelada.', 'assistant');
}

function executeAction(action) {
    if (action.type === 'add_inventory') {
        // Find and update inventory item
        const item = systemData.inventory.find(i =>
            i.name.toLowerCase().includes(action.item.toLowerCase())
        );

        if (item) {
            const oldQuantity = item.quantity;
            item.quantity += action.quantity;

            updateInventoryDisplay();
            addMessage(`✅ <strong>Inventario actualizado:</strong><br>
                              ${item.name}: ${oldQuantity} → ${item.quantity} ${item.unit}<br>
                              <small>Cambio registrado en el log del sistema</small>`, 'assistant');

            // Log the change (in real system, this would go to database)
            console.log('INVENTORY CHANGE:', {
                timestamp: new Date(),
                action: 'ADD',
                item: item.name,
                oldQuantity: oldQuantity,
                newQuantity: item.quantity,
                change: action.quantity,
                modifiedBy: 'AI Assistant'
            });
        } else {
            addMessage(`❌ No encontré el producto "${action.item}" en el inventario.`, 'assistant');
        }
    }
}

// Update inventory display
function updateInventoryDisplay() {
    const inventoryList = document.getElementById('inventoryList');
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
                            ${isLowStock ? 'Stock Bajo' : 'Stock OK'}
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

// Voice button mouse events
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
    document.getElementById('deviceType').textContent = isMobile ? '📱 Móvil' : '💻 Escritorio';
});

// Speech Synthesis for AI responses (optional)
function speakResponse(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g, ''));
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
    }
}

// Initialize speech recognition (if available)
let recognition = null;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'es-ES';

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('textInput').value = transcript;
        sendMessage();
    };

    recognition.onerror = function (event) {
        console.log('Speech recognition error:', event.error);
        addMessage('Error en el reconocimiento de voz. Intenta escribir tu mensaje.', 'assistant');
    };
}

// Enhanced voice function with real speech recognition
function toggleVoiceReal() {
    if (!recognition) {
        addMessage('El reconocimiento de voz no está disponible en este navegador.', 'assistant');
        return;
    }

    const btn = document.getElementById('voiceBtn');
    const status = document.getElementById('aiStatus');

    if (!isRecording) {
        isRecording = true;
        btn.classList.add('recording');
        btn.textContent = '🔴 Grabando... (habla ahora)';
        status.textContent = 'Escuchando...';

        recognition.start();

        recognition.onend = function () {
            stopRecording();
        };
    } else {
        recognition.stop();
        stopRecording();
    }
}

// Additional AI Commands
function processAdvancedAICommand(message) {
    const lowerMessage = message.toLowerCase();

    // Financial reports
    if (lowerMessage.includes('finanzas') || lowerMessage.includes('dinero') || lowerMessage.includes('ganancia')) {
        const revenue = systemData.sales.today;
        const costs = revenue * 0.65; // Simulated 65% cost ratio
        const profit = revenue - costs;
        const margin = (profit / revenue * 100).toFixed(1);

        return `💰 <strong>Reporte Financiero Hoy:</strong><br>
                       • Ingresos: ${revenue.toLocaleString()}<br>
                       • Costos estimados: ${costs.toLocaleString()}<br>
                       • Utilidad: ${profit.toLocaleString()}<br>
                       • Margen: ${margin}%<br>
                       📈 Tendencia: Positiva vs ayer`;
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
                       💡 Recomendación: Promover más los platillos de alta rentabilidad`;
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

    return null; // Return null if no advanced command matched
}

// Enhanced message processing
function processAICommand(message) {
    // Try advanced commands first
    const advancedResponse = processAdvancedAICommand(message);
    if (advancedResponse) return advancedResponse;

    // Original basic commands
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('ventas') || lowerMessage.includes('sales')) {
        return `📊 <strong>Reporte de Ventas Hoy:</strong><br>
                       • Total: ${systemData.sales.today.toLocaleString()}<br>
                       • Clientes: ${systemData.sales.clients}<br>
                       • Ticket promedio: ${systemData.sales.avgTicket}<br>
                       • Variación: +${((systemData.sales.today - systemData.sales.yesterday) / systemData.sales.yesterday * 100).toFixed(1)}% vs ayer`;
    }

    if (lowerMessage.includes('inventario') || lowerMessage.includes('stock')) {
        const lowStock = systemData.inventory.filter(item => item.quantity < item.minStock);
        return `📦 <strong>Estado del Inventario:</strong><br>
                       • Total de productos: ${systemData.inventory.length}<br>
                       • Productos con stock bajo: ${lowStock.length}<br>
                       • Críticos: ${lowStock.map(item => item.name).join(', ')}<br>
                       💡 Recomiendo reabastecer pronto.`;
    }

    if (lowerMessage.includes('personal') || lowerMessage.includes('empleados')) {
        return `👥 <strong>Estado del Personal:</strong><br>
                       • Empleados activos: ${systemData.staff.active}/${systemData.staff.total}<br>
                       • Ausentes hoy: ${systemData.staff.absent.join(', ')}<br>
                       • Tasa de asistencia: ${(systemData.staff.active / systemData.staff.total * 100).toFixed(1)}%`;
    }

    // Enhanced modification commands
    if (lowerMessage.includes('agregar') || lowerMessage.includes('añadir') || lowerMessage.includes('aumentar')) {
        if (isMobile) {
            return '📱 Las modificaciones solo están disponibles desde escritorio. Puedes consultar datos desde aquí.';
        }

        const matches = lowerMessage.match(/(?:agregar|añadir|aumentar)\s+(\d+(?:\.\d+)?)\s*(\w+)?\s*(?:de\s+)?(.+)/);
        if (matches) {
            const quantity = parseFloat(matches[1]);
            const unit = matches[2] || '';
            const itemName = matches[3];

            pendingAction = {
                type: 'add_inventory',
                item: itemName,
                quantity: quantity,
                unit: unit
            };

            showConfirmation(`¿Agregar ${quantity} ${unit} de ${itemName} al inventario?`);
            return 'Esperando confirmación para agregar al inventario...';
        }
    }

    if (lowerMessage.includes('reducir') || lowerMessage.includes('quitar') || lowerMessage.includes('disminuir')) {
        if (isMobile) {
            return '📱 Las modificaciones solo están disponibles desde escritorio.';
        }

        const matches = lowerMessage.match(/(?:reducir|quitar|disminuir)\s+(\d+(?:\.\d+)?)\s*(\w+)?\s*(?:de\s+)?(.+)/);
        if (matches) {
            const quantity = parseFloat(matches[1]);
            const unit = matches[2] || '';
            const itemName = matches[3];

            pendingAction = {
                type: 'reduce_inventory',
                item: itemName,
                quantity: quantity,
                unit: unit
            };

            showConfirmation(`¿Reducir ${quantity} ${unit} de ${itemName} del inventario?`);
            return 'Esperando confirmación para reducir del inventario...';
        }
    }

    // Default response with more options
    return `🤖 Entiendo que preguntas sobre: "${message}"<br><br>
                   <strong>Comandos disponibles:</strong><br>
                   📊 <em>"¿Cómo van las ventas?"</em> - Reporte de ventas<br>
                   📦 <em>"¿Cómo está el inventario?"</em> - Estado del stock<br>
                   👥 <em>"¿Cómo está el personal?"</em> - Info de empleados<br>
                   💰 <em>"¿Cómo van las finanzas?"</em> - Reporte financiero<br>
                   🍽️ <em>"¿Qué tal el menú?"</em> - Análisis de platillos<br>
                   📈 <em>"¿Cómo es el rendimiento?"</em> - Desempeño general<br><br>
                   <strong>Modificaciones (solo escritorio):</strong><br>
                   ➕ <em>"Agregar 50 kg de carne"</em><br>
                   ➖ <em>"Reducir 10 cajas de cerveza"</em>`;
}

// Enhanced action execution
function executeAction(action) {
    if (action.type === 'add_inventory') {
        const item = systemData.inventory.find(i =>
            i.name.toLowerCase().includes(action.item.toLowerCase())
        );

        if (item) {
            const oldQuantity = item.quantity;
            item.quantity += action.quantity;

            updateInventoryDisplay();
            addMessage(`✅ <strong>Inventario actualizado:</strong><br>
                              ${item.name}: ${oldQuantity} → ${item.quantity} ${item.unit}<br>
                              <small>✏️ Cambio registrado por IA Assistant</small>`, 'assistant');

            logInventoryChange('ADD', item, oldQuantity, item.quantity, action.quantity);
        } else {
            addMessage(`❌ No encontré el producto "${action.item}" en el inventario.<br>
                              Productos disponibles: ${systemData.inventory.map(i => i.name).join(', ')}`, 'assistant');
        }
    }

    if (action.type === 'reduce_inventory') {
        const item = systemData.inventory.find(i =>
            i.name.toLowerCase().includes(action.item.toLowerCase())
        );

        if (item) {
            const oldQuantity = item.quantity;
            if (item.quantity >= action.quantity) {
                item.quantity -= action.quantity;

                updateInventoryDisplay();
                addMessage(`✅ <strong>Inventario actualizado:</strong><br>
                                  ${item.name}: ${oldQuantity} → ${item.quantity} ${item.unit}<br>
                                  <small>✏️ Cambio registrado por IA Assistant</small>`, 'assistant');

                logInventoryChange('REDUCE', item, oldQuantity, item.quantity, -action.quantity);
            } else {
                addMessage(`❌ No hay suficiente stock de ${item.name}.<br>
                                  Stock actual: ${item.quantity} ${item.unit}`, 'assistant');
            }
        } else {
            addMessage(`❌ No encontré el producto "${action.item}" en el inventario.`, 'assistant');
        }
    }
}

// Inventory change logging
function logInventoryChange(action, item, oldQty, newQty, change) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        item: item.name,
        oldQuantity: oldQty,
        newQuantity: newQty,
        change: change,
        modifiedBy: 'AI Assistant',
        id: Date.now()
    };

    // In a real system, this would be sent to the backend
    console.log('INVENTORY CHANGE LOG:', logEntry);

    // Store in localStorage for demo (remember: not available in artifacts)
    try {
        const logs = JSON.parse(localStorage.getItem('inventoryLogs') || '[]');
        logs.push(logEntry);
        localStorage.setItem('inventoryLogs', JSON.stringify(logs));
    } catch (e) {
        console.log('Could not save to localStorage (normal in artifact environment)');
    }
}

// Enhanced AI status updates
function updateAIStatus(status) {
    document.getElementById('aiStatus').textContent = status;
}

// Auto-update dashboard every 30 seconds (simulated)
setInterval(function () {
    // Simulate small changes in data
    systemData.sales.today += Math.floor(Math.random() * 200) - 100;
    systemData.sales.clients += Math.floor(Math.random() * 3) - 1;

    // Update display
    const statsCards = document.querySelectorAll('.stat-card .value');
    if (statsCards.length >= 4) {
        statsCards[0].textContent = `${systemData.sales.today.toLocaleString()}`;
        statsCards[1].textContent = systemData.sales.clients;
    }
}, 30000);

// Initialize system
console.log('RestauranteIA System initialized');
console.log('Features: Hybrid access, AI assistant, voice recognition, inventory management');