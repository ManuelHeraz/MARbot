const mongoose = require('mongoose');

const radioConnection = mongoose.createConnection(process.env.MONGODB_URI_RADIO);

radioConnection.on('connected', () => {
    console.log('📻 Frecuencia de Marina Radio establecida (MongoDB Conectado).');
});

radioConnection.on('error', (err) => {
    console.error('⚡ Error en la frecuencia de la radio:', err);
});

const colaSchema = new mongoose.Schema({
    title: { type: String, required: true },
    source: { type: String, required: true },
    solicitado_por: { type: String, required: true },
    fecha_solicitud: { type: Date, default: Date.now }
}, { collection: 'cola_reproduccion', versionKey: false });

const ColaReproduccion = radioConnection.model('ColaReproduccion', colaSchema);
// corregido el nombre del archivo
module.exports = { ColaReproduccion };