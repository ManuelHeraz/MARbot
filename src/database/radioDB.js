const mongoose = require('mongoose');

// Módulo de conexión paralela (Utiliza una variable de entorno exclusiva para la radio)
const radioConnection = mongoose.createConnection(process.env.MONGODB_URI_RADIO);

radioConnection.on('connected', () => {
    console.log('📻 Frecuencia de Marina Radio establecida (MongoDB Conectado).');
});

radioConnection.on('error', (err) => {
    console.error('⚡ Error en la frecuencia de la radio:', err);
});

// Estructura estricta exigida por el AutoDJ
const colaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    source: { type: String, required: true },
    solicitado_por: { type: String, required: true },
    fecha_solicitud: { type: Date, default: Date.now }
}, { collection: 'cola_reproduccion', versionKey: false });

const ColaReproduccion = radioConnection.model('ColaReproduccion', colaSchema);

module.exports = { ColaReproduccion };