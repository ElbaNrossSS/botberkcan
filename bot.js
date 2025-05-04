const fs = require("fs");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});
require('dotenv').config();

// Prefix tanımı
const PREFIX = 's!';
client.prefix = PREFIX;

client.commands = new Collection();
client.aliases = new Collection();

// Komutları yükle
const commandFiles = fs.readdirSync('./komutlar').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    try {
        const command = require(`./komutlar/${file}`);
        const commandName = command.help.name.toLowerCase();
        client.commands.set(commandName, command);
        
        if (command.conf.aliases) {
            command.conf.aliases.forEach(alias => {
                client.aliases.set(alias.toLowerCase(), commandName);
            });
        }
    } catch (error) {
        console.error(`Komut yüklenirken hata oluştu (${file}):`, error);
    }
}

// Event handler'ları temizle
client.removeAllListeners();

// Eventleri yükle
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    try {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    } catch (error) {
        console.error(`Event yüklenirken hata oluştu (${file}):`, error);
    }
}

client.login("OTk5MDQ5NDc0OTc2NTE0MTEx.GpiPgR.WMlXqHD_0ZKiGq9ULWxJDhZcJrY7SIQj14L7ww");
