const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs'); // Fayllar bilan ishlash uchun

// ----------------------------------------
// 1. 🔑 TOKEN JOYI (BotFather bergan tokenni bu yerga qo'ying)
// ----------------------------------------
const token = '8560805537:AAFtRra0R5dvu3wUbt-AB-y65e_tiRM5pz8'; 

// ----------------------------------------
// 2. 🛡️ ADMIN ID JOYI (Kinoni tahrirlash uchun o'z ID raqamingizni kiriting)
// ----------------------------------------
const ADMIN_ID = 2024143361; 

const bot = new TelegramBot(token, { polling: true });
const JSON_FILE_PATH = 'kinolar.json';
let kinoData = {};

// Default ma'lumotlar (JSON fayl avtomatik yaratilganda ishlatiladi)
const defaultKinoData = {
    "categories": {
        "marvel": [{"name": "Avengers: Endgame", "link": "https://t.me/kino_uz_channel/endgame"}],
        "dc": [{"name": "The Batman", "link": "https://t.me/kino_uz_channel/thebatman"}],
        "hindi": [{"name": "RRR", "link": "https://t.me/kino_uz_channel/rrr"}],
        "horror": [{"name": "The Conjuring", "link": "https://t.me/kino_uz_channel/conjuring"}]
    },
    "specific_movie": {
        "name": "Man So'ragan Kino: Forsaj 10",
        "link": "https://t.me/kino_uz_channel/forsaj10"
    },
    "multfilms": [
        {"name": "Toy Story 4 (2019)", "link": "https://t.me/multfilm_channel/toy4"}
    ]
};

// ===============================================================
// JSON FAYLINI AVTOMATIK YARATISH VA YUKLASH MANTIQI
// ===============================================================

if (!fs.existsSync(JSON_FILE_PATH)) {
    // kinolar.json mavjud emas, uni yaratamiz
    try {
        fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(defaultKinoData, null, 2), 'utf8');
        console.log(`⭐ kinolar.json fayli avtomatik ravishda yaratildi.`);
    } catch (err) {
        console.error('❌ kinolar.json faylini yaratishda xatolik:', err);
        process.exit(1); 
    }
}

// Faylni o'qish (mavjud yoki yangi yaratilgan)
try {
    const data = fs.readFileSync(JSON_FILE_PATH, 'utf8');
    kinoData = JSON.parse(data);
    console.log('✅ Kinolar ro\'yxati muvaffaqiyatli yuklandi.');
} catch (err) {
    console.error('❌ kinolar.json faylini o\'qishda xatolik yuz berdi. Tekshiring:', err);
    process.exit(1);
}

console.log('🎬 Kino Bot ishga tushdi...');

// Ma'lumotlarni JSON faylga yozish uchun yordamchi funksiya
function saveKinoData() {
    try {
        fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(kinoData, null, 2));
        return true;
    } catch (err) {
        console.error('❌ JSON faylni yozishda xatolik:', err);
        return false;
    }
}

// Boshlang'ich klaviatura (Siz so'ragan 2 ta asosiy tugma)
const initialKeyboard = {
    reply_markup: {
        keyboard: [
            ['🎬 Kino'], // 1-tugma
            ['🐰 Multfilm'] // 2-tugma
        ],
        resize_keyboard: true
    }
};

// ===============================================
// ASOSIY FUNKSIYALAR
// ===============================================

// /start buyrug'i
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || 'Foydalanuvchi';
    
    bot.sendMessage(chatId, `Salom ${name}! 👋\n\nQuyidagi tugmalardan birini tanlang:`, initialKeyboard);
});

// "🎬 Kino" tugmasi (4 xil inline tugmalar + Maxsus kino)
bot.onText(/🎬 Kino/, (msg) => {
    const chatId = msg.chat.id;
    
    const kinoInlineKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '1️⃣ Marvel', callback_data: 'category_marvel' },
                    { text: '2️⃣ DC', callback_data: 'category_dc' }
                ],
                [
                    { text: '3️⃣ Hind', callback_data: 'category_hindi' },
                    { text: '4️⃣ Horror', callback_data: 'category_horror' }
                ],
                [
                    // Siz so'ragan 2-tugma (Maxsus kino)
                    { text: `✨ Maxsus Kino (2)`, callback_data: 'specific_movie' } 
                ]
            ]
        }
    };
    
    bot.sendMessage(chatId, '📁 *Kino janrini tanlang:*', {
        parse_mode: 'Markdown',
        reply_markup: kinoInlineKeyboard.reply_markup
    });
});

// "🐰 Multfilm" tugmasi
bot.onText(/🐰 Multfilm/, (msg) => {
    const chatId = msg.chat.id;
    const multfilms = kinoData.multfilms; 

    if (multfilms && multfilms.length > 0) {
        let multfilmText = '🐰 *Multfilmlar Ro\'yxati:*\n\n';
        
        multfilms.forEach((movie, index) => {
            // Eslatma: O'chirish buyrug'i uchun tartib raqami ko'rsatildi
            multfilmText += `• ${index + 1}. [${movie.name}](${movie.link})\n`;
        });
        
        bot.sendMessage(chatId, multfilmText, {
            parse_mode: 'Markdown'
        });
    } else {
        bot.sendMessage(chatId, '❌ Hozircha Multfilmlar bo\'limida ma\'lumotlar mavjud emas.');
    }
});


// ===============================================
// CALLBACK FUNKSIYALARI (Inline tugmalar uchun)
// ===============================================

bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    // 1. Maxsus kino (2-tugma bosilganda)
    if (data === 'specific_movie') {
        const movie = kinoData.specific_movie;
        bot.sendMessage(chatId, 
            `✨ *Maxsus Kino:*\n\n🎬 [${movie.name}](${movie.link})`, 
            { parse_mode: 'Markdown' }
        );
    }
    
    // 2. Kategoriya kinolari (Marvel, DC, Hind, Horror)
    else if (data.startsWith('category_')) {
        const categoryKey = data.substring(9);
        const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
        const movies = kinoData.categories[categoryKey];
        
        if (movies && movies.length > 0) {
            let movieText = `🎞️ *${categoryName} kinolari:*\n\n`;
            // O'chirish buyrug'i uchun tartib raqami ko'rsatildi
            movies.forEach((movie, index) => {
                movieText += `• ${index + 1}. [${movie.name}](${movie.link})\n`;
            });
            
            bot.sendMessage(chatId, movieText, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, `${categoryName} kategoriyasida hozircha kino yo'q.`);
        }
    }
    
    bot.answerCallbackQuery(callbackQuery.id);
});


// ===============================================
// 3. ADMIN PANEL FUNKSIYALARI
// ===============================================

// A) Maxsus kinoni o'zgartirish (/set_specific_movie)
bot.onText(/\/set_specific_movie (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const newMovieDetails = match[1].trim();

    if (chatId != ADMIN_ID) {
        return bot.sendMessage(chatId, '🚫 Siz admin emassiz. Bu buyruqdan foydalana olmaysiz.');
    }
    
    const parts = newMovieDetails.split('|').map(p => p.trim());
    
    if (parts.length !== 2) {
        return bot.sendMessage(chatId, '❌ Noto\'g\'ri format! To\'g\'ri format: `/set_specific_movie Yangi Kino Nomi | Kino Linki`');
    }

    const [newName, newLink] = parts;
    
    // JSON faylni yangilash
    kinoData.specific_movie.name = newName;
    kinoData.specific_movie.link = newLink;

    if (saveKinoData()) {
        bot.sendMessage(chatId, `✅ Maxsus kino muvaffaqiyatli yangilandi:\n\n*${newName}*`, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, '❌ JSON faylni yozishda xatolik yuz berdi. Konsolni tekshiring.');
    }
});

// B) Multfilm qo'shish (/add_multfilm)
bot.onText(/\/add_multfilm (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const newMultfilmDetails = match[1].trim();

    if (chatId != ADMIN_ID) {
        return bot.sendMessage(chatId, '🚫 Siz admin emassiz. Bu buyruqdan foydalana olmaysiz.');
    }
    
    // Format: "Multfilm Nomi | Linki"
    const parts = newMultfilmDetails.split('|').map(p => p.trim());
    
    if (parts.length !== 2) {
        return bot.sendMessage(chatId, '❌ Noto\'g\'ri format! To\'g\'ri format: `/add_multfilm Multfilm Nomi | Multfilm Linki`');
    }

    const [newName, newLink] = parts;
    
    // JSON faylga yangi multfilmni qo'shish
    if (!kinoData.multfilms) {
        kinoData.multfilms = []; // Agar bo'lim bo'lmasa yaratamiz
    }
    
    kinoData.multfilms.push({ name: newName, link: newLink });

    if (saveKinoData()) {
        bot.sendMessage(chatId, `✅ Multfilm muvaffaqiyatli qo'shildi:\n\n*${newName}*`, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, '❌ JSON faylni yozishda xatolik yuz berdi. Konsolni tekshiring.');
    }
});

// C) Multfilm O'chirish (/remove_multfilm)
bot.onText(/\/remove_multfilm (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const indexToRemove = parseInt(match[1]) - 1; 

    if (chatId != ADMIN_ID) {
        return bot.sendMessage(chatId, '🚫 Siz admin emassiz. Bu buyruqdan foydalana olmaysiz.');
    }
    
    if (!kinoData.multfilms || kinoData.multfilms.length === 0) {
        return bot.sendMessage(chatId, '❌ Multfilm ro\'yxati bo\'sh.');
    }

    if (indexToRemove >= 0 && indexToRemove < kinoData.multfilms.length) {
        const removedMovie = kinoData.multfilms.splice(indexToRemove, 1)[0]; 
        
        if (saveKinoData()) {
            bot.sendMessage(chatId, `✅ Multfilm muvaffaqiyatli o'chirildi:\n\n*${removedMovie.name}*`, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, '❌ JSON faylni yozishda xatolik yuz berdi.');
        }
    } else {
        bot.sendMessage(chatId, '❌ Noto\'g\'ri raqam kiritildi. Iltimos, ro\'yxatdagi tartib raqamini kiriting.');
    }
});

// D) Barcha kino kategoriyalariga qo'shish (/add_kino)
const VALID_CATEGORIES = ['marvel', 'dc', 'hindi', 'horror'];

bot.onText(/\/add_kino (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const details = match[1].trim(); // Format: [kategoriya | Kino Nomi | Kino Linki]

    if (chatId != ADMIN_ID) {
        return bot.sendMessage(chatId, '🚫 Siz admin emassiz. Bu buyruqdan foydalana olmaysiz.');
    }
    
    const parts = details.split('|').map(p => p.trim());
    
    if (parts.length !== 3) {
        return bot.sendMessage(chatId, '❌ Noto\'g\'ri format! To\'g\'ri format:\n`/add_kino [kategoriya] | Kino Nomi | Kino Linki`\n\nKategoriyalar: marvel, dc, hindi, horror');
    }

    const [category, newName, newLink] = parts;
    const categoryKey = category.toLowerCase();

    if (!VALID_CATEGORIES.includes(categoryKey)) {
        return bot.sendMessage(chatId, `❌ Noto'g'ri kategoriya kiritildi. Kategoriyalar: ${VALID_CATEGORIES.join(', ')}`);
    }

    // JSON faylga yangi kinoni qo'shish
    if (!kinoData.categories[categoryKey]) {
        kinoData.categories[categoryKey] = [];
    }
    
    kinoData.categories[categoryKey].push({ name: newName, link: newLink });

    if (saveKinoData()) {
        bot.sendMessage(chatId, `✅ *${categoryKey.toUpperCase()}* kategoriyasiga kino muvaffaqiyatli qo'shildi:\n\n*${newName}*`, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, '❌ JSON faylni yozishda xatolik yuz berdi. Konsolni tekshiring.');
    }
});

// E) Kategoriya Kinolarini O'chirish (/remove_kino) ✨ YANGI ADMIN BUYRUG'I
// Bu buyruq Multfilm bo'limidan tashqari barcha kategoriyalardan kinoni o'chiradi
bot.onText(/\/remove_kino (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const details = match[1].trim(); // Format: [kategoriya | tartib raqami]

    if (chatId != ADMIN_ID) {
        return bot.sendMessage(chatId, '🚫 Siz admin emassiz. Bu buyruqdan foydalana olmaysiz.');
    }
    
    const parts = details.split('|').map(p => p.trim());
    
    if (parts.length !== 2) {
        return bot.sendMessage(chatId, '❌ Noto\'g\'ri format! To\'g\'ri format:\n`/remove_kino [kategoriya] | tartib raqami`\n\nKategoriyalar: marvel, dc, hindi, horror');
    }

    const [category, indexStr] = parts;
    const categoryKey = category.toLowerCase();
    const indexToRemove = parseInt(indexStr) - 1; // 1-dan boshlangan tartib raqamini indeksga aylantirish

    if (!VALID_CATEGORIES.includes(categoryKey)) {
        return bot.sendMessage(chatId, `❌ Noto'g'ri kategoriya kiritildi. Kategoriyalar: ${VALID_CATEGORIES.join(', ')}`);
    }

    const movies = kinoData.categories[categoryKey];

    if (!movies || movies.length === 0) {
        return bot.sendMessage(chatId, `❌ *${categoryKey.toUpperCase()}* ro'yxati bo'sh.`, { parse_mode: 'Markdown' });
    }
    
    // O'chirish tekshiruvi
    if (indexToRemove >= 0 && indexToRemove < movies.length) {
        const removedMovie = movies.splice(indexToRemove, 1)[0]; 
        
        if (saveKinoData()) {
            bot.sendMessage(chatId, `✅ *${categoryKey.toUpperCase()}* kategoriyasidan kino muvaffaqiyatli o'chirildi:\n\n*${removedMovie.name}*`, { parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, '❌ JSON faylni yozishda xatolik yuz berdi.');
        }
    } else {
        bot.sendMessage(chatId, '❌ Noto\'g\'ri tartib raqami kiritildi. Iltimos, ro\'yxatdagi raqamni kiriting.');
    }
});


// Xatoliklarni ushlash
bot.on('polling_error', (error) => {
    console.error('Xatolik:', error.code, error.message);
});