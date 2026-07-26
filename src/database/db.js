const mongoose = require('mongoose');

// Función para encender la conexión
function conectarBD() {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('📦 Bóveda de MongoDB conectada con éxito.'))
        .catch(err => console.error('Error al conectar a MongoDB:', err));
}

// Estructura de la memoria a corto plazo de las noticias
const noticiaSchema = new mongoose.Schema({
    texto: String,
    fecha: { type: Date, default: Date.now, expires: '14d' } 
});

const NoticiaDB = mongoose.model('Noticia', noticiaSchema);

// Exportamos la función de conexión y el modelo de datos
module.exports = { conectarBD, NoticiaDB };