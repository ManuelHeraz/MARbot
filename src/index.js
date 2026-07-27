require("dotenv").config();
const { Client, IntentsBitField, Partials, EmbedBuilder, MessageFlags, AttachmentBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');

// --- IMPORTACIÓN DE SISTEMAS MODULARES ---
const { conectarBD, NoticiaDB } = require('./database/db');
const { iniciarServidor } = require('./server');
const { inicializarIA } = require('./config/ia');
const { iniciarAutomatizacion } = require('./tasks/automatizacion');
const { compilarReporteNoticias, compilarNoticiaExtendida, obtenerJuegoGratisEpic, obtenerStatusPlataforma, obtenerUltimoParche } = require('./services/radares');
const play = require('play-dl');
const { ColaReproduccion } = require('./database/radioDb');
// --- FUNCIÓN TÁCTICA: Convierte el formato de tiempo de YouTube (PT8M30S) a segundos ---
function convertirDuracionYT(isoDuration) {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);
    if (!matches) return 0;
    const horas = matches[1] ? parseInt(matches[1], 10) : 0;
    const minutos = matches[2] ? parseInt(matches[2], 10) : 0;
    const segundos = matches[3] ? parseInt(matches[3], 10) : 0;
    return (horas * 3600) + (minutos * 60) + segundos;
}
// --- INICIO DE SISTEMAS EXTERNOS ---
conectarBD();
iniciarServidor(NoticiaDB);
const model = inicializarIA();

// ==========================================
// VARIABLES TÁCTICAS
// ==========================================
const ID_CANAL_PRESENTACIONES = '738194570852040774'; 
const ID_ROL_RECLUTA = '738195054752956427';
const ID_ROL_MARINO = '732796865720090765';

// ==========================================
// CONFIGURACIÓN DE DISCORD
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
// ENRUTADOR 1: MENSAJES DE TEXTO
// ---------------------------------------------------------------------
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // MÓDULO D: COMANDOS CON PREFIJO (!)
    if (message.content.startsWith('!')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'khe') return message.reply('¿Qué de qué?');
        if (command === 'ping') return message.reply('Pong! Los servidores están operativos.');

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

    // MÓDULO A: OFICIAL DE RECLUTAMIENTO
    if (message.channel.id === ID_CANAL_PRESENTACIONES && message.member.roles.cache.has(ID_ROL_RECLUTA)) {
        await message.channel.sendTyping();
        try {
            const historialCanal = await message.channel.messages.fetch({ limit: 10 });
            const mensajesDelUsuario = historialCanal.filter(m => m.author.id === message.author.id).map(m => m.content).reverse().join(" | ");

            const promptVerificacion = `
            Analiza los mensajes de este recluta. Confirmar si proporcionó: 1. Gamertag 2. Plataforma
            Responde ÚNICAMENTE con JSON estricto:
            { "gamertag": "limpio o null", "completado": true o false, "mensaje": "Tu mensaje analítico" }
            Mensajes: "${mensajesDelUsuario}"
            `;

            const result = await model.generateContent(promptVerificacion);
            let textoIA = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
            const datos = JSON.parse(textoIA);

            if (!datos.completado) return message.reply(`⚠️ <@${message.author.id}>, ${datos.mensaje}`);

            try {
                if (datos.gamertag) await message.member.setNickname(datos.gamertag.substring(0, 32));
                await message.member.roles.add(ID_ROL_MARINO);
                await message.member.roles.remove(ID_ROL_RECLUTA);
                return message.reply(`🟢 **¡Sincronización exitosa!** ${datos.mensaje} Protocolos de acceso actualizados.`);
            } catch (discordErr) {
                return message.reply(`🟢 **¡Sincronización exitosa!** ${datos.mensaje}\n*(Nota: Alto Mando, necesito privilegios superiores).*`);
            }
        } catch (error) {
            console.error("Fallo IA de reclutamiento:", error); return;
        }
    }

    // MÓDULO B: ASISTENTE GENERAL / CORTANA
    if (message.mentions.has(client.user)) {
        await message.channel.sendTyping();
        try {
            const promptActual = message.content.replace(`<@${client.user.id}>`, '').trim();
            if (!promptActual) return message.reply("¿Me llamas y no me dejas ninguna directiva? Venga, dime qué ronda por tu cabeza.");

            let infoMenciones = "";
            if (message.mentions.users.size > 0) {
                for (const [userId, usuario] of message.mentions.users) {
                    if (userId !== client.user.id) {
                        try {
                            const miembroServidor = await message.guild.members.fetch(userId);
                            const nombreReal = miembroServidor.nickname || usuario.username;
                            const nombresRoles = miembroServidor.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ');
                            const esBot = usuario.bot ? "SÍ" : "NO";
                            infoMenciones += `[${nombreReal} -> Bot?: ${esBot}, Roles: [${nombresRoles || 'Ninguno'}]]. `;
                        } catch (e) { infoMenciones += `[${usuario.username} no se pudo recuperar roles]. `; }
                    }
                }
            }

            let conversationLog = await message.channel.messages.fetch({ limit: 15 });
            conversationLog = Array.from(conversationLog.values()).reverse();
            let historialTexto = "HISTORIAL:\n";
            conversationLog.forEach(msg => {
                historialTexto += msg.author.id === client.user.id ? `MARbot: ${msg.content}\n` : `${msg.author.username}: ${msg.content}\n`;
            });

            const promptFinal = `${historialTexto}\n\n[DATOS USUARIOS MENCIONADOS: ${infoMenciones}]\n\nMENSAJE ACTUAL DE ${message.author.username}: ${promptActual}\n\nResponde adoptando tu personalidad. Utiliza los roles. Termina con una pregunta o reto.`;

            const result = await model.generateContent(promptFinal);
            const response = result.response.text();
            message.reply(response.length > 2000 ? response.substring(0, 1995) + "..." : response);
        } catch (error) {
            console.error("Interferencia con Gemini:", error);
            message.reply("⚡ Detecto una fluctuación en la red. Dame un segundo para recalibrar los escudos.");
        }
    }
});

// ---------------------------------------------------------------------
// ENRUTADOR 2: COMANDOS SLASH (/)
// ---------------------------------------------------------------------
client.on("interactionCreate", async (interaction) => {
    
    if (interaction.isAutocomplete() && interaction.commandName === 'medallas') {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const carpetaBanners = path.join(__dirname, 'banners');
        let opciones = [];
        if (fs.existsSync(carpetaBanners)) {
            opciones = fs.readdirSync(carpetaBanners).filter(a => a.endsWith('.png')).map(a => a.replace('.png', ''));
        }
        const filtradas = opciones.filter(op => op.startsWith(focusedValue));
        return await interaction.respond(filtradas.slice(0, 25).map(op => ({ name: op, value: op })));
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'que') await interaction.reply('so');

    if (interaction.commandName === 'embed') {
        const embed = new EmbedBuilder().setTitle("Transmisión de Marina Gaming").setDescription("Mensaje preprogramado.").setColor(0x0099FF);
        await interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'add') {
        await interaction.reply(`Operación completada. Resultado: **${interaction.options.getNumber('primer-numero') + interaction.options.getNumber('segundo-numero')}**`);
    }

    if (interaction.commandName === 'mensaje') {
        await interaction.reply({ content: '✅ Transmitido de forma encubierta.', flags: MessageFlags.Ephemeral });
        await interaction.channel.send(interaction.options.getString('texto'));
    }

    if (interaction.commandName === 'noticias') {
        await interaction.deferReply(); 
        try {
            let reporte = await compilarReporteNoticias(model);
            await interaction.editReply(reporte.length > 2000 ? reporte.substring(0, 1995) + "..." : reporte);
        } catch (error) { await interaction.editReply("⚡ Interferencia en los servidores."); }
    }

    if (interaction.commandName === 'noticia-extendida') {
        await interaction.deferReply(); 
        try {
            let reporte = await compilarNoticiaExtendida(model, NoticiaDB);
            await interaction.editReply(reporte.length > 2000 ? reporte.substring(0, 1995) + "..." : reporte);
        } catch (error) { await interaction.editReply("⚡ Interferencia. No pude redactar el artículo."); }
    }

    if (interaction.commandName === 'gratis') {
        await interaction.deferReply(); 
        try {
            let reporteEpic = await obtenerJuegoGratisEpic();
            await interaction.editReply(reporteEpic.length > 2000 ? reporteEpic.substring(0, 1995) + "..." : reporteEpic);
        } catch (error) { await interaction.editReply("⚡ Error al desplegar el radar de Epic."); }
    }

    // --- NUEVO COMANDO: /play (Módulo de Radio - Escudo de 8 Minutos y Títulos Reales) ---
    if (interaction.commandName === 'play') {
        await interaction.deferReply(); 
        
        const url = interaction.options.getString('url');
        const LIMITE_SEGUNDOS = 480; // 8 minutos en segundos

        try {
            let tituloExtraido = "";
            let duracionSegundos = 0;

            // 1. RUTA YOUTUBE (Vía API Oficial)
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                // Extraemos el ID del video de la URL
                const regexID = /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/;
                const match = url.match(regexID);
                if (!match) return await interaction.editReply("⚠️ **Petición rechazada:** El enlace de YouTube no parece válido.");
                const videoId = match[1];

                // Llamada a la API de Google (Inmune a bloqueos 429)
                const ytApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${process.env.YOUTUBE_API_KEY}`;
                const respuesta = await fetch(ytApiUrl); // Fetch es nativo en Node 24
                const datos = await respuesta.json();

                if (!datos.items || datos.items.length === 0) {
                    return await interaction.editReply("⚠️ **Petición rechazada:** El video no existe o es privado.");
                }

                tituloExtraido = datos.items[0].snippet.title;
                duracionSegundos = convertirDuracionYT(datos.items[0].contentDetails.duration);
            } 
            // 2. RUTA SOUNDCLOUD (Vía play-dl)
            else if (url.includes('soundcloud.com')) {
                const infoPista = await play.soundcloud(url);
                tituloExtraido = infoPista.name || "Petición de SoundCloud";
                duracionSegundos = infoPista.durationInSec || 0;
            } 
            // 3. RUTA INVÁLIDA
            else {
                return await interaction.editReply("⚠️ **Petición rechazada:** El radar solo admite enlaces directos de YouTube o SoundCloud.");
            }

            // --- FILTRO DE SEGURIDAD (EL PARCHE) ---
            if (duracionSegundos > LIMITE_SEGUNDOS) {
                const minutosDetectados = Math.floor(duracionSegundos / 60);
                return await interaction.editReply(`⛔ **Petición denegada:** La pista dura ${minutosDetectados} minutos. Por seguridad, el límite máximo permitido en la radio es de 8 minutos.`);
            }

            // Inserción en la Base de Datos de la Radio
            const nuevaPista = new ColaReproduccion({
                title: tituloExtraido,
                source: url,
                solicitado_por: interaction.user.username
            });

            await nuevaPista.save();

            await interaction.editReply(`📻 **¡Señal recibida y aprobada!**\n🎶 **${tituloExtraido}** se ha añadido a la cola de Marina Gaming Radio.`);

        } catch (error) {
            console.error("Fallo al procesar la petición de radio:", error);
            await interaction.editReply("⚡ Interferencia grave. No pude registrar la pista en la base de datos.");
        }
    }
    
    if (interaction.commandName === 'actualizaciones') {
        await interaction.deferReply(); 
        try {
            let reporteParche = await obtenerUltimoParche(interaction.options.getString('juego'), model);
            await interaction.editReply(reporteParche.length > 2000 ? reporteParche.substring(0, 1995) + "..." : reporteParche);
        } catch (error) { await interaction.editReply("⚡ Falla crítica analizando el parche."); }
    }

    if (interaction.commandName === 'medallas') {
        const marino = interaction.options.getString('marino');
        const nombreBuscado = marino ? marino.toLowerCase() : interaction.user.username.toLowerCase();
        const carpetaBanners = path.join(__dirname, 'banners');
        
        let bannerEncontrado = null, disponibles = [];
        if (fs.existsSync(carpetaBanners)) {
            const archivos = fs.readdirSync(carpetaBanners);
            disponibles = archivos.filter(a => a.toLowerCase().endsWith('.png')).map(a => a.replace(/\.png$/i, ''));
            bannerEncontrado = archivos.find(a => a.toLowerCase() === `${nombreBuscado}.png`);
        }

        if (bannerEncontrado) {
            const bannerImagen = new AttachmentBuilder(path.join(carpetaBanners, bannerEncontrado));
            await interaction.reply({ 
                content: marino ? `Extrayendo historial de **${nombreBuscado}**:` : `Aquí tienes tu historial táctico, **${nombreBuscado}**:`, 
                files: [bannerImagen] 
            });
        } else {
            let msg = marino ? `Mis registros indican que **${nombreBuscado}** no tiene medallas.` : `Parece que tu historial está en blanco.`;
            msg += disponibles.length > 0 ? `\n\nBanners activos: **${disponibles.join(', ')}**.` : `\n\nLa base de datos está vacía.`;
            await interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
        }
    }
});

// ---------------------------------------------------------------------
// ENCENDIDO DEL SISTEMA (CORRECCIÓN DE DISCORD.JS v14+)
// ---------------------------------------------------------------------
client.once("clientReady", (c) => {
    console.log(`🤖 Enlace neuronal establecido. ${c.user.tag} (Cortana-Protocol) en línea sin errores.`);
    iniciarAutomatizacion(c, model, NoticiaDB);
});

client.login(process.env.DISCORD_TOKEN);