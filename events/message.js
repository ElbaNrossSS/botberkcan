const { Events } = require("discord.js");
const db = require('../util/database');

module.exports = {
    name: Events.MessageCreate,
    execute: async (message) => {
        if (!message) return;
        if (message.author.bot) return;
        if (!message.guild) return;

        const prefix = message.client.prefix;

        // Komut işleme
        if (message.content.toLowerCase().startsWith(prefix.toLowerCase())) {
            const args = message.content.slice(prefix.length).trim().split(/ +/g);
            const command = args.shift().toLowerCase();

            const cmd = message.client.commands.get(command) || 
                      message.client.commands.get(message.client.aliases.get(command));

            if (cmd) {
                try {
                    await cmd.run(message.client, message, args);
                } catch (error) {
                    await message.channel.send('Komut çalıştırılırken bir hata oluştu!');
                }
            }
            return; // Eğer bir komut çalıştıysa XP verme
        }
        
        // Seviye sistemi
        const cooldown = 60000; // 1 dakika
        const lastMessageInfo = await db.getLastMessage(message.author.id);
        const now = Date.now();
        
        // Cooldown kontrolü
        if (lastMessageInfo.timestamp && now - lastMessageInfo.timestamp < cooldown) return;
        
        // Aynı mesaj kontrolü
        if (message.content.toLowerCase() === lastMessageInfo.content.toLowerCase()) return;
        
        const baseXP = 15;
        const levelMultiplier = 0.8;
        const userData = await db.getLevel(message.author.id);
        const xpToAdd = Math.floor(Math.random() * 5) + Math.floor(baseXP * Math.pow(levelMultiplier, userData.level - 1));
        
        const oldLevel = userData.level;
        await db.addXP(message.author.id, xpToAdd);
        await db.setLastMessage(message.author.id, now, message.content);
        
        const updatedData = await db.getLevel(message.author.id);
        
        // Level atladıysa bildirim gönder
        if (updatedData.level > oldLevel) {
            await message.channel.send(`🎉 Tebrikler ${message.author}! **${updatedData.level}** seviyesine ulaştın!`);
        }
    }
};