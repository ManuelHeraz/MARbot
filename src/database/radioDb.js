const mongoose = require('mongoose');

// 1. Establecemos la conexión dedicada a la radio usando la URI exclusiva del entorno
const radioConnection = mongoose.createConnection(process.env.MONGODB_URI_RADIO);

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

// 3. ENRUTAMIENTO EXPLÍCITO: 
// Asociamos el modelo directamente a 'radioConnection' para que inserte 
// obligatoriamente en la base de datos de la URI de la radio y en la colección 'cola_reproduccion'.
const ColaReproduccion = radioConnection.model('ColaReproduccion', colaSchema, 'cola_reproduccion');

module.exports = { ColaReproduccion };