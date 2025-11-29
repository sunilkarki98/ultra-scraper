"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../common/database/prisma.service");
const security_1 = require("../../utils/security");
const user_service_1 = require("../user/user.service");
let ScraperService = class ScraperService {
    prisma;
    scrapeQueue;
    userService;
    constructor(prisma, scrapeQueue, userService) {
        this.prisma = prisma;
        this.scrapeQueue = scrapeQueue;
        this.userService = userService;
    }
    async triggerScrape(url, options, userId) {
        // 🛡️ SECURITY CHECK
        const isSafe = await security_1.SecurityGuard.isSafeUrl(url);
        if (!isSafe) {
            throw new Error('Forbidden: The provided URL is restricted or resolves to a private network.');
        }
        // 💾 PERSISTENCE: Create Job Record
        const jobRecord = await this.prisma.job.create({
            data: {
                url,
                userId,
                status: 'pending',
            },
        });
        // Add to Queue
        const jobId = Buffer.from(url).toString('base64');
        const job = await this.scrapeQueue.add('scrape', { url, options, dbJobId: jobRecord.id }, { jobId });
        // Track usage
        if (userId) {
            await this.userService.trackUsage(userId, 'api');
            await this.userService.trackUsage(userId, 'page');
            if (options?.useAI) {
                await this.userService.trackUsage(userId, 'ai');
            }
        }
        return {
            jobId: jobRecord.id,
            queueId: job.id,
            statusUrl: `/api/scraper/job/${jobRecord.id}`,
        };
    }
    async getJobStatus(id) {
        const jobRecord = await this.prisma.job.findUnique({ where: { id } });
        if (!jobRecord) {
            return null;
        }
        return jobRecord;
    }
    async getUserJobs(userId, limit = 20, offset = 0) {
        return this.prisma.job.findMany({
            where: { userId },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('scrape-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, user_service_1.UserService])
], ScraperService);
