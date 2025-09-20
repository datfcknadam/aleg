import 'dotenv/config'

export const BOT_TOKEN = process.env.BOT_TOKEN || '';
const required = ['BOT_TOKEN', 'CHANNEL_ID'];

const emptyKey = required.find(it => it === undefined);
if (emptyKey) {
  console.log(`${emptyKey} is empty`);
  process.exit(1);
}

export const CHANNEL_ID = process.env.CHANNEL_ID || '';
export const ADMIN_IDS = process.env.ADMIN_IDS?.split(',').map(Number) || [];
export const CHECK_INTERVAL = Number(process.env.CHECK_INTERVAL) || 30_000;
export const PAGE_SIZE = 5;