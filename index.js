
require('dotenv').config();

const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// Discord ID участников — порядок соответствует участникам на сайте
const members = [
    '1505513287788265534',
    '1187062611485929483',
    '1517103355179176019',
    '1118469197194874891',
    '1561287964611321877',
    '1564353903296905345',
    '698483205514461231',
    '1506936091683455069',
    '1549336146356469760',
    '1548021341456965685'
];

// Здесь хранятся актуальные ники и аватарки
const currentNames = {};
const currentAvatars = {};

let checking = false;

// API для сайта
app.get('/api/members', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    res.json({
        members: currentNames,
        avatars: currentAvatars
    });
});

// Раздача файлов сайта
app.use(express.static(__dirname));

// Запуск сайта
app.listen(PORT, () => {
    console.log(`Сайт запущен на порту ${PORT}`);
});

// Получение ников и аватарок Discord
async function checkDiscordMembers() {
    if (checking) return;

    checking = true;

    try {
        let guild;

        const guildId = process.env.GUILD_ID;

        if (guildId) {
            guild = await client.guilds.fetch(guildId);
        } else {
            guild = client.guilds.cache.first();
        }

        if (!guild) {
            console.log('[ОШИБКА] Discord-сервер не найден!');
            return;
        }

        console.log(`[СЕРВЕР] Проверяем: ${guild.name}`);

        for (let i = 0; i < members.length; i++) {
            const userId = members[i];
            const label = `Участник ${i + 1}`;

            try {
                const member = await guild.members.fetch({
                    user: userId,
                    force: true
                });

                // Актуальный ник Discord
                const name =
                    member.nickname ||
                    member.user.globalName ||
                    member.user.username;

                // Настоящая аватарка Discord
                const avatar = member.displayAvatarURL({
                    size: 256
                });

                currentNames[userId] = name;
                currentAvatars[userId] = avatar;

                console.log(`[НИК] ${label}: ${name}`);
                console.log(`[АВАТАРКА] ${label}: получена`);

            } catch (error) {
                console.log(
                    `[ОШИБКА] ${label} (${userId}): ${error.message}`
                );
            }
        }

        console.log(
            `[ГОТОВО] Получено участников: ${Object.keys(currentNames).length}/10`
        );

    } catch (error) {
        console.error('[ОШИБКА DISCORD]', error.message);
    } finally {
        checking = false;
    }
}

// Запуск бота
client.once('ready', async () => {
    console.log(`Бот ${client.user.tag} запущен!`);

    await checkDiscordMembers();

    // Обновление каждые 60 секунд
    setInterval(checkDiscordMembers, 60 * 1000);
});

client.login(process.env.DISCORD_TOKEN);
