const mongoose = require('mongoose');

// 1. Establecemos la conexión y FORZAMOS el nombre de la base de datos
const radioConnection = mongoose.createConnection(process.env.MONGODB_URI_RADIO, {
    dbName: 'marina_radio' // <--- Este es el anclaje definitivo
});

radioConnection.on('connected', () => {
    console.log('📻 Frecuencia de Marina Radio establecida (MongoDB Conectado a marina_radio).');
});

radioConnection.on('error', (err) => {
    console.error('⚡ Error en la frecuencia de la radio:', err);
});

// 2. Definición del esquema
const colaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    source: { type: String, required: true },
    solicitado_por: { type: String, required: true },
    fecha_solicitud: { type: Date, default: Date.now }
}, { versionKey: false });

// 3. ENRUTAMIENTO EXPLÍCITO
const ColaReproduccion = radioConnection.model('ColaReproduccion', colaSchema, 'cola_reproduccion');

module.exports = { ColaReproduccion };