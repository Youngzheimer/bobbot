const discord = require("discord.js");
const config = require("./config.json");
const axios = require("axios");

const client = new discord.Client({ intents: [discord.GatewayIntentBits.Guilds, discord.GatewayIntentBits.GuildMessages, discord.GatewayIntentBits.DirectMessages, discord.GatewayIntentBits.MessageContent], partials: [discord.PartialTextBasedChannel, discord.PartialGroupDMChannel] });

async function getbob(date, school, sc) {
    const bob = await axios.get(config.bobapi.url, {
        params: {
            KEY: config.bobapi.apikey,
            Type: "json",
            pIndex: 1,
            pSize: 5,
            ATPT_OFCDC_SC_CODE: sc,
            SD_SCHUL_CODE: school,
            MLSV_YMD: date
        }
    });

    console.log(bob)

    return bob.data.mealServiceDietInfo;
}


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
