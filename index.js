import { Bot } from "./src/Bot.js";
import { CheckProducts } from "./src/CheckProducts.js";
import { CHECK_INTERVAL } from "./src/config.js";
import { ItemStore } from "./src/ItemStore.js";

const itemStore = new ItemStore();
const bot = new Bot(itemStore);

const checkProducts = new CheckProducts(itemStore, bot);

function loop() {
  setTimeout(async() => {
    await Promise.allSettled([
      checkProducts.check('https://publikagaultier.com'),
      checkProducts.check('https://shop.privatepersons.net'),
    ]);
    loop();
  }, CHECK_INTERVAL);
}
loop();