import { get } from "axios";
import {
  EmbedBuilder,
  Client,
  GatewayIntentBits,
  PartialTextBasedChannel,
  PartialGroupDMChannel,
  Events,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} from "discord.js";
const { bobapi, discord: _discord, discordapi } = require("./config.json");
import moment from "moment";

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./schoolList.db");

db.run(
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, sccode TEXT, schoolcode TEXT, schoolname TEXT)",
  (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("테이블 users가 성공적으로 생성되었습니다.");
    }
  }
);

db.run(
  "CREATE TABLE IF NOT EXISTS guilds (id INTEGER PRIMARY KEY, sccode TEXT, schoolcode TEXT, schoolname TEXT)",
  (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("테이블 guilds가 성공적으로 생성되었습니다.");
    }
  }
);

async function getbob(date, school, sc) {
  const bob = await get(bobapi.url, {
    params: {
      KEY: bobapi.apikey,
      Type: "json",
      pIndex: 1,
      pSize: 5,
      ATPT_OFCDC_SC_CODE: sc,
      SD_SCHUL_CODE: school,
      MLSV_YMD: date,
    },
  });

  console.log(bob);

  return bob.data.mealServiceDietInfo;
}

function makeBobEmbed(bob, day = moment().format("YYYYMMDD")) {
  const embed = new EmbedBuilder()
    .setTitle(`${day} 급식`)
    .setColor(0x00ff00)
    .setTimestamp()
    .setFooter({ text: "Powered by NEIS API" });

  Object.keys(bob).forEach((key) => {
    embed.addFields({ name: key, value: bob[key] });
  });

  return embed;
}

async function searchSchool(query) {
  const school = await axios.get(config.bobapi.searchurl, {
    params: {
      KEY: config.bobapi.apikey,
      Type: "json",
      pIndex: 1,
      pSize: 100,
      SCHUL_NM: query,
    },
  });

  return school.data.schoolInfo;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [PartialTextBasedChannel, PartialGroupDMChannel],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!bob")) {
    const bob = await getbob("20240619", "7310068", "E10");

    if (bob === undefined) {
      message.reply(`급식이 없습니다.`);
      return;
    }

    var acbob = {};
    bob[1].row.forEach((menu) => {
      acbob[menu.MMEAL_SC_NM] = menu.DDISH_NM.replace(/<br\/>/g, "\n");
    });
    message.reply({
      embeds: [makeBobEmbed(acbob, "20240619")],
    });
    console.log(acbob);
  }

  if (message.content.startsWith("!school")) {
    var command = message.content.split(" ");

    if (command[1] === undefined) {
      db.get(
        "SELECT * FROM users WHERE id = ?",
        [message.member.id],
        async (err, row) => {
          if (!row) {
            message.reply("검색어를 입력해주세요.");
            return;
          }

          message.reply(`당신의 학교는 ${row.schoolname}입니다.`);
        }
      );

      return;
    }

    searchSchool(command[1]).then((res) => {
      if (res === undefined) {
        message.reply("검색 결과가 없습니다.");
        return;
      }

      if (res[1].row.length > 25) {
        message.reply("검색 결과가 너무 많습니다. 더 자세하게 검색해주세요.");
        return;
      }

      // make button using interactions
      const select = new StringSelectMenuBuilder()
        .setCustomId("schoolSelect")
        .setPlaceholder("학교를 선택해주세요.");

      res[1].row.forEach((school) => {
        select.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(school.SCHUL_NM)
            .setDescription(school.ORG_RDNMA)
            .setValue(
              school.ATPT_OFCDC_SC_CODE +
                " " +
                school.SD_SCHUL_CODE +
                " " +
                school.SCHUL_NM
            )
        );
      });

      const row = new ActionRowBuilder().addComponents(select);

      console.log(row.components);

      message.reply({
        content: "학교를 선택해주세요.",
        components: [row],
      });
    });
  }
});

client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "schoolSelect") {
    const school = interaction.values[0].split(" ");

    db.run(
      "INSERT OR REPLACE INTO users (id, sccode, schoolcode, schoolname) VALUES (?, ?, ?, ?)",
      [interaction.user.id, school[0], school[1], school[2]],
      (err) => {
        if (err) {
          console.error(err.message);
          interaction.reply("학교를 설정하는 중 오류가 발생했습니다.");
        } else {
          interaction.reply(`학교가 설정되었습니다. (${school[2]})`);
        }
      }
    );
  }
});

client.login(config.discordapi.token);
