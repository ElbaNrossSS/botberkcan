const { AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const db = require('../util/database');

// Komut cooldown sistemi
const cooldowns = new Map();

// Renk paleti
const COLORS = {
    background: '#1a1a1a',
    cardBg: '#2a2a2a',
    primary: '#7289DA', // Discord mavisi
    secondary: '#4e5d94',
    text: '#ffffff',
    textSecondary: '#b9bbbe',
    progressBg: '#ffffff1a',
    progressBar: '#7289DA'
};

module.exports = {
    help: {
        name: 'Seviye',
        description: 'Kullanıcının seviye bilgisini gösterir',
        aliases: ['Level', 'Lvl', 'Rank', 'Xp']
    },
    conf: {
        aliases: ['Level', 'Lvl', 'Rank', 'Xp'],
        permLevel: 0
    },
    run: async (client, message, args) => {
        try {
            // Cooldown kontrolü
            const now = Date.now();
            const cooldownAmount = 3000;

            if (cooldowns.has(message.author.id)) {
                const expirationTime = cooldowns.get(message.author.id) + cooldownAmount;
                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    return message.reply(`Lütfen ${timeLeft.toFixed(1)} saniye bekleyin.`);
                }
            }

            cooldowns.set(message.author.id, now);
            setTimeout(() => cooldowns.delete(message.author.id), cooldownAmount);

            const target = message.mentions.users.first() || message.author;
            const userData = await db.getLevel(target.id);
            const userRank = await db.getUserRank(target.id);
            const xpNeeded = 5 * (Math.pow(userData.level, 2)) + 50 * userData.level + 100;
            const progress = (userData.xp / xpNeeded) * 100;

            // Canvas oluştur
            const canvas = Canvas.createCanvas(900, 300);
            const ctx = canvas.getContext('2d');

            // Arkaplan
            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Kart arka planı için gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, COLORS.cardBg);
            gradient.addColorStop(1, '#353535');
            
            // Yuvarlatılmış köşeli kart
            ctx.save();
            roundRect(ctx, 15, 15, canvas.width - 30, canvas.height - 30, 20);
            ctx.clip();
            ctx.fillStyle = gradient;
            ctx.fillRect(15, 15, canvas.width - 30, canvas.height - 30);

            // Dekoratif çizgiler
            ctx.strokeStyle = COLORS.primary + '30';
            ctx.lineWidth = 2;
            for(let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(15 + (i * 50), 15);
                ctx.lineTo(15 + (i * 100), canvas.height - 15);
                ctx.stroke();
            }

            // Avatar için daire
            ctx.save();
            ctx.beginPath();
            const avatarSize = 150;
            const avatarX = 50;
            const avatarY = canvas.height / 2 - avatarSize / 2;
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            // Avatar yükle ve çiz
            const avatar = await Canvas.loadImage(target.displayAvatarURL({ extension: 'png', size: 256 }));
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();

            // Avatar çerçevesi
            ctx.strokeStyle = COLORS.primary;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
            ctx.stroke();

            // Kullanıcı adı
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = COLORS.text;
            ctx.fillText(target.username, 250, 80);

            // RANK yazısı
            ctx.font = 'bold 25px Arial';
            ctx.fillStyle = COLORS.primary;
            ctx.fillText('RANK', 250, 120);
            ctx.fillStyle = COLORS.text;
            ctx.fillText(`#${userRank}`, 320, 120);

            // Level bilgisi
            ctx.font = 'bold 25px Arial';
            ctx.fillStyle = COLORS.primary;
            ctx.fillText('LEVEL', 430, 120);
            ctx.fillStyle = COLORS.text;
            ctx.fillText(userData.level, 510, 120);

            // XP Bilgisi
            ctx.font = '25px Arial';
            ctx.fillStyle = COLORS.textSecondary;
            ctx.fillText(`XP: ${userData.xp.toLocaleString()} / ${xpNeeded.toLocaleString()}`, 250, 160);

            // Progress bar arka planı
            const barWidth = 550;
            const barHeight = 30;
            const barX = 250;
            const barY = 180;
            
            ctx.fillStyle = COLORS.progressBg;
            roundRect(ctx, barX, barY, barWidth, barHeight, barHeight / 2, true);

            // Progress bar
            const progressWidth = (userData.xp / xpNeeded) * barWidth;
            const progressGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            progressGradient.addColorStop(0, COLORS.primary);
            progressGradient.addColorStop(1, COLORS.secondary);
            ctx.fillStyle = progressGradient;
            if (progressWidth > 0) {
                roundRect(ctx, barX, barY, progressWidth, barHeight, barHeight / 2, true);
            }

            // Progress yüzdesi
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = COLORS.text;
            ctx.textAlign = 'right';
            ctx.fillText(`${progress.toFixed(1)}%`, barX + barWidth - 10, barY + barHeight + 25);

            // Resmi gönder
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rank.png' });
            await message.channel.send({ files: [attachment] });

        } catch (error) {
            console.error('Seviye kartı oluşturulurken hata:', error);
            await message.channel.send('Seviye kartı oluşturulurken bir hata oluştu!');
        }
    }
};

// Yardımcı fonksiyon: Yuvarlatılmış köşeli dikdörtgen
function roundRect(ctx, x, y, width, height, radius, fill = false) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
}