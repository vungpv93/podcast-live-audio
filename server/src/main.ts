process.env.TZ = 'Asia/Ho_Chi_Minh';

import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { winstonLogger } from './common/logger/winston.util';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as expressBasicAuth from 'express-basic-auth';

class Application {
  private readonly logger = new Logger(Application.name);
  private readonly DEV_MODE: boolean;
  private readonly PORT: string;
  private readonly corsOriginList: string[];
  private readonly ADMIN_USER: string;
  private readonly ADMIN_PASSWORD: string;
  private readonly Domain: string;

  constructor(private readonly server: NestExpressApplication) {
    this.server = server;

    if (!process.env.SECRET_KEY) this.logger.error('Set "SECRET" env');
    this.DEV_MODE = process.env.NODE_ENV !== 'production';
    this.PORT = process.env.PORT || '5000';
    this.corsOriginList = process.env.CORS_ORIGIN_LIST
      ? process.env.CORS_ORIGIN_LIST.split(',').map((origin) => origin.trim())
      : ['*'];
    this.ADMIN_USER = process.env.ADMIN_USER || 'username';
    this.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234';
    this.Domain = process.env.DOMAIN || 'http://localhost';
  }

  // docs secure
  private setUpBasicAuth() {
    this.server.use(
      ['/api-docs', '/docs', '/docs-json'],
      expressBasicAuth({
        challenge: true,
        users: {
          [this.ADMIN_USER]: this.ADMIN_PASSWORD,
        },
      }),
    );
  }

  private setUpOpenAPIMidleware() {
    SwaggerModule.setup(
      'api-docs',
      this.server,
      SwaggerModule.createDocument(
        this.server,
        new DocumentBuilder().setTitle('API DOCS').setDescription('nestJS boilerplate').setVersion('1.0').build(),
      ),
    );
  }

  private async setUpGlobalMiddleware() {
    this.server.enableCors({
      origin: this.corsOriginList,
      credentials: true,
    });
    this.server.use(cookieParser());
    this.setUpBasicAuth();
    this.setUpOpenAPIMidleware();
    this.server.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );
    this.server.use(passport.initialize());
    this.server.useGlobalInterceptors(new ClassSerializerInterceptor(this.server.get(Reflector)));
  }

  async bootstrap() {
    await this.setUpGlobalMiddleware();
    await this.server.listen(this.PORT);
  }

  startLog() {
    if (this.DEV_MODE) {
      this.logger.log(`✅ Server on ${this.Domain}:${this.PORT}`);
    } else {
      this.logger.log(`✅ Server on port ${this.PORT}...`);
    }
  }

  errorLog(error: string) {
    this.logger.error(`🆘 Server error ${error}`);
  }
}

async function init(): Promise<void> {
  const server = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: winstonLogger,
  });
  const app = new Application(server);
  await app.bootstrap();
  app.startLog();
}

init().catch((error) => {
  new Logger('init').error(error);
});
