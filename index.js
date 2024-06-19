const axios = require("axios");
const discord = require("discord.js");
const config = require("./config.json");
const moment = require("moment");

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

function makeBobEmbed(bob, day = moment().format('YYYYMMDD')) {
    const embed = new discord.EmbedBuilder()
        .setTitle(`${day} 급식`)
        .setColor(0x00ff00)
        .setTimestamp()
        .setFooter({ "text": "Powered by NEIS API" });

    Object.keys(bob).forEach(key => {
        embed.addFields({ name: key, value: bob[key] });
    });

    return embed;
}

const client = new discord.Client({ intents: [discord.GatewayIntentBits.Guilds, discord.GatewayIntentBits.GuildMessages, discord.GatewayIntentBits.DirectMessages, discord.GatewayIntentBits.MessageContent], partials: [discord.PartialTextBasedChannel, discord.PartialGroupDMChannel] });

client.once(discord.Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(discord.Events.MessageCreate, async message => {
    if (message.author.bot) return;

    if (message.content.startsWith("!bob")) {

        const bob = await getbob("20240619", "7310068", "E10")

        if (bob === undefined) {
            message.reply(`급식이 없습니다.`);
            return;
        }

        var acbob = {};
        bob[1].row.forEach(menu => {
            acbob[menu.MMEAL_SC_NM] = menu.DDISH_NM.replace(/<br\/>/g, "\n")
        });
        message.reply({
            embeds: [makeBobEmbed(acbob, "20240619")]
        });
        console.log(acbob)
    }
});

client.login(config.discordapi.token);