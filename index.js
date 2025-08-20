import { Telegraf, Markup } from "telegraf";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import 'dotenv/config'

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.log('BOT_TOKEN is empty');
  process.exit(1);
}
const CHANNEL_ID = process.env.CHANNEL_ID;
const ADMIN_IDS = process.env.ADMIN_IDS?.split(',').map(Number) || [];
const CHECK_INTERVAL = Number(process.env.CHECK_INTERVAL) || 30_000;
const PAGE_SIZE = 5;

const bot = new Telegraf(BOT_TOKEN);
const SENT_FILE = resolve("./sentItems.json");

// Загружаем sentItems
let sentItems = {};
if (existsSync(SENT_FILE)) {
  try {
    sentItems = JSON.parse(readFileSync(SENT_FILE, "utf-8"));
  } catch (err) {
    console.error("Ошибка чтения sentItems.json:", err);
  }
}

function saveSentItems() {
  writeFileSync(SENT_FILE, JSON.stringify(sentItems, null, 2), "utf-8");
}

// Проверка товаров
async function checkProducts() {
  try {
    console.log('checkProducts');
    const res = await fetch("https://publikagaultier.com/collection/all.json");
    const data = await res.json();

    const availableItems = data.products.filter(item => item.available);

    for (const item of availableItems) {
      if (!sentItems[item.id]) {
        const url = `https://publikagaultier.com${item.url} ${item.price_min}`;
        const message = `${url} ${item.title}`;

        const a = await bot.telegram.sendMessage(CHANNEL_ID, message);
        console.log("Отправлено сообщение:", message, a);

        // Сохраняем в sentItems
        sentItems[item.id] = { title: item.title, url: item.url };
        saveSentItems();
      }
    }
  } catch (err) {
    console.error("Ошибка при проверке товаров:", err);
  }
}

// Генерация клавиатуры для страницы
function generateKeyboard(items, page = 0) {
  const start = page * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);

  const buttons = pageItems.map(([id, info]) =>
    [Markup.button.callback(`❌ ${info.title}`, `delete_${id}_${page}`)]
  );

  const navigation = [];
  if (start + PAGE_SIZE < items.length) navigation.push(Markup.button.callback("➡️ Следующая", `next_${page + 1}`));
  if (page > 0) navigation.push(Markup.button.callback("⬅️ Назад", `prev_${page - 1}`));
  if (navigation.length) buttons.push(navigation);

  return Markup.inlineKeyboard(buttons);
}

// Команда админа для списка товаров
bot.command("admin", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.reply("Нет доступа.");

  const items = Object.entries(sentItems);
  if (items.length === 0) return ctx.reply("Список пуст.");

  await ctx.reply("Список отправленных товаров:", generateKeyboard(items, 0));
});

// Обработка нажатий кнопок
bot.on("callback_query", async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) return ctx.answerCbQuery("Нет доступа.");

  const data = ctx.callbackQuery.data;

  if (data.startsWith("delete_")) {
    const [, id, page] = data.split("_");
    if (sentItems[id]) {
      delete sentItems[id];
      saveSentItems();
      ctx.answerCbQuery("Товар удалён");
      // обновляем страницу
      const items = Object.entries(sentItems);
      if (items.length === 0) {
        return ctx.editMessageText("Список пуст.");
      }
      await ctx.editMessageReplyMarkup(generateKeyboard(items, parseInt(page)));
    } else {
      ctx.answerCbQuery("Товар уже удалён");
    }
  } else if (data.startsWith("next_") || data.startsWith("prev_")) {
    const page = parseInt(data.split("_")[1], 10);
    const items = Object.entries(sentItems);
    await ctx.editMessageReplyMarkup(generateKeyboard(items, page));
    ctx.answerCbQuery();
  }
});

// Запуск проверки по интервалу
setInterval(checkProducts, CHECK_INTERVAL);
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))