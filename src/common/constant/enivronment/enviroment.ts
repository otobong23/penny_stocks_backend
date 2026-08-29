import * as dotenv from 'dotenv';
dotenv.config();
export const ENVIRONMENT = {
  GOOGLE: {
    SMTP_USER: process.env.GMAIL_USER,
    AUTH_PASS: process.env.GMAIL_PASSWORD,
  },

  CONNECTION: {
    PORT: process.env.PORT,
  },

  OWNER: {
    OWNER_EMAIL: process.env.OWNER_EMAIL,
  },

  JWT: {
    JWT_SECRET: process.env.JWT_SECRET,
    EXPIRATION_TIME: process.env.EXPIRATION_TIME,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXP_TIME: process.env.JWT_REFRESH_EXP_TIME,
  },
};
