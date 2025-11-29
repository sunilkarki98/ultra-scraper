"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const scrape_processor_1 = require("./processors/scrape.processor");
const prisma_module_1 = require("../../common/database/prisma.module");
const proxy_module_1 = require("../../common/proxy/proxy.module");
const scraper_module_1 = require("../scraper/scraper.module");
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            proxy_module_1.ProxyModule,
            (0, common_1.forwardRef)(() => scraper_module_1.ScraperModule),
            bull_1.BullModule.registerQueue({
                name: 'scrape-queue',
            }),
        ],
        providers: [scrape_processor_1.ScrapeProcessor],
        exports: [scrape_processor_1.ScrapeProcessor],
    })
], QueueModule);
