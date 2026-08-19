// ==========================================
// PARCHE DE RED PARA RENDER (Forzar IPv4)
// ==========================================
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
require("dotenv").config();
const { ActionRowBuilder, StringSelectMenuBuilder, ComponentType, Client, IntentsBitField, Partials, EmbedBuilder, MessageFlags, AttachmentBuilder } = require("discord.js");
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
// --- FUNCIÓN TÁCTICA: Convierte segundos a formato MM:SS ---
function formatoTiempo(segundos) {
    if (!segundos || segundos === 0) return "Desconocido";
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
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
    // MÓDULO B: ASISTENTE GENERAL / CORTANA
    if (message.mentions.has(client.user)) {
        await message.channel.sendTyping();
        try {
            const promptActual = message.content.replace(`<@${client.user.id}>`, '').trim();
            if (!promptActual) return message.reply("¿Me llamas y no me dices nada? dime qué ronda por tu cabeza.");

            let infoMenciones = "";
            if (message.mentions.users.size > 0) {
                for (const [userId, usuario] of message.mentions.users) {
                    if (userId !== client.user.id) {
                        try {
                            const miembroServidor = await message.guild.members.fetch(userId);
                            const nombreReal = miembroServidor.nickname || usuario.username;
                            const nombresRoles = miembroServidor.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ');
                            const esBot = usuario.bot ? "SÍ" : "NO";                            
                            infoMenciones += `[Nombre: ${nombreReal}, Etiqueta: <@${userId}>, Bot?: ${esBot}, Roles: ${nombresRoles || 'Ninguno'}]. `;
                        } catch (e) { 
                            infoMenciones += `[Nombre: ${usuario.username}, Etiqueta: <@${userId}> (No se pudo recuperar roles)]. `; 
                        }
                    }
                }
            }

            let conversationLog = await message.channel.messages.fetch({ limit: 15 });
            conversationLog = Array.from(conversationLog.values()).reverse();
            let historialTexto = "HISTORIAL:\n";
            conversationLog.forEach(msg => {
                historialTexto += msg.author.id === client.user.id ? `MARbot: ${msg.content}\n` : `${msg.author.username}: ${msg.content}\n`;
            });

            const promptFinal = `${historialTexto}\n\n[DATOS USUARIOS MENCIONADOS: ${infoMenciones}]\n\n[INFO SISTEMA: Te está hablando el usuario ${message.author.username}. Si necesitas etiquetarlo, usa estrictamente su etiqueta: <@${message.author.id}>]\n\nMENSAJE ACTUAL: ${promptActual}\n\nResponde adoptando tu personalidad. IMPORTANTE: Cuando menciones a un usuario, estás OBLIGADO a usar su formato de Etiqueta exacta (<@ID>).`;

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
            const etiquetaNoticias = "<@&881321830927962162>"; 
            const textoFinal = `${etiquetaNoticias}\n${reporte}`;
            await interaction.editReply(textoFinal.length > 2000 ? textoFinal.substring(0, 1995) + "..." : textoFinal);
        } catch (error) { await interaction.editReply("⚡ Interferencia en los servidores."); }
    }

    if (interaction.commandName === 'noticia-extendida') {
        await interaction.deferReply(); 
        try {
            let reporte = await compilarNoticiaExtendida(model, NoticiaDB);
            const etiquetaNoticias = "<@&881321830927962162>"; 
            const textoFinal = `${etiquetaNoticias}\n${reporte}`;
            await interaction.editReply(textoFinal.length > 2000 ? textoFinal.substring(0, 1995) + "..." : textoFinal);
        } catch (error) { await interaction.editReply("⚡ Interferencia. No pude redactar el artículo."); }
    }

    if (interaction.commandName === 'gratis') {
        await interaction.deferReply(); 
        try {
            let reporteEpic = await obtenerJuegoGratisEpic();
            await interaction.editReply(reporteEpic.length > 2000 ? reporteEpic.substring(0, 1995) + "..." : reporteEpic);
        } catch (error) { await interaction.editReply("⚡ Error al desplegar el radar de Epic."); }
    }

// --- NUEVO COMANDO: /play (Búsqueda Interactiva VIP + Tiempos + Cancelar) ---
    if (interaction.commandName === 'play') {
        await interaction.deferReply(); 
        
        const peticion = interaction.options.getString('peticion');
        const LIMITE_SEGUNDOS = 480; // 8 minutos

        try {
            // 1. EVALUAR SI ES UNA URL DIRECTA
            if (peticion.startsWith('http://') || peticion.startsWith('https://')) {
                let tituloExtraido = "";
                let duracionSegundos = 0;

                if (peticion.includes('youtube.com') || peticion.includes('youtu.be')) {
                    const regexID = /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/;
                    const match = peticion.match(regexID);
                    if (!match) return await interaction.editReply("⚠️ **Petición rechazada:** El enlace de YouTube no parece válido.");
                    const videoId = match[1];

                    const ytApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${process.env.YOUTUBE_API_KEY}`;
                    const respuesta = await fetch(ytApiUrl);
                    const datos = await respuesta.json();

                    if (!datos.items || datos.items.length === 0) return await interaction.editReply("⚠️ **Petición rechazada:** El video no existe o es privado.");
                    tituloExtraido = datos.items[0].snippet.title;
                    duracionSegundos = convertirDuracionYT(datos.items[0].contentDetails.duration);
                } else if (peticion.includes('soundcloud.com')) {
                    const infoPista = await play.soundcloud(peticion);
                    tituloExtraido = infoPista.name || "Petición de SoundCloud";
                    duracionSegundos = infoPista.durationInSec || 0;
                } else {
                    return await interaction.editReply("⚠️ **Petición rechazada:** Solo admito enlaces directos de YouTube o SoundCloud.");
                }

                if (duracionSegundos > LIMITE_SEGUNDOS) {
                    return await interaction.editReply(`⛔ **Petición denegada:** La pista supera el límite de 8 minutos de la radio.`);
                }

                const nuevaPista = new ColaReproduccion({
                    title: tituloExtraido,
                    source: peticion,
                    solicitado_por: interaction.user.username
                });
                await nuevaPista.save();
                return await interaction.editReply(`📻 **¡Señal recibida y aprobada!**\n🎶 **${tituloExtraido}** se ha añadido a Marina Gaming Radio.`);
            } 
            
            // 2. MODO BÚSQUEDA (El usuario ingresó texto)
            let opcionesBusqueda = [];
            let datosOpciones = {}; // Memoria táctica para guardar datos sin romper los límites de Discord

            // A) Buscar en YouTube (3 resultados)
            const ytSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(peticion)}&key=${process.env.YOUTUBE_API_KEY}`;
            const ytRes = await fetch(ytSearchUrl);
            const ytData = await ytRes.json();

            if (ytData.items && ytData.items.length > 0) {
                // Truco maestro: Extraer las duraciones de los 3 videos en una sola petición
                const videoIds = ytData.items.map(item => item.id.videoId).join(',');
                const ytVideosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`;
                const ytVideosRes = await fetch(ytVideosUrl);
                const ytVideosData = await ytVideosRes.json();

                const duracionesMap = {};
                if (ytVideosData.items) {
                    ytVideosData.items.forEach(v => {
                        duracionesMap[v.id] = convertirDuracionYT(v.contentDetails.duration);
                    });
                }

                ytData.items.forEach(item => {
                    const idMenu = `YT_${item.id.videoId}`;
                    const duracionSeg = duracionesMap[item.id.videoId] || 0;
                    
                    datosOpciones[idMenu] = {
                        titulo: item.snippet.title,
                        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                        duracion: duracionSeg
                    };

                    opcionesBusqueda.push({
                        label: item.snippet.title.substring(0, 95),
                        description: `🔴 YouTube | ⏱️ Duración: ${formatoTiempo(duracionSeg)}`,
                        value: idMenu
                    });
                });
            }

            // B) Buscar en SoundCloud (2 resultados)
            try {
                const scSearch = await play.search(peticion, { source: { soundcloud: 'tracks' }, limit: 2 });
                scSearch.forEach((track, index) => {
                    const idMenu = `SC_${index}`;
                    const duracionSeg = track.durationInSec || 0;

                    datosOpciones[idMenu] = {
                        titulo: track.name,
                        url: track.url,
                        duracion: duracionSeg
                    };

                    opcionesBusqueda.push({
                        label: track.name.substring(0, 95),
                        description: `🟠 SoundCloud | ⏱️ Duración: ${formatoTiempo(duracionSeg)}`,
                        value: idMenu
                    });
                });
            } catch (err) {
                console.error("Fallo leve en búsqueda SC:", err);
            }

            if (opcionesBusqueda.length === 0) {
                return await interaction.editReply("⚠️ **Radares limpios:** No encontré resultados para esa búsqueda.");
            }

            // --- C) OPCIÓN DE CANCELAR ---
            opcionesBusqueda.push({
                label: '❌ No está la canción que busco',
                description: 'Abortar misión y cerrar el radar.',
                value: 'CANCELAR_BUSQUEDA'
            });

            // D) Diseño visual del Embed
            const menu = new StringSelectMenuBuilder()
                .setCustomId('seleccion_radio')
                .setPlaceholder('Despliega el escáner para ver las opciones...')
                .addOptions(opcionesBusqueda);

            const fila = new ActionRowBuilder().addComponents(menu);

            const embed = new EmbedBuilder()
                .setColor('#00bfff') // Azul cian táctico
                .setTitle('📡 Radares de Búsqueda Activos')
                .setDescription(`He interceptado las siguientes frecuencias para **"${peticion}"**.\n\n👇 **Utiliza el menú desplegable abajo para evaluar la duración y encolar tu pista:**`)
                .setFooter({ 
                    text: `Solicitado por ${interaction.user.username} • Selecciona "No está la canción" para abortar`, 
                    iconURL: interaction.user.displayAvatarURL() 
                });

            const mensaje = await interaction.editReply({ embeds: [embed], components: [fila] });

            // E) Escuchar la respuesta (Filtro de 60 seg)
            const recolector = mensaje.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

            recolector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: '⛔ Acceso denegado. Este radar pertenece a otro usuario.', ephemeral: true });
                }

                await i.deferUpdate(); // Marcar clic como recibido

                const seleccion = i.values[0];

                // Lógica del botón de Cancelar
                if (seleccion === 'CANCELAR_BUSQUEDA') {
                    return interaction.editReply({ 
                        content: '❌ **Búsqueda cancelada.**\nPuedes intentar buscar de nuevo usando el comando `/play` e ingresando palabras clave más específicas (ej. "Nombre de la pista + Autor").', 
                        embeds: [], 
                        components: [] 
                    });
                }

                const datosFinales = datosOpciones[seleccion];

                // Escudo de 8 minutos integrado en la interfaz
                if (datosFinales.duracion > LIMITE_SEGUNDOS) {
                    return interaction.editReply({ 
                        content: `⛔ **Petición denegada:** La pista seleccionada dura más de 8 minutos. Por seguridad, la transmisión no lo permite.`, 
                        embeds: [], 
                        components: [] 
                    });
                }

                // Inserción en Base de Datos
                try {
                    const pistaElegida = new ColaReproduccion({
                        title: datosFinales.titulo,
                        source: datosFinales.url,
                        solicitado_por: interaction.user.username
                    });
                    await pistaElegida.save();

                    await interaction.editReply({ 
                        content: `📻 **¡Solicitud añadida con éxito!**\n🎶 **${datosFinales.titulo}**\n\nSintoniza Marina Gaming Radio para escucharla.`,
                        embeds: [], 
                        components: [] 
                    });
                } catch (errorDb) {
                    await interaction.editReply({ content: '⚡ Interferencia grave. Fallo al guardar en la base de datos.', embeds: [], components: [] });
                }
            });

            recolector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.editReply({ content: '⏱️ **Tiempo agotado.** El radar de búsqueda se ha cerrado por inactividad.', embeds: [], components: [] });
                }
            });

        } catch (error) {
            console.error("Fallo general en comando play:", error);
            await interaction.editReply("⚡ Falla catastrófica en los sistemas de comunicación. Intenta de nuevo.");
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


// ==========================================
// SONDA DE RED MANUAL (Prueba de Cloudflare)
// ==========================================
console.log("🔍 LANZANDO SONDA DE RED HACIA DISCORD...");
fetch("https://discord.com/api/v10/gateway")
    .then(async (res) => {
        console.log(`📡 Respuesta de la barrera de Discord: STATUS ${res.status}`);
        const texto = await res.text();
        console.log(`📄 Detalles de la barrera: ${texto.substring(0, 100)}...`);
    })
    .catch(err => console.error(`❌ La sonda se destruyó en el camino:`, err.message));
// ==========================================
// RASTREADOR DE RED PROFUNDO (Eliminar cuando funcione)
// ==========================================
client.on("debug", (info) => {
    console.log(`[RADAR DISCORD]: ${info}`);
});

// ---------------------------------------------------------------------
// ENCENDIDO DEL SISTEMA
// ---------------------------------------------------------------------
// CAMBIO CRÍTICO: El evento se llama "ready", no "clientReady"
client.once("ready", (c) => {
    console.log(`🤖 Enlace neuronal establecido. ${c.user.tag} (Cortana-Protocol) en línea sin errores.`);
    // iniciarAutomatizacion(c, model, NoticiaDB); // Descomenta esto si ya tienes esa función lista
});

console.log("⏳ Iniciando secuencia de login con Discord...");

client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log("✅ Token aceptado por los servidores de Discord."))
    .catch(err => console.error("❌ Fallo crítico de autenticación:", err));