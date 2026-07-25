require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");

const commands = [
    {
        name: "que",
        description: "responde con so a cada que",
    },
{
        name: "medallas",
        description: "Muestra el banner de medallas de un marino (o el tuyo).",
        options: [
            {
                name: "marino",
                description: "Selecciona a un marino de la lista (déjalo en blanco para ver el tuyo).",
                type: ApplicationCommandOptionType.String,
                required: false, // Es falso para que puedan mandarlo vacío y ver el propio
                autocomplete: true // ¡Esta es la magia del menú desplegable!
            }
        ]
    },
{
        name: "noticias",
        description: "Fuerza a MARbot a escanear la red y traer el reporte rápido.",
    },
    {
        name: "noticia-extendida",
        description: "Genera una nota extendida para redes sociales y la guarda en la página web.",
    },
    {
    name: 'gratis',
    description: 'Muestra los juegos que están gratis en Epic Games en este momento.'
    },
    {
        name: "embed",
        description: "envia un embed!",
    },
    {
        name: "add",
        description: "añade dos numeros",
        options: [
            {
                name: "primer-numero",
                description: "pues el primer numero",
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
            {
                name: "segundo-numero",
                description: "pues el segundo numero",
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
        ]
    },
    {
        name: "mensaje",
        description: "El bot enviará el mensaje que tú escribas, como si fuera él.",
        options: [
            {
                name: "texto",
                description: "Lo que quieres que diga el bot.",
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ]
    }
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log("Registrando slash commands...");

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );

        console.log("Slash commands registrados exitosamente");

    } catch (error) {
        console.log(`El registro falló: ${error}`);
    }
})();