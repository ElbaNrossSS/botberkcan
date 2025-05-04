const fs = require("fs");
const { Client, Intents, Collection } = require("discord.js");

// Client oluştur
const client = new Client({
    intents: [
        Intents.Flags.GUILDS,
        Intents.Flags.GUILD_MESSAGES,
        Intents.Flags.GUILD_MEMBERS,
        Intents.Flags.DIRECT_MESSAGES,
        Intents.Flags.GUILD_MESSAGE_REACTIONS,
        Intents.Flags.GUILD_MESSAGE_TYPING,
        Intents.Flags.GUILD_PRESENCES
    ],
    partials: ['CHANNEL', 'MESSAGE', 'USER', 'GUILD_MEMBER', 'REACTION']
});

// Dotenv yapılandırması
require('dotenv').config();

// Prefix tanımı
const PREFIX = process.env.PREFIX || 's!';
client.prefix = PREFIX;

// Koleksiyonları oluştur
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

// Hata yönetimi
process.on('unhandledRejection', error => {
    console.error('İşlenmeyen hata:', error);
});

// Bağlantı hatası yönetimi
client.on('disconnect', () => {
    console.log('Bot bağlantısı kesildi, yeniden bağlanmaya çalışılıyor...');
});

client.on('error', error => {
    console.error('Bir hata oluştu:', error);
});

// Bota giriş yap
client.login(process.env.TOKEN).catch(error => {
    console.error('Giriş yapılırken hata oluştu:', error);
});
