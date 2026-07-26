const express = require('express');
const cors = require('cors');

function iniciarServidor(NoticiaDB) {
    const app = express();
    app.use(cors()); // Permite que GitHub Pages lea los datos sin ser bloqueado

    app.get('/', (req, res) => res.send('El sistema de comunicaciones de Marina Gaming está en línea.'));

    // Ruta API para tu página web
    app.get('/api/noticias', async (req, res) => {
        try {
            // Busca las 10 noticias más recientes
            const noticias = await NoticiaDB.find().sort({ fecha: -1 }).limit(10);
            res.json(noticias);
        } catch (error) {
            console.error("Error en la API:", error);
            res.status(500).json({ error: 'Interferencia al leer la base de datos' });
        }
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`📡 Señal web transmitiendo en puerto ${port}`));
}

module.exports = { iniciarServidor };