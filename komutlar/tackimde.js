const { EmbedBuilder } = require("discord.js");

module.exports = {
    help: {
        name: 'Taç-kimde',
        description: 'Sunucu sahibini gösterir',
        aliases: ['Taç']
    },
    conf: {
        aliases: ['Taç'],
        permLevel: 0
    },
    run: async (client, message, args) => {
        const embed = new EmbedBuilder()
            .setDescription(`<:klann:1358604269237965003> Bu Sunucu'nun [Sahibi] <@${message.guild.ownerId}>`)
            .setColor("Random")
            .setFooter({ text: message.guild.name });
        
        await message.channel.send({ embeds: [embed] });
    }
};
