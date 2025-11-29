import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { BusinessModule } from './modules/business/business.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { QueueModule } from './modules/queue/queue.module';
import { ProxyModule } from './common/proxy/proxy.module';
import { LoggerModule } from './common/logger/logger.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UserModule } from './modules/user/user.module';
import { AgentModule } from './modules/agent/agent.module';
import { APP_GUARD } from '@nestjs/core';
import { PlanThrottlerGuard } from './common/throttling/plan-throttler.guard';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Rate limiting
        ThrottlerModule.forRoot([{
            ttl: 60000, // 60 seconds
            limit: 10,  // 10 requests per ttl
        }]),

        // Bull Queue
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
            },
        }),

        // Database
        PrismaModule,

        // Feature modules
        AuthModule,
        AdminModule,
        ScraperModule,
        QueueModule,
        ProxyModule,
        LoggerModule,
        SettingsModule,
        UserModule,
        AgentModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: PlanThrottlerGuard,
        },
    ],
})
export class AppModule { }
