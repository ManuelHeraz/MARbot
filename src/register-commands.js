require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");

const commands = [
    {
        name: "que",
        description: "responde con so a cada que",
    },
{
        name: "medallas",
        description: "Muestra el banner de medallas de un integrnate (o el tuyo).",
        options: [
            {
                name: "miembro",
                description: "Selecciona a un integrante de la lista (déjalo en blanco para ver el tuyo).",
                type: ApplicationCommandOptionType.String,
                required: false, // Es falso para que puedan mandarlo vacío y ver el propio
                autocomplete: true // ¡Esta es la magia del menú desplegable!
            }
        ]
    },
    {
            name: "noticias",
            description: "Fuerza a MARbot a escanear las noticias sobre gaming.",
        },
        {
        name: 'actualizaciones',
        description: 'Obtén el resumen del último parche o actualización de tus juegos favoritos.',
        options: [
            {
                name: 'juego',
                description: 'Selecciona el juego que deseas escanear',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: 'Minecraft', value: 'minecraft' },
                    { name: 'GTA V / Online', value: 'gta5' },
                    { name: 'Apex Legends', value: 'apex' },
                    { name: 'Fortnite', value: 'fortnite' },
                    { name: 'Forza Horizon 6', value: 'forza6' },
                    { name: 'Halo (Franquicia)', value: 'halo_global' },
                    { name: 'Halo: The Master Chief Collection', value: 'halo_mcc' },
                    { name: 'Halo Infinite', value: 'halo_infinite' },
                    { name: 'Overwatch 2', value: 'overwatch' },
                    { name: 'Rainbow Six Siege', value: 'r6' },
                    { name: 'Rocket League', value: 'rocket' },
                    { name: 'Call of Duty: Warzone', value: 'warzone' }
                ]
            }
        ]
    },
    {
    name: 'status',
    description: 'Verifica si los servidores de las consolas o tiendas están caídos.',
    options: [
        {
            name: 'plataforma',
            description: 'Elige la plataforma a escanear',
            type: 3, // El número 3 significa "STRING" (Texto) en Discord.js
            required: true,
            choices: [
                { name: 'Xbox Live', value: 'xbox' },
                { name: 'PlayStation Network', value: 'psn' },
                { name: 'Steam', value: 'steam' },
                { name: 'Epic Games', value: 'epic' },
                { name: 'Nintendo', value: 'nintendo' }
            ]
        }
    ]
},
    {
        name: "noticia-extendida",
        description: "Genera una nota sobre una noticia del gaming y la guarda en la página web.",
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
    name: 'play',
    description: 'Solicita una canción a la Marina Gaming Radio.',
    options: [
        {
            name: 'url',
            description: 'Enlace válido de YouTube o SoundCloud.',
            type: 3, // Tipo STRING
            required: true
        }
    ]
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