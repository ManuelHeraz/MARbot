const cron = require('node-cron');
const { compilarReporteNoticias, compilarNoticiaExtendida, obtenerJuegoGratisEpic, obtenerUltimoParche } = require('../services/radares');

function iniciarAutomatizacion(client, model, NoticiaDB) {
    console.log("⏱️ Sistema de rutinas automatizadas (Cron Jobs) en línea.");

    // =======================================================
    // MÓDULO E: NOTICIERO AUTOMATIZADO (11 AM y 11 PM)
    // =======================================================
    cron.schedule('0 11,23 * * *', async () => {
        console.log("Iniciando escaneo automático de noticias RSS (Resumen Corto)...");
        const ID_CANAL_NOTICIAS = '782813647629582366';
        const canalNoticias = client.channels.cache.get(ID_CANAL_NOTICIAS);
        
        if (!canalNoticias) return console.error("Error Táctico: No se encontró el canal de noticias.");

        try {
            let reporte = await compilarReporteNoticias(model);
            if (reporte && reporte.length > 2000) reporte = reporte.substring(0, 1995) + "...";
            if (reporte) await canalNoticias.send(reporte);
        } catch (error) {
            console.error("Fallo al emitir noticias programadas:", error);
        }
    }, { timezone: "America/Mexico_City" });

    // =======================================================
    // MÓDULO F: PUBLICACIÓN WEB AUTÓNOMA (12:00 PM Diario)
    // =======================================================
    cron.schedule('0 12 * * *', async () => {
        console.log("Iniciando redacción autónoma para la página web...");
        try {
            // ¡Corregido el doble await!
            await compilarNoticiaExtendida(model, NoticiaDB);
            console.log("Actualización web completada. Base de datos sincronizada.");
            
            const ID_CANAL_NOTICIAS = '782813647629582366';
            const canalNoticias = client.channels.cache.get(ID_CANAL_NOTICIAS);
            
            if (canalNoticias) {
                await canalNoticias.send("🌐 **¡Atención Comunidad de Marina Gaming!** Acabo de publicar un nuevo artículo para Marina Gaming Noticias!. ¡Vayan a leerlo a la sección de *Noticias Gaming* en la página web oficial!: https://manuelheraz.github.io/MarinaGaming/pages/notigaming/index.html");
            }
        } catch (error) {
            console.error("Fallo en la publicación web automática:", error);
        }
    }, { timezone: "America/Mexico_City" });

    // =======================================================
    // MÓDULO G: ALERTA EPIC GAMES (JUEVES A LAS 10:05 AM)
    // =======================================================
    cron.schedule('5 10 * * 4', async () => {
        console.log("Iniciando escaneo automático de Epic Games...");
        const ID_CANAL_EPIC = '892245997365887066';
        const canalEpic = client.channels.cache.get(ID_CANAL_EPIC);
        
        if (!canalEpic) return console.error("Error Táctico: No se encontró el canal de Epic Games.");

        try {
            let reporteEpic = await obtenerJuegoGratisEpic();
            if (reporteEpic && reporteEpic.length > 2000) reporteEpic = reporteEpic.substring(0, 1995) + "...";
            if (reporteEpic && !reporteEpic.includes("Los radares no detectan")) {
                await canalEpic.send(reporteEpic + "\n@everyone");
            }
        } catch (error) {
            console.error("Fallo al emitir el reporte automático de Epic:", error);
        }
    }, { timezone: "America/Mexico_City" });

    // =======================================================
    // MÓDULO H: RADAR AUTOMÁTICO DE PARCHES (CADA 72 HRS, ESCALONADO)
    // =======================================================
    
    // Tabla maestra de operaciones: [ID_Juego, Nombre, Horario Cron, Canales]
    // El "*/3" significa "cada 3 días" (72 horas)
    const tareasParches = [
        { id: 'gta5', nombre: 'GTA V', cron: '0 14 */3 * *', canales: ['867860009169059911', '867857989360418856', '1129112695136845985', '867859003950628915'] },
        { id: 'minecraft', nombre: 'Minecraft', cron: '15 14 */3 * *', canales: ['867865964787531806'] },
        { id: 'apex', nombre: 'Apex Legends', cron: '30 14 */3 * *', canales: ['867858609886724106'] },
        { id: 'fortnite', nombre: 'Fortnite', cron: '45 14 */3 * *', canales: ['939249194798055484'] },
        { id: 'forza6', nombre: 'Forza Horizon', cron: '0 15 */3 * *', canales: ['907731983990411305'] },
        { id: 'halo_global', nombre: 'Franquicia Halo', cron: '15 15 */3 * *', canales: ['867860956306472960'] },
        { id: 'overwatch', nombre: 'Overwatch 2', cron: '30 15 */3 * *', canales: ['867865349340528650'] },
        { id: 'r6', nombre: 'Rainbow Six Siege', cron: '45 15 */3 * *', canales: ['867864083877724190'] },
        { id: 'rocket', nombre: 'Rocket League', cron: '0 16 */3 * *', canales: ['867865728945750066'] },
        { id: 'warzone', nombre: 'Call of Duty: Warzone', cron: '15 16 */3 * *', canales: ['867867438438678579'] }
    ];

    // MARbot despliega un radar por cada juego en la tabla automáticamente
    tareasParches.forEach(tarea => {
        cron.schedule(tarea.cron, async () => {
            console.log(`[Rastreo Activo] Iniciando escaneo de ${tarea.nombre}...`);
            
            try {
                let reporte = await obtenerUltimoParche(tarea.id, model);
                
                // Si el reporte es válido (no es error ni vacío)
                if (reporte && !reporte.includes("No detecto transmisiones") && !reporte.includes("Interferencia")) {
                    
                    let mensajeFinal = `🚨 **¡NUEVO INFORME SOBRE ${tarea.nombre.toUpperCase()}!** 🚨\n\n` + reporte;
                    
                    if (mensajeFinal.length > 2000) {
                        mensajeFinal = mensajeFinal.substring(0, 1995) + "...";
                    }
                    
                    // Bombardeo multicanal
                    for (const idCanal of tarea.canales) {
                        if (idCanal === 'PON_AQUI_EL_ID_DE_HALO') continue; // Evita errores si olvidas poner el ID

                        const canalDestino = client.channels.cache.get(idCanal);
                        if (canalDestino) {
                            await canalDestino.send(mensajeFinal);
                        } else {
                            console.warn(`Aviso Táctico: Canal ${idCanal} no encontrado para ${tarea.nombre}`);
                        }
                    }
                }
            } catch (error) {
                console.error(`Fallo crítico al emitir parche de ${tarea.nombre}:`, error);
            }
        }, { timezone: "America/Mexico_City" });
    });

}

module.exports = { iniciarAutomatizacion };