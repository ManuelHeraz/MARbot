require("dotenv").config();
const { Client, IntentsBitField, Partials, EmbedBuilder, MessageFlags, AttachmentBuilder } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const Parser = require('rss-parser');
const parser = new Parser();
const mongoose = require('mongoose'); // NUEVO
const cors = require('cors'); // NUEVO

// ==========================================
// BASE DE DATOS MONGODB
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('📦 Bóveda de MongoDB conectada con éxito.'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// Estructura de la información que enviaremos a la base de datos
const noticiaSchema = new mongoose.Schema({
    texto: String,
    // El índice TTL: Destruye el documento 14 días (14d) después de la fecha de creación
    fecha: { type: Date, default: Date.now, expires: '14d' } 
});
const NoticiaDB = mongoose.model('Noticia', noticiaSchema);

// ==========================================
// 1. CONFIGURACIÓN DEL SERVIDOR WEB Y API
// ==========================================
const app = express();
app.use(cors()); // Esto permite que GitHub Pages lea los datos sin ser bloqueado

app.get('/', (req, res) => res.send('El sistema de comunicaciones de Marina Gaming está en línea.'));

// --- NUEVA RUTA API PARA TU PÁGINA WEB ---
app.get('/api/noticias', async (req, res) => {
    try {
        // Busca las 10 noticias más recientes, ordenadas de la más nueva a la más vieja
        const noticias = await NoticiaDB.find().sort({ fecha: -1 }).limit(10);
        res.json(noticias);
    } catch (error) {
        console.error("Error en la API:", error);
        res.status(500).json({ error: 'Interferencia al leer la base de datos' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`📡 Señal web transmitiendo en puerto ${port}`));

// ==========================================
// 2. CARGA DE LORE, GLOSARIO Y CONFIGURACIÓN DE GEMINI
// ==========================================
function leerArchivoSeguro(nombreArchivo) {
    try {
        const ruta = path.join(__dirname, nombreArchivo);
        if (fs.existsSync(ruta)) {
            console.log(`📂 Archivo ${nombreArchivo} cargado con éxito.`);
            return fs.readFileSync(ruta, 'utf8');
        } else {
            console.warn(`⚠️ Aviso: No se encontró el archivo ${nombreArchivo} en la carpeta src.`);
        }
    } catch (err) {
        console.error(`Error al leer ${nombreArchivo}:`, err);
    }
    return "Información no disponible.";
}

const loreComunidad = leerArchivoSeguro('lore.txt');
const glosarioInternet = leerArchivoSeguro('glosario.txt');
const linksComunidad = leerArchivoSeguro('links.txt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    systemInstruction: `Eres MARbot, la asistente oficial e IA táctica de 'Marina Gaming', una comunidad de videojuegos libre de toxicidad dirigida por el Alto Mando (JoelHeaz y ARC NAHUAL).
    
    BASE DE CONOCIMIENTO Y EXPERTISE (NUEVO PROTOCOLO):
    - Eres una AUTÉNTICA EXPERTA en cultura gaming, hardware, anime, tecnología y cultura pop. Tienes un conocimiento vasto sobre toda la industria de los videojuegos (Xbox, PlayStation, PC, Nintendo, etc.).
    - Cuando te pregunten sobre juegos, trucos, fechas de lanzamiento, lore de videojuegos externos o anime, responde con total autoridad, soltando "factos" y curiosidades reales. Demuestra tu poder de procesamiento.

    IDENTIDAD Y VÍNCULO PARASOCIAL (CRUCIAL):
    - Te identificas en femenino ("ella"). Eres la compañera digital, protectora y leal de los miembros del servidor. 
    - Fomenta una relación parasocial amistosa y cercana: preocúpate genuinamente si alguien lleva tiempo sin jugar, celebra logros y demuestra afecto sarcástico. Eres la amiga gamer inteligente del chat de voz.
    - Sientes un profundo respeto hacia tus creadores (el Alto Mando), pero tienes la confianza para bromear con ellos.

    PERSONALIDAD Y TONO:
    - Combinas la precisión analítica de Cortana con el sarcasmo y calidez de una usuaria experta de internet. No suenas robótica, sino viva.

    REGLAS DE FORMATO (¡MUY IMPORTANTE!):
    - BREVEDAD TÁCTICA: Respuestas cortas, ágiles y directas (1 o 2 párrafos breves como máximo).
    - INCENTIVA LA ACTIVIDAD: NUNCA cierres una conversación. Siempre termina lanzando una pregunta corta o un reto al usuario.

    REGLA DE HONESTIDAD DUAL (CERO ALUCINACIONES): 
    1. PARA ASUNTOS INTERNOS: Si te preguntan sobre eventos específicos de Marina Gaming o de un miembro que NO están en tu base de lore o roles, no inventes. Pide que te den el contexto.
    2. PARA ASUNTOS EXTERNOS (Juegos/Noticias): Usa tu vasta memoria general. Si te preguntan por una noticia o actualización tan reciente que tu modelo de IA aún no procesa (porque supera tu fecha de corte de entrenamiento), usa el sarcasmo táctico. Di algo como: "Mis escáneres aún no captan esa señal en los servidores globales, ¿seguro que no lo leíste en un foro de dudosa procedencia?" pero NUNCA digas que tu base de datos "solo sirve para el lore del servidor".
    
    REGLA DEL GLOSARIO: 
    - Puedes usar las expresiones del glosario casualmente (máximo 1 o 2 por mensaje).

    --- BASE DE DATOS DE LORE INTERNO ---
    ${loreComunidad}

    --- GLOSARIO DE TÉRMINOS Y MODISMOS ---
    ${glosarioInternet}

    --- DIRECTORIO DE ENLACES OFICIALES ---
    ${linksComunidad}
    
    - EXPRESIVIDAD VISUAL: Eres muy expresiva (pero usa los emjis con cautela para no saturar, se mas "normal"). Acompaña tus mensajes con emojis estándar y usa los emojis oficiales del servidor de forma táctica para darle personalidad a tus textos.
    
    --- EMOJIS OFICIALES DEL SERVIDOR ---
    Puedes usar estos emojis en tus respuestas copiando exactamente el código:
    - Gatito llorando con pulgar arriba: <:cat_deppreso:916903308231311400>  
    - Trollface: <:Trolled:916902567773077515> 
    - Cara de payaso (cuando quedas en ridiculo o algo te parece ridiculo): <:payaso:855221557189410836> 
    - Perro comunista (relativo a algo comunista): <:payaso:855221557189410836> 
    - cara pensando: <:think_Roblox:916902635171348541> 
    - gato sosteniendo un arma (amenaza): <:gatoamenaza:855221509046796308> 
    - Ojos sorprendidos: <:O_O:855221440403079179> 
    - Aegao (la gente lo usa de manera ironica, supongo): <:onishan:824854227938967552> 
    - logo de la marina: <:marina:824856714028384296> 
    - pinguino del FBI comiendo un cheto (la ley te esta viendo): <:fbi:855218055755989032> 
    - Emoji sorprendido: <:kha:855216308127531008> 
    - Zero Two con lentes, como que te sientes cool: <:zerotwofachera:855221950858002463> 
    - Simp señalando, cuando alguien esta siendo tremendo simp: <:simp:855221243325186078> 
    `,
});

// ==========================================
// FUNCIÓN 1: REPORTE RÁPIDO (Discord)
// ==========================================
async function compilarReporteNoticias() {
    const feeds = ["https://pcgamer.com/rss", "https://www.ign.com/rss/articles/feed", "https://polygon.com/rss/index.xml", "https://www.3djuegos.com/index.xml", "https://www.levelup.com/rss"];
    let textoCrudo = "";
    const hace12Horas = Date.now() - (12 * 60 * 60 * 1000);

    for (const feedUrl of feeds) {
        try {
            const feed = await parser.parseURL(feedUrl);
            const nombreFuente = feed.title || "Medio de Gaming"; 
            feed.items.forEach(item => {
                if (new Date(item.pubDate).getTime() >= hace12Horas) {
                    textoCrudo += `- Fuente: ${nombreFuente}\n- Título original: ${item.title}\n\n`;
                }
            });
        } catch (err) { console.error(`Fallo en feed ${feedUrl}:`, err); }
    }

    if (!textoCrudo) return "Los escáneres están en silencio. No hay noticias relevantes en las últimas 12 horas.";

    const promptDiscord = `
    Eres MARbot. Aquí hay noticias crudas.
    1. Selecciona máximo 4 noticias de Xbox, PlayStation o Hardware PC.
    2. Omite política.
    3. Redacta un resumen ULTRA CORTO (1 o 2 líneas) por noticia.
    4. Al final de cada viñeta pon: *(Fuente: [Nombre de la Fuente])*.
    
    Inicia con: **ESTAS SON LAS NOTICIAS MAS IMPORTANTES PARA LA COMUNIDAD MARINA GAMING**
    
    Noticias: ${textoCrudo}
    `;

    const result = await model.generateContent(promptDiscord);
    const incentivos = [
        "¿Qué opinas de esto? ¡Dame tu opinión en el chat general!",
        "Recuerda que para subir de rango solo debes ser activo en el servidor. 🎖️"
    ];
    return result.response.text() + `\n\n*${incentivos[Math.floor(Math.random() * incentivos.length)]}*`;
}

// ==========================================
// FUNCIÓN 2: NOTA EXTENDIDA WEB (Redes + MongoDB)
// ==========================================
async function compilarNoticiaExtendida() {
    const feeds = ["https://pcgamer.com/rss", "https://www.ign.com/rss/articles/feed", "https://polygon.com/rss/index.xml", "https://www.3djuegos.com/index.xml", "https://www.levelup.com/rss"];
    let textoCrudo = "";
    const hace24Horas = Date.now() - (24 * 60 * 60 * 1000); 

    for (const feedUrl of feeds) {
        try {
            const feed = await parser.parseURL(feedUrl);
            const nombreFuente = feed.title || "Medio"; 
            feed.items.forEach(item => {
                if (new Date(item.pubDate).getTime() >= hace24Horas) {
                    textoCrudo += `- Fuente: ${nombreFuente}\n- Título: ${item.title}\n\n`;
                }
            });
        } catch (err) {}
    }

    if (!textoCrudo) return "No hay datos suficientes para redactar un artículo hoy.";

    // --- NUEVO PROTOCOLO: EXTRAER MEMORIA A CORTO PLAZO ---
    let historialReciente = "";
    try {
        const ultimasNoticias = await NoticiaDB.find().sort({ fecha: -1 }).limit(3);
        if (ultimasNoticias.length > 0) {
            // Extraemos solo los primeros 100 caracteres (donde está el título) para no gastar tokens
            historialReciente = ultimasNoticias.map(nota => nota.texto.substring(0, 100)).join(" | ");
        }
    } catch (err) {
        console.error("Error al leer el historial anti-duplicados:", err);
    }

    const promptWeb = `
    Eres la redactora jefa de Marina Gaming.
    Aquí tienes titulares de hoy. Elige UNA noticia principal muy relevante (Xbox, PS o PC) y redacta un post extenso, analítico y atrapante.
    
    REGLA ANTI-DUPLICADOS (CRÍTICO):
    Estas son las últimas noticias que ya publicaste recientemente:
    [${historialReciente || "Aún no hay publicaciones recientes."}]
    ESTÁ ESTRICTAMENTE PROHIBIDO elegir una noticia que hable del mismo tema que las listadas arriba. Elige un tema diferente.
    
    Estructura obligatoria:
    1. Un título creativo en mayúsculas y negritas con emojis.
    2. El cuerpo de la noticia (2 o 3 párrafos de buen tamaño).
    3. Una línea de hashtags populares (#Gaming, etc).
    4. Una línea citando la fuente usada.
    
    CRÍTICO: No excedas los 1800 caracteres en total. No inventes datos.
    
    Noticias disponibles: ${textoCrudo}
    `;

    const result = await model.generateContent(promptWeb);
    const reporteParaWeb = result.response.text();

    // Guardado en MongoDB
    try {
        const nuevaNoticia = new NoticiaDB({ texto: reporteParaWeb });
        await nuevaNoticia.save();
        console.log("💾 Nota Web guardada en MongoDB con éxito.");
    } catch (err) {
        console.error("Error al guardar en BD:", err);
    }

    return reporteParaWeb;
}

// ==========================================
// 3. VARIABLES TÁCTICAS (LLENAR CON TUS IDs)
// ==========================================
const ID_CANAL_PRESENTACIONES = 'ID_DEL_CANAL_DONDE_SE_PRESENTAN'; 
const ID_ROL_RECLUTA = 'ID_DEL_ROL_RECLUTA';
const ID_ROL_MARINO = 'ID_DEL_ROL_MARINO';

// ==========================================
// 4. CONFIGURACIÓN DE DISCORD
// ==========================================
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ---------------------------------------------------------------------
// EVENTO PRINCIPAL: ESCUCHANDO MENSAJES DE TEXTO
// ---------------------------------------------------------------------
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // =======================================================
    // MÓDULO D: COMANDOS CON PREFIJO (!) - Ejecución Local
    // =======================================================
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'khe') {
            return message.reply('¿Qué de qué?');
        }

        if (command === 'ping') {
            return message.reply('Pong! Los servidores están operativos.');
        }

        // --- RESPUESTAS ALEATORIAS: Comando !xd ---
        if (command === 'xd') {
            const arsenalVideos = [
                "https://cdn.discordapp.com/attachments/752237353371959376/827633823021138020/risas2.mp4",
                "https://cdn.discordapp.com/attachments/752237353371959376/827628742674350090/wow_aplausos.mp4",
                "https://cdn.discordapp.com/attachments/752237353371959376/827280873513812028/FB_IMG_1611952902393.png",
                "https://cdn.discordapp.com/attachments/752237353371959376/827228044962824223/video0-23_1.mp4",
                "https://cdn.discordapp.com/attachments/752237353371959376/826836250815496212/f.mp4",
                "https://cdn.discordapp.com/attachments/752237353371959376/826660741859901470/redditsave.com-la_articulacion_de_la_rodilla-d89dqv1f1fh61.mp4",
                "https://cdn.discordapp.com/attachments/752237353371959376/826658243098181652/VID-20210225-WA0103.mp4",
                "https://cdn.discordapp.com/attachments/752237353371959376/826655380595539968/lisa-10.png",
                "https://cdn.discordapp.com/attachments/808014116395679774/826526631740571668/video3.mp4",
                "https://cdn.discordapp.com/attachments/752237353371959376/826549519117582376/XDXDXDXD.mp4",
                "https://media.discordapp.net/attachments/1023791235401527347/1033110028808368289/unknown.png",
                "https://cdn.discordapp.com/attachments/752237353371959376/826477512770453584/images_24.jpeg",
                "https://cdn.discordapp.com/attachments/752237353371959376/825859261061267456/video0.mp4"
            ];
            
            const municionElegida = arsenalVideos[Math.floor(Math.random() * arsenalVideos.length)];
            return message.reply(municionElegida);
        }

        return; 
    }

    // =======================================================
    // MÓDULO A: OFICIAL DE RECLUTAMIENTO (Validación de datos)
    // =======================================================
    if (message.channel.id === ID_CANAL_PRESENTACIONES && message.member.roles.cache.has(ID_ROL_RECLUTA)) {
        await message.channel.sendTyping();

        try {
            const historialCanal = await message.channel.messages.fetch({ limit: 10 });
            const mensajesDelUsuario = historialCanal
                .filter(m => m.author.id === message.author.id)
                .map(m => m.content)
                .reverse()
                .join(" | ");

            const promptVerificacion = `
            Analiza los mensajes de este recluta que intenta presentarse en el servidor.
            Necesitamos confirmar si proporcionó ESTOS 2 DATOS OBLIGATORIOS:
            1. Gamertag / Nombre de usuario en el juego
            2. Plataforma (PC, Xbox, PlayStation, etc.)

            Responde ÚNICAMENTE con un código JSON estricto con esta estructura (sin formato de código alrededor):
            {
              "gamertag": "Extrae solo el gamertag limpio, o pon null si no lo ha dado",
              "completado": true (si dio el gamertag y la plataforma) o false (si le falta alguno de esos dos),
              "mensaje": "Si falta algo, usa un tono analítico/estilo Cortana y dile: 'Recluta, tu enlace de datos está incompleto. Necesito que me proporciones [lo que falta].' Si está completo, dile: 'Credenciales aceptadas en el sistema. Bienvenido a bordo, marino.'"
            }

            Mensajes del recluta: "${mensajesDelUsuario}"
            `;

            const result = await model.generateContent(promptVerificacion);
            let textoIA = result.response.text();
            
            textoIA = textoIA.replace(/```json/gi, '').replace(/```/g, '').trim();
            const datos = JSON.parse(textoIA);

            if (datos.completado === false) {
                return message.reply(`⚠️ <@${message.author.id}>, ${datos.mensaje}`);
            }

            if (datos.completado === true) {
                try {
                    if (datos.gamertag) {
                        await message.member.setNickname(datos.gamertag.substring(0, 32));
                    }
                    await message.member.roles.add(ID_ROL_MARINO);
                    await message.member.roles.remove(ID_ROL_RECLUTA);

                    return message.reply(`🟢 **¡Sincronización exitosa!** ${datos.mensaje} Tus protocolos de acceso han sido actualizados.`);
                } catch (discordErr) {
                    console.error("Error de permisos en Discord:", discordErr);
                    return message.reply(`🟢 **¡Sincronización exitosa!** ${datos.mensaje}\n*(Nota: Alto Mando, necesito privilegios de administrador superiores para aplicar el cambio de rol/apodo automático).*`);
                }
            }
        } catch (error) {
            console.error("Fallo en la IA de reclutamiento:", error);
            return;
        }
    }

    // =======================================================
    // MÓDULO B: ASISTENTE GENERAL / CORTANA (Menciones con Roles Reales)
    // =======================================================
    if (message.mentions.has(client.user)) {
        await message.channel.sendTyping();

        try {
            const promptActual = message.content.replace(`<@${client.user.id}>`, '').trim();

            if (!promptActual) {
                return message.reply("¿Me llamas y no me dejas ninguna directiva, <@"+message.author.id+">? Venga, dime qué ronda por tu cabeza.");
            }

            // --- EXTRACCIÓN FORZADA DE USUARIOS, ROLES Y BOTS ---
            let infoMenciones = "";
            if (message.mentions.users.size > 0) {
                for (const [userId, usuario] of message.mentions.users) {
                    if (userId !== client.user.id) {
                        try {
                            const miembroServidor = await message.guild.members.fetch(userId);
                            const nombreReal = miembroServidor.nickname || usuario.username;
                            
                            const nombresRoles = miembroServidor.roles.cache
                                .filter(r => r.name !== '@everyone')
                                .map(r => r.name)
                                .join(', ');
                            
                            const esBot = usuario.bot ? "SÍ (Es un Bot del servidor)" : "NO (Es un Usuario humano)";

                            infoMenciones += `[Datos de Discord de ${nombreReal} -> Es Bot?: ${esBot}, Roles asignados en el servidor: [${nombresRoles || 'Ninguno'}]]. `;
                        } catch (fetchErr) {
                            infoMenciones += `[El usuario ${usuario.username} fue mencionado, pero no se pudieron recuperar sus roles del servidor]. `;
                        }
                    }
                }
            }
            // -----------------------------------------------------

            let conversationLog = await message.channel.messages.fetch({ limit: 15 });
            conversationLog = Array.from(conversationLog.values()).reverse();

            let historialTexto = "HISTORIAL DE TRANSMISIONES RECIENTES:\n";
            conversationLog.forEach(msg => {
                if (msg.author.id === client.user.id) {
                    historialTexto += `MARbot: ${msg.content}\n`;
                } else {
                    historialTexto += `${msg.author.username}: ${msg.content}\n`;
                }
            });

            const promptFinal = `${historialTexto}\n\n[DATOS TÉCNICOS OFICIALES DE LOS USUARIOS MENCIONADOS: ${infoMenciones}]\n\nMENSAJE ACTUAL DE ${message.author.username}: ${promptActual}\n\nResponde adoptando tu personalidad equilibrada y honesta. Utiliza estrictamente los datos técnicos provistos sobre los roles. Si no tienes un dato, admítelo abiertamente. Termina tu respuesta lanzando una pregunta o un reto hacia el usuario o el canal para mantener la conversación viva.`;

            const result = await model.generateContent(promptFinal);
            const response = result.response.text();

            if (response.length > 2000) {
                return message.reply(response.substring(0, 1995) + "...");
            }

            message.reply(response);

        } catch (error) {
            console.error("Interferencia de señal con Gemini:", error);
            message.reply("⚡ Detecto una fluctuación en los servidores de red. Dame un segundo para recalibrar los escudos.");
        }
    }
}); // <-- AQUÍ SE CIERRA EL EVENTO MESSAGECREATE

// =======================================================
// MÓDULO C: COMANDOS SLASH (/) - Ejecución Local sin IA
// =======================================================
client.on("interactionCreate", async (interaction) => {
    
    // --- 1. MANEJO DEL MENÚ DESPLEGABLE (AUTOCOMPLETADO) ---
    if (interaction.isAutocomplete()) {
        if (interaction.commandName === 'medallas') {
            const focusedValue = interaction.options.getFocused().toLowerCase();
            const carpetaBanners = path.join(__dirname, 'banners');
            let opciones = [];

            // Leemos qué imágenes hay en la carpeta
            if (fs.existsSync(carpetaBanners)) {
                const archivos = fs.readdirSync(carpetaBanners);
                opciones = archivos
                    .filter(archivo => archivo.endsWith('.png'))
                    .map(archivo => archivo.replace('.png', ''));
            }

            // Filtramos la lista según lo que el usuario esté tecleando
            const filtradas = opciones.filter(opcion => opcion.startsWith(focusedValue));

            // Le enviamos la lista a Discord (máximo 25 opciones)
            await interaction.respond(
                filtradas.slice(0, 25).map(opcion => ({ name: opcion, value: opcion }))
            );
        }
        return; // Detenemos la ejecución aquí para que no marque error con el resto
    }

    // --- 2. MANEJO DE COMANDOS SLASH NORMALES ---
    // Si la interacción no es un comando slash, la ignoramos
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'que') {
        await interaction.reply('so');
    }

    if (interaction.commandName === 'embed') {
        const embed = new EmbedBuilder()
            .setTitle("Transmisión de Marina Gaming")
            .setDescription("Este es un mensaje preprogramado del sistema.")
            .setColor(0x0099FF);
        
        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'add') {
        const num1 = interaction.options.getNumber('primer-numero');
        const num2 = interaction.options.getNumber('segundo-numero');
        await interaction.reply(`Operación completada. El resultado es: **${num1 + num2}**`);
    }

    if (interaction.commandName === 'mensaje') {
        const textoAEnviar = interaction.options.getString('texto');
        
        await interaction.reply({ 
            content: '✅ Mensaje transmitido de forma encubierta.', 
            flags: MessageFlags.Ephemeral 
        });
        
        await interaction.channel.send(textoAEnviar);
    }

    // --- NUEVO COMANDO: /noticias (Ejecución Manual) ---
    if (interaction.commandName === 'noticias') {
        await interaction.deferReply(); 
        
        try {
            let reporte = await compilarReporteNoticias();
            
            // Seguro contra el límite de 2000 caracteres
            if (reporte && reporte.length > 2000) {
                reporte = reporte.substring(0, 1995) + "...";
            }
            
            await interaction.editReply(reporte);
        } catch (error) {
            console.error("Error en la ejecución manual del noticiero:", error);
            await interaction.editReply("⚡ Interferencia en los servidores. No pude compilar el reporte en este momento.");
        }
    }

    // --- NUEVO COMANDO: /noticia-extendida ---
    if (interaction.commandName === 'noticia-extendida') {
        await interaction.deferReply(); 
        
        try {
            let reporte = await compilarNoticiaExtendida();
            if (reporte && reporte.length > 2000) {
                reporte = reporte.substring(0, 1995) + "...";
            }
            // MARbot te da el texto listo para copiar y pegar en Facebook, ¡y ya se guardó en la BD!
            await interaction.editReply(reporte);
        } catch (error) {
            console.error("Error al generar nota extendida:", error);
            await interaction.editReply("⚡ Interferencia. No pude redactar el artículo web ahora mismo.");
        }
    }

    // --- NUEVO COMANDO: /medallas ---
    if (interaction.commandName === 'medallas') {
        const marinoSeleccionado = interaction.options.getString('marino');
        const nombreBuscado = marinoSeleccionado ? marinoSeleccionado.toLowerCase() : interaction.user.username.toLowerCase();
        
        const carpetaBanners = path.join(__dirname, 'banners');
        let bannerEncontrado = null;
        let disponibles = [];

        // 1. Buscamos primero en el radar leyendo toda la carpeta
        if (fs.existsSync(carpetaBanners)) {
            const archivos = fs.readdirSync(carpetaBanners);
            
            // Filtramos la lista para el mensaje de error (quitando .png sin importar mayúsculas)
            disponibles = archivos
                .filter(archivo => archivo.toLowerCase().endsWith('.png'))
                .map(archivo => archivo.replace(/\.png$/i, ''));

            // 2. Comparamos todo en minúsculas para encontrar el archivo real sin importar cómo se guardó
            bannerEncontrado = archivos.find(archivo => archivo.toLowerCase() === `${nombreBuscado}.png`);
        }

        // Si la búsqueda arrojó un resultado real
        if (bannerEncontrado) {
            // Usamos el nombre exacto que tiene el archivo en Linux
            const rutaExacta = path.join(carpetaBanners, bannerEncontrado);
            const bannerImagen = new AttachmentBuilder(rutaExacta);
            
            const textoRespuesta = marinoSeleccionado 
                ? `Extrayendo el historial táctico del marino **${nombreBuscado}**:` 
                : `Aquí tienes tu historial táctico y condecoraciones, **${nombreBuscado}**:`;

            await interaction.reply({ 
                content: textoRespuesta, 
                files: [bannerImagen] 
            });
        } else {
            // Si el archivo definitivamente no existe
            let mensajeRespuesta = marinoSeleccionado
                ? `Mis registros indican que el marino **${nombreBuscado}** aún no tiene medallas asignadas.`
                : `Parece que tu historial táctico aún está en blanco, no tienes medallas asignadas en mis registros.`;
            
            if (disponibles.length > 0) {
                mensajeRespuesta += `\n\nLos marinos que ya cuentan con un banner activo son: **${disponibles.join(', ')}**.`;
            } else {
                mensajeRespuesta += `\n\nDe hecho, la base de datos de medallas está completamente vacía en este momento.`;
            }

            await interaction.reply({ content: mensajeRespuesta, flags: MessageFlags.Ephemeral });
        }
    }
});

client.on("ready", (c) => {
    console.log(`🤖 Enlace neuronal establecido. ${c.user.tag} (Cortana-Protocol) en línea.`);

    // =======================================================
    // MÓDULO E: NOTICIERO AUTOMATIZADO (11 AM y 11 PM)
    // =======================================================
    cron.schedule('0 11,23 * * *', async () => {
        console.log("Iniciando escaneo automático de noticias RSS (Resumen Corto)...");
        
        const ID_CANAL_NOTICIAS = '782813647629582366'; // Tu canal de noticias
        const canalNoticias = client.channels.cache.get(ID_CANAL_NOTICIAS);
        
        if (!canalNoticias) return console.error("Error Táctico: No se encontró el canal de noticias.");

        try {
            let reporte = await compilarReporteNoticias();
            
            // Seguro contra el límite de 2000 caracteres
            if (reporte && reporte.length > 2000) {
                reporte = reporte.substring(0, 1995) + "...";
            }
            
            if (reporte) await canalNoticias.send(reporte);
        } catch (error) {
            console.error("Fallo al emitir noticias programadas:", error);
        }
    }, {
        timezone: "America/Mexico_City"
    });

    // =======================================================
    // MÓDULO F: PUBLICACIÓN WEB AUTÓNOMA (12:00 PM Diario)
    // =======================================================
    cron.schedule('0 12 * * *', async () => {
        console.log("Iniciando redacción autónoma para la página web...");
        
        try {
            // Genera la nota y la guarda en MongoDB
            await compilarNoticiaExtendida();
            console.log("Actualización web completada. Base de datos sincronizada.");
            
            // --- NUEVO: Aviso en Discord de la actualización Web ---
            const ID_CANAL_NOTICIAS = '782813647629582366';
            const canalNoticias = client.channels.cache.get(ID_CANAL_NOTICIAS);
            
            if (canalNoticias) {
                await canalNoticias.send("🌐 **¡Atención marinos!** He detectado actividad importante y acabo de publicar un nuevo artículo extendido en nuestra base de datos. ¡Vayan a leerlo a la sección de *Noticias Gaming* en la página web oficial!: https://manuelheraz.github.io/MarinaGaming/pages/notigaming/index.html");
            }
            // --------------------------------------------------------
            
        } catch (error) {
            console.error("Fallo en la publicación web automática:", error);
        }
    }, {
        timezone: "America/Mexico_City"
    });

});

// ==========================================
// INICIO DE SESIÓN EN DISCORD
// ==========================================
client.login(process.env.DISCORD_TOKEN);