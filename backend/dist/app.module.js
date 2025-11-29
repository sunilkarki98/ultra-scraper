"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bull_1 = require("@nestjs/bull");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./common/database/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const admin_module_1 = require("./modules/admin/admin.module");
const scraper_module_1 = require("./modules/scraper/scraper.module");
const queue_module_1 = require("./modules/queue/queue.module");
const proxy_module_1 = require("./common/proxy/proxy.module");
const logger_module_1 = require("./common/logger/logger.module");
const settings_module_1 = require("./modules/settings/settings.module");
const user_module_1 = require("./modules/user/user.module");
const agent_module_1 = require("./modules/agent/agent.module");
const core_1 = require("@nestjs/core");
const plan_throttler_guard_1 = require("./common/throttling/plan-throttler.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Configuration
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            // Rate limiting
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000, // 60 seconds
                    limit: 10, // 10 requests per ttl
                }]),
            // Bull Queue
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    password: process.env.REDIS_PASSWORD,
                },
            }),
            // Database
            prisma_module_1.PrismaModule,
            // Feature modules
            auth_module_1.AuthModule,
            admin_module_1.AdminModule,
            scraper_module_1.ScraperModule,
            queue_module_1.QueueModule,
            proxy_module_1.ProxyModule,
            logger_module_1.LoggerModule,
            settings_module_1.SettingsModule,
            user_module_1.UserModule,
            agent_module_1.AgentModule,
        ],
        controllers: [],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: plan_throttler_guard_1.PlanThrottlerGuard,
            },
        ],
    })
], AppModule);
