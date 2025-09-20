const SENT_FILE = resolve("../sentItems.json");
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

/**
 * @typedef {Object} SentItem
 * @property {string} title - Заголовок товара
 * @property {string} url - Ссылка на товар
 */

/**
 * @typedef {Record<string, SentItem>} SentItems
 */

export class ItemStore {
    /** @type {SentItems} */
  _sentItems = {};

  constructor() {
    // Загружаем sentItems
    if (existsSync(SENT_FILE)) {
      try {
        this._sentItems = JSON.parse(readFileSync(SENT_FILE, "utf-8"));
      } catch (err) {
        console.error("Ошибка чтения sentItems.json:", err);
      }
    }
  }

  /**
   * Получение итема по id
   * @param {string} id 
   * @returns 
   */
  get(id) {
    return this._sentItems?.[id];
  }

  /**
   * Установка итема
   * @param {string} id 
   * @param {SentItem} value 
   */
  set(id, value) {
    this._sentItems[id] = value;
  }

  /**
   * Удаление итема
   * @param {string} id 
   */
  delete(id) {
    delete this._sentItems[id];
  }

  get size() {
    return Object.keys(this._sentItems).length;
  }

  get values() {
    return Object.entries(this._sentItems);
  }

  /**
   * Фиксация
   */
  commit() {
    writeFileSync(SENT_FILE, JSON.stringify(this._sentItems, null, 2), "utf-8");
  }
}