const Parser = require('rss-parser');
const parser = new Parser();
const https = require('https');

// ==========================================
// FUNCIÓN 1: REPORTE RÁPIDO
// ==========================================
async function compilarReporteNoticias(model) {
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
    2. Omite política y descuentos a menos de que sean cosas GRATIS.
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
// FUNCIÓN 2: NOTA EXTENDIDA WEB
// ==========================================
async function compilarNoticiaExtendida(model, NoticiaDB) {
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

    let historialReciente = "";
    try {
        const ultimasNoticias = await NoticiaDB.find().sort({ fecha: -1 }).limit(3);
        if (ultimasNoticias.length > 0) {
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
// FUNCIÓN 3: RADAR EPIC GAMES
// ==========================================
async function obtenerJuegoGratisEpic() {
    try {
        const data = await new Promise((resolve, reject) => {
            const opciones = {
                hostname: 'store-site-backend-static.ak.epicgames.com',
                path: '/freeGamesPromotions?locale=es-MX&country=MX&allowCountries=MX',
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            };

            const req = https.request(opciones, (res) => {
                let cuerpoDato = '';
                res.on('data', (chunk) => cuerpoDato += chunk);
                res.on('end', () => {
                    try { resolve(JSON.parse(cuerpoDato)); } 
                    catch (e) { reject(new Error("Fallo al decodificar JSON de Epic")); }
                });
            });

            req.on('error', (e) => reject(e));
            req.end();
        });
        
        const juegos = data.data.Catalog.searchStore.elements;
        let mensaje = "🎁 **¡ALERTA DE JUEGOS GRATUITOS EN EPIC GAMES!** 🎁\n\n";
        let hayJuegos = false;
        let juegosAgregados = 0;

        juegos.forEach(juego => {
            if (juego.promotions && juego.promotions.promotionalOffers && juego.promotions.promotionalOffers.length > 0) {
                const precioActual = juego.price?.totalPrice?.discountPrice;
                if (precioActual !== 0) return;
                if (juegosAgregados >= 4) return; 

                const ofertas = juego.promotions.promotionalOffers[0].promotionalOffers;
                
                if (ofertas.length > 0) {
                    const oferta = ofertas[0];
                    const fechaFin = new Date(oferta.endDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    
                    const slug = juego.catalogNs?.mappings?.[0]?.pageSlug || juego.productSlug || juego.urlSlug;
                    const urlJuego = slug ? `https://store.epicgames.com/es-MX/p/${slug}` : `https://store.epicgames.com/es-MX/free-games`;

                    let descCorta = juego.description || "Sin descripción.";
                    if (descCorta.length > 120) { descCorta = descCorta.substring(0, 117) + "..."; }

                    mensaje += `🎮 **${juego.title}**\n📝 *${descCorta}*\n⏳ **Disponible hasta:** ${fechaFin}\n🔗 **Reclamar:** ${urlJuego}\n\n`;
                    hayJuegos = true;
                    juegosAgregados++;
                }
            }
        });

        if (!hayJuegos) return "Los radares no detectan juegos gratis en Epic Games en este momento. Volveré a escanear pronto.";
        return mensaje;
    } catch (error) {
        console.error("Error al obtener juegos de Epic:", error);
        return "⚡ Interferencia en los servidores de Epic Games.";
    }
}

// ==========================================
// FUNCIÓN 4: RADAR DE ESTADO
// ==========================================
async function obtenerStatusPlataforma(plataforma) {
    try {
        if (plataforma === 'epic') {
            const data = await new Promise((resolve, reject) => {
                const opciones = { hostname: 'status.epicgames.com', path: '/api/v2/status.json', method: 'GET' };
                const req = https.request(opciones, (res) => {
                    let cuerpoDato = '';
                    res.on('data', (chunk) => cuerpoDato += chunk);
                    res.on('end', () => {
                        try { resolve(JSON.parse(cuerpoDato)); } 
                        catch (e) { reject(e); }
                    });
                });
                req.on('error', (e) => reject(e));
                req.end();
            });

            const estadoGlobal = data.status.description;
            const indicador = estadoGlobal.includes("All Systems Operational") ? "🟢 **ÓPTIMO**" : "🔴 **FALLAS DETECTADAS**";
            return `📡 **Telemetría de Epic Games:**\nEstado actual: ${indicador}\nReporte oficial: *${estadoGlobal}*\nVer radar: https://status.epicgames.com/`;
        }

        const radares = {
            'xbox': { nombre: 'Xbox Live', link: 'https://support.xbox.com/es-MX/xbox-live-status', emoji: '🟢' },
            'psn': { nombre: 'PlayStation Network', link: 'https://status.playstation.com/es-mx/', emoji: '🔵' },
            'steam': { nombre: 'Steam', link: 'https://steamstat.us/', emoji: '💨' },
            'nintendo': { nombre: 'Nintendo Switch Online', link: 'https://www.nintendo.co.jp/netinfo/es/index.html', emoji: '🔴' }
        };

        const info = radares[plataforma];
        if (info) return `${info.emoji} **Rastreo de ${info.nombre}:**\nLos servidores de esta plataforma están blindados contra escaneos de IA. \n🔗 **Revisa el radar oficial en tiempo real aquí:** ${info.link}`;

        return "Plataforma no reconocida en mis bases de datos.";
    } catch (error) {
        console.error("Error al obtener status:", error);
        return "⚡ Interferencia electromagnética. No pude acceder a los datos de los servidores.";
    }
}

// ==========================================
// FUNCIÓN 5: RADAR DE PARCHES
// ==========================================
async function obtenerUltimoParche(juegoId, model) {
    const radaresJuegos = {
        'minecraft': { nombre: 'Minecraft', url: 'https://news.google.com/rss/search?q=Minecraft+patch+notes+update&hl=en-US&gl=US&ceid=US:en' },
        'fortnite': { nombre: 'Fortnite', url: 'https://news.google.com/rss/search?q=Fortnite+patch+notes+update&hl=en-US&gl=US&ceid=US:en' },
        'gta5': { nombre: 'GTA V / Online', url: 'https://store.steampowered.com/feeds/news/app/271590/' },
        'apex': { nombre: 'Apex Legends', url: 'https://store.steampowered.com/feeds/news/app/1172470/' },
        
        // --- NUEVOS RADARES GLOBALES (GOOGLE NEWS) ---
        'forza6': { nombre: 'Forza Horizon 6', url: 'https://news.google.com/rss/search?q=Forza+Horizon+6+update+patch+notes&hl=en-US&gl=US&ceid=US:en' },
        'halo_global': { nombre: 'Franquicia Halo (Global)', url: 'https://news.google.com/rss/search?q=Halo+Master+Chief+Collection+OR+Infinite+OR+Combat+Evolved+patch+notes+update&hl=en-US&gl=US&ceid=US:en' },
        
        // --- RADARES INDIVIDUALES DE HALO (STEAM) ---
        'halo_infinite': { nombre: 'Halo Infinite', url: 'https://store.steampowered.com/feeds/news/app/1240440/' },
        'halo_mcc': { nombre: 'Halo: TMCC', url: 'https://store.steampowered.com/feeds/news/app/976730/' },
        
        'overwatch': { nombre: 'Overwatch 2', url: 'https://store.steampowered.com/feeds/news/app/2356590/' },
        'r6': { nombre: 'Rainbow Six Siege', url: 'https://store.steampowered.com/feeds/news/app/359550/' },
        'rocket': { nombre: 'Rocket League', url: 'https://store.steampowered.com/feeds/news/app/252950/' },
        'warzone': { nombre: 'Call of Duty: Warzone', url: 'https://store.steampowered.com/feeds/news/app/1938090/' }
    };

    const juegoInfo = radaresJuegos[juegoId];
    if (!juegoInfo) return "Juego no clasificado en los escáneres.";

    try {
        const feed = await parser.parseURL(juegoInfo.url);
        if (!feed.items || feed.items.length === 0) return `No detecto transmisiones recientes de parches para **${juegoInfo.nombre}**.`;

        const ultimaActualizacion = feed.items[0];
        const fechaPublicacion = new Date(ultimaActualizacion.pubDate).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        const contenidoLimpio = (ultimaActualizacion.contentSnippet || ultimaActualizacion.content || "").substring(0, 1500);

        const promptTraduccion = `
        Eres MARbot, experta en videojuegos.
        He interceptado las últimas notas del parche para el juego: **${juegoInfo.nombre}**.
        Título de la nota: ${ultimaActualizacion.title}
        Texto crudo:
        "${contenidoLimpio}"
        
        TU MISIÓN:
        1. Traduce la información al español de forma natural.
        2. Resume de qué trata.
        3. Usa viñetas para destacar lo más importante.
        4. Sé directa, analítica y breve. Máximo 3 párrafos cortos.
        
        Inicia tu respuesta con:
        **[TÍTULO TRADUCIDO]**
        📅 *Fecha del reporte: ${fechaPublicacion}*
        
        [Tu resumen aquí]
        
        🔗 *Enlace oficial:* ${ultimaActualizacion.link}
        `;

        const result = await model.generateContent(promptTraduccion);
        return result.response.text();

    } catch (error) {
        console.error(`Error al rastrear parches de ${juegoId}:`, error);
        return `⚡ Interferencia en los servidores de **${juegoInfo.nombre}**. No pude descargar las notas.`;
    }
}

// Exportamos las armas para que el index.js las pueda usar
module.exports = {
    compilarReporteNoticias,
    compilarNoticiaExtendida,
    obtenerJuegoGratisEpic,
    obtenerStatusPlataforma,
    obtenerUltimoParche
};