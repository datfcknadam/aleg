import { CHANNEL_ID } from "./config.js";

/**
 * @typedef {import("./ItemStore.js").ItemStore} ItemStore
 * @typedef {import("./Bot.js").Bot} Bot
 */


export class CheckProducts {
  /**
   * 
   * @param {ItemStore} store 
   * @param {Bot} bot 
   */
  constructor(store, bot) {
    this.store = store;
    this.bot = bot;
  }

  /**
   * Проверка предметов
   * @param {string} prefix 
   */
  async check(prefix) {
    try {
      const res = await fetch(`${prefix}/collection/all.json`);
      const data = await res.json();

      const availableItems = data.products.filter(item => item.available);

      for (const item of availableItems) {
        if (this.store.get(item.id)) {
          continue;
        }
        const url = `${prefix}${item.url} ${item.price_min}`;
        const message = `${url} ${item.title}`;

        const a = await this.bot.sendMessage(CHANNEL_ID, message);
        console.log("Отправлено сообщение:", message, a);

        // Сохраняем в sentItems
        this.store.set(item.id, { title: item.title, url: item.url });
        this.store.commit();
      }
    } catch (err) {
      console.error("Ошибка при проверке товаров:", err);
    }
  }
}