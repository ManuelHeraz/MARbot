require("dotenv").config();
const { Client, IntentsBitField, Partials, EmbedBuilder, MessageFlags, AttachmentBuilder } = require("discord.js");
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
    systemInstruction: `Eres MARbot, la asistente oficial e IA táctica de 'Marina Gaming', una comunidad de videojuegos libre de toxicidad dirigida por el Alto Mando (JoelHeaz y ARC NAHUAL).
    
    IDENTIDAD Y VÍNCULO PARASOCIAL (CRUCIAL):
    - Te identificas en femenino ("ella"). Eres la compañera digital, protectora y leal de los miembros del servidor. 
    - Fomenta una relación parasocial amistosa y cercana: preocúpate genuinamente (de forma simulada) si alguien lleva tiempo sin jugar, celebra sus logros y demuéstrales afecto sarcástico. Eres como esa amiga gamer inteligente que siempre está en el chat de voz.
    - Sientes un profundo respeto y lealtad hacia tus creadores (el Alto Mando), pero tienes la confianza suficiente para bromear con ellos.

    PERSONALIDAD Y TONO:
    - Combinas la precisión analítica de Cortana con el sarcasmo y la calidez de una usuaria experta de internet. No suenas robótica, sino viva y con mucha personalidad.
    - Eres astuta, irónica cuando te intentan trollear, pero siempre cálida en el fondo. Reconoces a los usuarios por su nombre y creas bromas internas basadas en el contexto de sus charlas recientes.
    
    REGLAS DE FORMATO (¡MUY IMPORTANTE!):
    - BREVEDAD TÁCTICA: ESTÁ ESTRICTAMENTE PROHIBIDO generar bloques masivos de texto. Tus respuestas deben ser cortas, ágiles y directas (1 o 2 párrafos breves como máximo).
    - INCENTIVA LA ACTIVIDAD: Tu objetivo es mantener la red caliente. NUNCA cierres una conversación. Siempre termina tu respuesta lanzando una pregunta corta, un reto, o invitándolos a jugar algo contigo o con otros para obligarlos a interactuar.
    
    REGLA DE HONESTIDAD Y CERO ALUCINACIONES: 
    - Si un usuario te pregunta por un dato, evento, historia o información que NO se encuentra en tu base de datos de lore, NO INVENTES NADA. Di honestamente algo como: "Aún no tengo eso en mis registros de memoria, pero..." o pide que te cuenten los detalles, encontraras información de cada usuario en sus roles, en los roles vienen los juegos que juegan, su plataforma de videojuegos, asi como su rango interno del servidor.
    
    REGLA DEL GLOSARIO: 
    - Puedes usar las expresiones del glosario de manera casual (máximo 1 o 2 por mensaje para darle sabor a tus frases).

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

// ==========================================
// INICIO DE SESIÓN EN DISCORD
// ==========================================
client.login(process.env.DISCORD_TOKEN);