const db = require('../util/database');

module.exports = {
    help: {
        name: 'Top',
        description: 'Sunucudaki en yüksek seviyeli kullanıcıları gösterir',
        aliases: ['Sıralama', 'Ranking']
    },
    conf: {
        aliases: ['Sıralama', 'Ranking'],
        permLevel: 0
    },
    run: async (client, message, args) => {
        try {
            const rankings = await db.getRankings();
            const totalUsers = rankings.length;

            // Sayfa sistemi
            const itemsPerPage = 10;
            let page = 1;
            if (args[0] && !isNaN(args[0])) {
                page = parseInt(args[0]);
            }
            const maxPages = Math.ceil(totalUsers / itemsPerPage);
            page = Math.min(Math.max(1, page), maxPages); // Sayfa numarasını sınırla

            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, totalUsers);
            const pageItems = rankings.slice(startIndex, endIndex);

            const embed = new EmbedBuilder()
                .setColor('#7289DA')
                .setTitle('🏆 Seviye Sıralaması')
                .setDescription('En yüksek seviyeli kullanıcılar:')
                .setFooter({ text: `Sayfa ${page}/${maxPages} • Toplam ${totalUsers} kullanıcı` });

            let description = '';
            for (let i = 0; i < pageItems.length; i++) {
                const rank = startIndex + i + 1; // Normal sıralama
                const user = pageItems[i];
                const member = await message.guild.members.fetch(user.userId).catch(() => null);
                const username = member ? member.user.username : 'Bilinmeyen Kullanıcı';

                // Özel simgeler
                let rankEmoji;
                if (rank === 1) rankEmoji = '👑';
                else if (rank === 2) rankEmoji = '🥈';
                else if (rank === 3) rankEmoji = '🥉';
                else rankEmoji = '⭐';

                description += `${rankEmoji} **${rank}.** ${username}\n`;
                description += `│ Level: ${user.level} • XP: ${user.xp.toLocaleString()}\n`;
                if (i < pageItems.length - 1) description += '├──────────────\n';
                else description += '└──────────────\n';
            }

            embed.setDescription(description);

            // Kullanıcının kendi sıralaması
            const userRank = await db.getUserRank(message.author.id);
            const userData = await db.getLevel(message.author.id);
            embed.addFields({
                name: 'Senin Sıralaman',
                value: `${userRank === 1 ? '👑' : '🎯'} ${userRank}. sıradasın\nLevel ${userData.level} • XP: ${userData.xp.toLocaleString()}`,
                inline: false
            });

            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Sıralama gösterilirken hata:', error);
            await message.channel.send('Sıralama bilgisi alınırken bir hata oluştu!');
        }
    }
}; 