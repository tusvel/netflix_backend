import { Telegram } from '../telegram/telegram.interface';

export const getTelegramConfig = (): Telegram => ({
  chatId: '1138242050',
  token: process.env.TELEGRAM_TOKEN,
});
