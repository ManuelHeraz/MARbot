const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

function iniciarServidor(NoticiaDB) {
    const app = express();
    
    app.use(cors({ origin: '*' }));
    app.get('/', (req, res) => res.send('El sistema de comunicaciones de Marina Gaming está en línea (SEGURO).'));

    app.get('/api/noticias', async (req, res) => {
        try {
            const noticias = await NoticiaDB.find().sort({ fecha: -1 }).limit(10);
            res.json(noticias);
        } catch (error) {
            console.error("Error en la API:", error);
            res.status(500).json({ error: 'Interferencia al leer la base de datos' });
        }
    });

    const port = process.env.PORT || 3000;

    try {
        const options = {
            key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
            cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))
        };
        https.createServer(options, app).listen(port, () => {
            console.log(`📡 Señal web SEGURA (HTTPS) transmitiendo en puerto ${port}`);
        });
    } catch (error) {
        console.log("⚠️ No se encontraron certificados, iniciando en modo HTTP estándar.");
        app.listen(port, () => console.log(`📡 Señal web transmitiendo en puerto ${port}`));
    }
}

module.exports = { iniciarServidor };