declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string; // env variables are always strings
    MONGO_DB: string;

    JWT_SECRET: string;
    JWT_RESET_SECRET: string;
    JWT_REFRESH_SECRET?: string;
    JWT_ACCESS_EXPIRATION?: string;
    JWT_REFRESH_EXPIRATION?: string;

    EMAIL_HOST?: string;
    EMAIL_PORT?: string;
    EMAIL_USER: string;
    EMAIL_PASS: string;
    ADMIN_EMAIL?: string;
    OWNER_EMAIL?: string;

    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    APPLE_CLIENT_ID?: string;
    PASSWORD_RESET_URL?: string;

    BLOCKONOMICS_API_KEY: string;
    BLOCKONOMICS_CALLBACK_SECRET: string;

    NODE_ENV: "development" | "production" | "test";
  }
}
