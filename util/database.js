const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/levels.json');

// Sabitler
const MAX_LEVEL = 100; // Maksimum level

// Veritabanı dosyasını oluştur veya yükle
let db = {};
try {
    if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath, 'utf8');
        db = JSON.parse(data);
    } else {
        // Eğer data klasörü yoksa oluştur
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }
        // Boş veritabanı dosyası oluştur
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    }
} catch (err) {
    console.error('Veritabanı yüklenirken hata:', err);
    db = {};
}

// Veritabanını kaydet
function saveDB() {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    } catch (err) {
        console.error('Veritabanı kaydedilirken hata:', err);
    }
}

// Otomatik kaydetme için timer
setInterval(saveDB, 30000); // Her 30 saniyede bir kaydet

module.exports = {
    async addXP(userId, xp) {
        try {
            if (!db[userId]) {
                db[userId] = { xp: 0, level: 1, lastMessage: 0, lastMessageContent: '' };
            }
            db[userId].xp += xp;
            
            // XP'ye göre yeni level hesapla
            const xpNeeded = 5 * (Math.pow(db[userId].level, 2)) + 50 * db[userId].level + 100;
            if (db[userId].xp >= xpNeeded) {
                db[userId].level += 1;
                db[userId].xp = 0;
            }
            
            saveDB();
        } catch (err) {
            console.error('XP eklenirken hata:', err);
        }
    },

    async getLevel(userId) {
        try {
            return db[userId] || { xp: 0, level: 1, lastMessage: 0, lastMessageContent: '' };
        } catch (err) {
            console.error('Seviye bilgisi alınırken hata:', err);
            return { xp: 0, level: 1, lastMessage: 0, lastMessageContent: '' };
        }
    },

    async updateLevel(userId, level) {
        try {
            if (!db[userId]) {
                db[userId] = { xp: 0, level: 1, lastMessage: 0, lastMessageContent: '' };
            }
            db[userId].level = level;
            saveDB();
        } catch (err) {
            console.error('Seviye güncellenirken hata:', err);
        }
    },

    async setLastMessage(userId, timestamp, content) {
        try {
            if (!db[userId]) {
                db[userId] = { xp: 0, level: 1, lastMessage: 0, lastMessageContent: '' };
            }
            db[userId].lastMessage = timestamp;
            db[userId].lastMessageContent = content;
            saveDB();
        } catch (err) {
            console.error('Son mesaj zamanı güncellenirken hata:', err);
        }
    },

    async getLastMessage(userId) {
        try {
            return {
                timestamp: db[userId]?.lastMessage || 0,
                content: db[userId]?.lastMessageContent || ''
            };
        } catch (err) {
            console.error('Son mesaj bilgisi alınırken hata:', err);
            return { timestamp: 0, content: '' };
        }
    },

    // Sunucudaki tüm kullanıcıların sıralamasını al
    async getRankings() {
        try {
            const users = Object.entries(db).map(([userId, data]) => ({
                userId,
                xp: data.xp,
                level: data.level
            }));

            // Level ve XP'ye göre sırala (yüksekten düşüğe)
            users.sort((a, b) => {
                if (a.level !== b.level) {
                    return b.level - a.level; // Yüksek level üstte
                }
                return b.xp - a.xp; // Aynı levelde yüksek XP üstte
            });

            return users;
        } catch (err) {
            console.error('Sıralama alınırken hata:', err);
            return [];
        }
    },

    // Kullanıcının sıralamasını al (normal sıralama)
    async getUserRank(userId) {
        try {
            const rankings = await this.getRankings();
            const userIndex = rankings.findIndex(user => user.userId === userId);
            return userIndex !== -1 ? userIndex + 1 : rankings.length + 1;
        } catch (err) {
            console.error('Kullanıcı sıralaması alınırken hata:', err);
            return 0;
        }
    }
}; 