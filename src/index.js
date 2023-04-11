require("dotenv").config();
const { Client, IntentsBitField, EmbedBuilder } = require("discord.js");

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on("ready", (c)=> {
    console.log(`${c.user.tag} esta vivo.`)
});

client.on("messageCreate", (message) => {
    if (message.author.bot){
        return;
    }

    if (message.content === "que") {
        message.reply("so")
    }
});



client.on("interactionCreate", (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    console.log(interaction.commandName)

    if(interaction.commandName == "que") {
        interaction.reply("so")
    }

    if(interaction.commandName == "embed") {
        const embed = new EmbedBuilder()
            .setTitle("Titulo del embed")
            .setDescription("Esta es la descripción del embed")
            .setColor("Random")
            .addFields({ name: "Field title", value: "Some random value", inline: true })
            .addFields({ name: "2Field title", value: "2Some random value", inline: true })

        interaction.reply({ embeds: [embed] });
    }

    if(interaction.commandName == "add") {
        const num1 = interaction.options.get("primer-numero")?.value;
        const num2 = interaction.options.get("segundo-numero")?.value;

       interaction.reply(`Tú primer numero es ${num1} y el segundo es ${num2} y al sumarlos da ${num1 + num2} ... sí, lo sé, este comando es muy util :v`)
    }

});

client.login(
    process.env.TOKEN
);