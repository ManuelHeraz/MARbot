require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType, Application } = require("discord.js")
const commands = [
    {
        name: "que",
        description: "responde con so a cada que",
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
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("Registrando slash commands...")

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.
            GUILD_ID),
            { body: commands }
        )

        console.log("Slash commands registrados exitosamente")

    } catch (error) {
        console.log(`El registro falló exitosamente: ${error}`)
    }
})();