const discord = require("discord.js");
const config = require("./config.json");

const client = new discord.Client({ intents: [discord.GatewayIntentBits.Guilds, discord.GatewayIntentBits.GuildMessages, discord.GatewayIntentBits.DirectMessages, discord.GatewayIntentBits.MessageContent], partials: [discord.PartialTextBasedChannel, discord.PartialGroupDMChannel] });

client.once(discord.Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(discord.Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith("!bob")) {
        message.reply("school")
    }
});

client.login(config.discordapi.token);
