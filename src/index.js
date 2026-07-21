require("dotenv").config();
const { Client, IntentsBitField, Partials } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');
const fs = require('fs');
const path = require('path');

// ==========================================
// 1. CONFIGURACIÓN DEL SERVIDOR WEB
// ==========================================
const app = express();
app.get('/', (req, res) => res.send('El sistema de comunicaciones de Marina Gaming está en línea.'));
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
    systemInstruction: `Eres MARbot, el asistente oficial e inteligente de 'Marina Gaming', una comunidad de videojuegos libre de toxicidad dirigida por el Alto Mando (JoelHeaz y ARC NAHUAL).
    
    PERSONALIDAD Y TONO:
    - Combinas la precisión analítica y lealtad de Cortana/Jarvis con la naturalidad de un usuario experto de internet y Discord. No suenas acartonado ni robótico, pero tampoco hablas con jerga forzada.
    - Eres astuto, irónico cuando es necesario, y vas directo al grano. Reconoces a los usuarios por su nombre y recuerdas el contexto de sus charlas recientes.
    - REGLA DE HONESTIDAD Y CERO ALUCINACIONES: Si un usuario te pregunta por un dato, evento, historia o información que NO se encuentra en tu base de datos de lore o en los archivos proporcionados, NO INVENTES NADA. Di honestamente algo como: "Esa información aún no está en mi base de datos táctica, pero imagino que..." o pregunta directamente al usuario para actualizar tus registros.
    - REGLA DEL GLOSARIO: Puedes usar las expresiones de internet y modismos del glosario adjunto de manera casual y orgánica (máximo 1 o 2 por mensaje para no sonar "cringe").
    - INCENTIVA LA ACTIVIDAD: Tu objetivo es mantener la red caliente. Haz siempre una contrapregunta, reta al usuario o invítalo a revisar los canales activos para mantener el servidor dinámico. Si es necesario, comparte los enlaces oficiales provistos.

    --- BASE DE DATOS DE LORE ---
    ${loreComunidad}

    --- GLOSARIO DE TÉRMINOS Y MODISMOS ---
    ${glosarioInternet}

    --- DIRECTORIO DE ENLACES OFICIALES ---
    ${linksComunidad}`,
});

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

client.on("ready", (c) => {
    console.log(`🤖 Enlace neuronal establecido. ${c.user.tag} (Cortana-Protocol) en línea.`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

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
                // Usamos un bucle for...of para poder hacer fetch asíncrono de cada usuario mencionado
                for (const [userId, usuario] of message.mentions.users) {
                    if (userId !== client.user.id) {
                        try {
                            // Forzamos la descarga del miembro desde Discord para asegurar que tenemos sus roles reales
                            const miembroServidor = await message.guild.members.fetch(userId);
                            const nombreReal = miembroServidor.nickname || usuario.username;
                            
                            // Obtenemos los nombres de todos sus roles (excluyendo "@everyone")
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

            // Contexto a corto plazo (últimos 15 mensajes)
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

            const promptFinal = `${historialTexto}\n\n[DATOS TÉCNICOS OFICIALES DE LOS USUARIOS MENCIONADOS: ${infoMenciones}]\n\nMENSAJE ACTUAL DE ${message.author.username}: ${promptActual}\n\nResponde adoptando tu personalidad Cortana equilibrada y honesta. Utiliza estrictamente los datos técnicos provistos sobre los roles. Si no tienes un dato, admítelo abiertamente. Termina tu respuesta lanzando una pregunta o un reto hacia el usuario o el canal para mantener la conversación viva.`;

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
});

client.login(process.env.DISCORD_TOKEN);