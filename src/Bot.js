import { Markup, Telegraf } from "telegraf";
import { ADMIN_IDS, BOT_TOKEN, PAGE_SIZE } from "./config.js";

/**
 * @typedef {import("./ItemStore.js").ItemStore} ItemStore
 */

export class Bot {
  /**
   * 
   * @param {ItemStore} itemStore - Хранилище айтемов
   */
  constructor(itemStore) {
    this.store = itemStore;
    this._bot = new Telegraf(BOT_TOKEN);
    this._bot.on('callback_query', (ctx) => this._onCallbackQuery(ctx));
    this._bot.command('admin', (ctx) => this._onAdmin(ctx));
    this._bot.launch();
    process.once('SIGINT', () => this._bot.stop('SIGINT'));
    process.once('SIGTERM', () => this._bot.stop('SIGTERM'));
  }

  /**
   * Отправка сообщения
   * @param {string} chatId 
   * @param {string} text 
   * @returns 
   */
  async sendMessage(chatId, text) {
    return this._bot.telegram.sendMessage(chatId, text);
  }

  /**
   * @param {import("telegraf").Context} ctx
   */
  async _onAdmin(ctx) {
    if (!ADMIN_IDS.includes(Number(ctx?.from?.id))) {
      return ctx.reply("Нет доступа.");
    }

    if (this.store.size === 0) {
      return ctx.reply("Список пуст.");
    }

    await ctx.reply("Список отправленных товаров:", this._generateKeyboard(0));
  }

  /**
   * @param {import("telegraf").Context} ctx
   */
  async _onCallbackQuery(ctx) {
    if (!ADMIN_IDS.includes(Number(ctx?.from?.id))) {
      return ctx.answerCbQuery("Нет доступа.");
    }

    const data = ctx.callbackQuery?.data;

    if (data.startsWith("delete_")) {
      const [, id, page] = data.split("_");
      if (this.store.get(id)) {
        this.store.delete(id);
        this.store.commit();
        ctx.answerCbQuery("Товар удалён");

        if (this.store.size === 0) {
          return ctx.editMessageText("Список пуст.");
        }

        await ctx.editMessageReplyMarkup(this._generateKeyboard(parseInt(page)).reply_markup);
        return;
      }
      ctx.answerCbQuery("Товар уже удалён");
    }

    if (data.startsWith("next_") || data.startsWith("prev_")) {
      const page = parseInt(data.split("_")[1], 10);
      await ctx.editMessageReplyMarkup(this._generateKeyboard(page).reply_markup);
      ctx.answerCbQuery();
    }
  }

  _generateKeyboard(page = 0) {
    const items = this.store.values;
    const start = page * PAGE_SIZE;
    const pageItems = items.slice(start, start + PAGE_SIZE);

    const buttons = pageItems.map(([id, info]) =>
      [Markup.button.callback(`❌ ${info.title}`, `delete_${id}_${page}`)]
    );

    const navigation = [];
    if (page > 0) {
      navigation.push(Markup.button.callback("⬅️ Назад", `prev_${page - 1}`));
    }
    if (start + PAGE_SIZE < items.length) {
      navigation.push(Markup.button.callback("➡️ Следующая", `next_${page + 1}`));
    }
    if (navigation.length) {
      buttons.push(navigation);
    }

    return Markup.inlineKeyboard(buttons);
  }
}