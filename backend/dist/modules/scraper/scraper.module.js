"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const axios_1 = require("@nestjs/axios");
const scraper_controller_1 = require("./scraper.controller");
const scraper_service_1 = require("./scraper.service");
const website_analyzer_service_1 = require("./website-analyzer.service");
const scrapy_client_service_1 = require("./scrapy-client.service");
const queue_module_1 = require("../queue/queue.module");
const prisma_module_1 = require("../../common/database/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const user_module_1 = require("../user/user.module");
let ScraperModule = class ScraperModule {
};
exports.ScraperModule = ScraperModule;
exports.ScraperModule = ScraperModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            user_module_1.UserModule,
            auth_module_1.AuthModule,
            (0, common_1.forwardRef)(() => queue_module_1.QueueModule),
            axios_1.HttpModule,
            bull_1.BullModule.registerQueue({
                name: 'scrape-queue',
            }),
        ],
        controllers: [scraper_controller_1.ScraperController],
        providers: [scraper_service_1.ScraperService, website_analyzer_service_1.WebsiteAnalyzerService, scrapy_client_service_1.ScrapyClientService],
        exports: [scraper_service_1.ScraperService, website_analyzer_service_1.WebsiteAnalyzerService, scrapy_client_service_1.ScrapyClientService],
    })
], ScraperModule);
