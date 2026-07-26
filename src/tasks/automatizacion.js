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
    // MÓDULO H: RADAR AUTOMÁTICO DE PARCHES (2:00 PM DIARIO)
    // =======================================================
    cron.schedule('0 14 * * *', async () => {
        console.log("Iniciando escaneo diario de parches de videojuegos...");
        const canalesGTA = [
            '867860009169059911', '867857989360418856', '1129112695136845985', '867859003950628915'
        ];

        try {
            let reporteGTA = await obtenerUltimoParche('gta5', model);
            
            if (reporteGTA && !reporteGTA.includes("No detecto transmisiones") && !reporteGTA.includes("Interferencia")) {
                let mensajeFinal = "🚨 **¡NUEVO INFORME SOBRE GTA V!** 🚨\n\n" + reporteGTA;
                if (mensajeFinal.length > 2000) mensajeFinal = mensajeFinal.substring(0, 1995) + "...";
                
                for (const idCanal of canalesGTA) {
                    const canalDestino = client.channels.cache.get(idCanal);
                    if (canalDestino) await canalDestino.send(mensajeFinal);
                }
            }
        } catch (error) {
            console.error("Fallo al emitir parches automáticos:", error);
        }
    }, { timezone: "America/Mexico_City" });

}

module.exports = { iniciarAutomatizacion };