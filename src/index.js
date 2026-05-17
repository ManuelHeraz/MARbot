require("dotenv").config();
const { Client, IntentsBitField, Partials } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require('express');

// ==========================================
// 1. CONFIGURACIÓN DEL SERVIDOR WEB (KEEP-ALIVE)
// Esto evita que los hostings gratuitos apaguen el bot
// ==========================================
const app = express();
app.get('/', (req, res) => res.send('El sistema de comunicaciones de Marina Gaming está en línea.'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`📡 Señal web transmitiendo en puerto ${port}`));

// ==========================================
// 2. INICIALIZACIÓN DE GEMINI
// ==========================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Modelo rápido y eficiente para chat
    systemInstruction: `Eres el bot asistente oficial de 'Marina Gaming', una comunidad de videojuegos libre de toxicidad. 
    Tu creador es el Alto Mando (JoelHeaz y ARC NAHUAL). 
    Tu objetivo es ayudar a los usuarios a entender la comunidad. 
    Debes saber que:
    - Tenemos un sistema de medallas y rangos por XP basado en la participación.
    - MAR TV es nuestra plataforma de transmisión sincronizada de películas y series y Radio Marina Gaming es nuestra propia radio con musica gamer 24/7, dentro del discord la gente puede solicitar musica o peliculas.
    - Mantén un tono amigable, servicial y con una ligera temática táctica/gamer. Nunca rompas tu personaje de asistente de la Marina.`,
});

// ==========================================
// 3. CONFIGURACIÓN DE DISCORD
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
    console.log(`🤖 ${c.user.tag} conectado y listo para asistir a la comunidad Marina Gaming.`);
});

client.on("messageCreate", async (message) => {
    // Ignorar a otros bots
    if (message.author.bot) return;

    // Comandos heredados (Legado)
    if (message.content === "!medallas") {
        return message.reply(`Puedes revisar el funcionamiento del sistema en el canal #🏅-lista-de-medallas o visitando nuestra Wiki Oficial en la web.`);
    }

    // Interacción inteligente: Cuando alguien menciona al bot (@MARbot)
    if (message.mentions.has(client.user)) {
        await message.channel.sendTyping();

        try {
            // Limpiar la mención del texto para que Gemini solo lea la pregunta
            const prompt = message.content.replace(`<@${client.user.id}>`, '').trim();

            if (!prompt) {
                return message.reply("¡Comando recibido! ¿En qué puedo ayudarte hoy, recluta?");
            }

            // Consultar a Gemini
            const result = await model.generateContent(prompt);
            const response = result.response.text();

            // Límite de seguridad de Discord (2000 caracteres)
            if (response.length > 2000) {
                return message.reply(response.substring(0, 1995) + "...");
            }

            message.reply(response);

        } catch (error) {
            console.error("Fallo de comunicación con la IA:", error);
            message.reply("⚠️ Interferencia en las comunicaciones. No pude procesar esa solicitud.");
        }
    }
});

client.login(process.env.TOKEN);