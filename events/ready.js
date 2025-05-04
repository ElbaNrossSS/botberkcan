const moment = require('moment');
const { Events } = require('discord.js');
require('dotenv').config();

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`${client.user.tag} aktif!`);
        client.user.setActivity(`${client.guilds.cache.size} Sunucu, ${client.guilds.cache.reduce((a, b) => a + b.memberCount, 0).toLocaleString()} Üye`);
    }
};
