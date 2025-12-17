export const appConfig = {
  port: Number(process.env.APP_PORT) || 3000,
  env: process.env.APP_ENV || 'development',

  cashbackPercent: 3,
  cashbackPercentSpecial: 5,

  timezone: 'Asia/Tashkent',
};
