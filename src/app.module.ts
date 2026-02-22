// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';

// Infrastructure
import { QueueModule } from '@infrastructure/queues/queue.module';

// Feature modules
import { RbacModule } from '@modules/rbac/rbac.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';

/*
  WHY THIS FILE EXISTS:
  This is the root module — the entry point of your entire NestJS app.
  Every module you build must be imported here (directly or indirectly)
  to be active. Think of it as the table of contents for your whole app.
  NestJS reads this file first when it boots up and builds the
  entire dependency tree from it.
*/

@Module({
  imports: [
    /*
      ConfigModule.forRoot() loads your .env file and makes
      ConfigService available everywhere in the app.
      isGlobal: true means you don't need to import ConfigModule
      again in every single module — it's available everywhere automatically.
    */
    ConfigModule.forRoot({ isGlobal: true }),

    /*
      MongooseModule.forRootAsync() sets up the MongoDB connection.
      We use forRootAsync because we need ConfigService to read
      MONGODB_URI from .env — that value isn't available at import time.
      This single connection is shared across all modules in the app.
    */
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI'),
      }),
    }),

    /*
      CacheModule sets up Redis caching globally.
      isGlobal: true means RbacCacheService can inject it
      anywhere without re-importing CacheModule each time.
      This is what makes permission checks fast — cached results
      don't need a MongoDB round trip.
    */
    CacheModule.register({ isGlobal: true }),

    /*
      QueueModule sets up BullMQ with Redis connection.
      Must be imported here so the audit queue is available
      across the entire app — specifically for QueueService
      which permissions.guard.ts uses to log every permission check.
    */
    QueueModule,

    /*
      AuthModule sets up JWT validation and Passport.
      Must be imported here because JwtAuthGuard is used
      in controllers across multiple modules.
      AuthModule exports JwtAuthGuard so all other modules
      can use it without importing AuthModule themselves.
    */
    AuthModule,

    /*
      RbacModule brings in everything RBAC related:
      roles, permissions, user-roles, audit, and context evaluation.
      This is the core of your entire system.
    */
    RbacModule,

    /*
      UsersModule registers the /users routes and UsersService.
      It depends on AuthModule being loaded first for JwtAuthGuard —
      NestJS handles that dependency order automatically.
    */
    UsersModule,
  ],
})
export class AppModule {}