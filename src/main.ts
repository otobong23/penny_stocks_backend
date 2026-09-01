// import { NestFactory } from '@nestjs/core';
// import { ValidationPipe } from '@nestjs/common';
// import { AppModule } from './app.module';
// import { config } from 'dotenv';
// import * as bodyParser from 'body-parser';
// config()

// const port = process.env.PORT || 4000;

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.use(bodyParser.json({ limit: '10mb' }));      // for JSON bodies
//   app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

//   app.enableCors({
//     origin: ['http://localhost:3000'], // allow requests from your frontend
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     credentials: true,               // allow cookies/auth headers if needed
//   });

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true, // strips properties not in the DTO
//       forbidNonWhitelisted: true, // throws error if extra properties
//       transform: true, // transforms plain JSON into class instances
//     }),
//   );

//   await app.listen(port);
// }
// bootstrap();


import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@codegenie/serverless-express';
import { config } from 'dotenv';
import * as bodyParser from 'body-parser';
import express from 'express';
import { AppModule } from './app.module';

config();

const port = process.env.PORT || 4000;

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.use(bodyParser.json({ limit: '10mb' })); // for JSON bodies
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  app.enableCors({
    origin: ['http://localhost:3000'], // allow requests from your frontend
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true, // allow cookies/auth headers if needed
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties not in the DTO
      forbidNonWhitelisted: true, // throws error if extra properties
      transform: true, // transforms plain JSON into class instances
    }),
  );

  await app.init();
  return serverlessExpress({ app: server });
}

// Cached across warm invocations so we don't re-bootstrap Nest per request
let cachedHandler: any;

export default async (req: express.Request, res: express.Response) => {
  if (!cachedHandler) {
    cachedHandler = await bootstrap();
  }
  return cachedHandler(req, res);
};

// Local dev: `node dist/main.js` or `npm run start:dev` still works normally,
// since Vercel only ever imports the default export above and never runs this file directly.
if (require.main === module) {
  bootstrap().then(() => {
    server.listen(port, () => {
      console.log(`Application is running on: http://localhost:${port}`);
    });
  });
}