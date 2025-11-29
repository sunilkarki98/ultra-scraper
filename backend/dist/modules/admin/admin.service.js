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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../common/database/prisma.service");
const proxy_service_1 = require("../../common/proxy/proxy.service");
const redis_1 = require("../../utils/redis");
let AdminService = class AdminService {
    prisma;
    scrapeQueue;
    proxyService;
    constructor(prisma, scrapeQueue, proxyService) {
        this.prisma = prisma;
        this.scrapeQueue = scrapeQueue;
        this.proxyService = proxyService;
    }
    // --- Proxies ---
    async getProxies() {
        return {
            success: true,
            proxies: this.proxyService.getAllProxies(),
        };
    }
    async addProxy(url) {
        this.proxyService.addProxy(url);
        return {
            success: true,
            message: 'Proxy added successfully',
        };
    }
    async removeProxy(url) {
        this.proxyService.removeProxy(url);
        return {
            success: true,
            message: 'Proxy removed successfully',
        };
    }
    // --- Rate Limits ---
    async getRateLimits() {
        const freePoints = await redis_1.redis.get('ratelimit:config:free:points') || '5';
        const freeDuration = await redis_1.redis.get('ratelimit:config:free:duration') || '60';
        const proPoints = await redis_1.redis.get('ratelimit:config:pro:points') || '100';
        const proDuration = await redis_1.redis.get('ratelimit:config:pro:duration') || '60';
        return {
            success: true,
            config: {
                free: { points: parseInt(freePoints), duration: parseInt(freeDuration) },
                pro: { points: parseInt(proPoints), duration: parseInt(proDuration) },
            },
        };
    }
    async updateRateLimits(dto) {
        await redis_1.redis.set('ratelimit:config:free:points', dto.free.points);
        await redis_1.redis.set('ratelimit:config:free:duration', dto.free.duration);
        await redis_1.redis.set('ratelimit:config:pro:points', dto.pro.points);
        await redis_1.redis.set('ratelimit:config:pro:duration', dto.pro.duration);
        return {
            success: true,
            message: 'Rate limits updated successfully',
        };
    }
    // --- LLM Configurations ---
    async getLLMConfigs() {
        const configsJson = await redis_1.redis.get('config:llm:configurations') || '[]';
        const configs = JSON.parse(configsJson);
        // Mask API keys for security
        const maskedConfigs = configs.map((config) => ({
            ...config,
            apiKey: config.apiKey ? `...${config.apiKey.slice(-4)}` : '',
        }));
        return {
            success: true,
            configurations: maskedConfigs,
        };
    }
    async addLLMConfig(dto) {
        const configsJson = await redis_1.redis.get('config:llm:configurations') || '[]';
        const configs = JSON.parse(configsJson);
        const newConfig = {
            id: `llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            provider: dto.provider,
            model: dto.model,
            apiKey: dto.apiKey,
            createdAt: Date.now(),
        };
        configs.push(newConfig);
        await redis_1.redis.set('config:llm:configurations', JSON.stringify(configs));
        return {
            success: true,
            message: 'LLM configuration added successfully',
            configuration: {
                ...newConfig,
                apiKey: `...${newConfig.apiKey.slice(-4)}`,
            },
        };
    }
    async updateLLMConfig(dto) {
        const configsJson = await redis_1.redis.get('config:llm:configurations') || '[]';
        const configs = JSON.parse(configsJson);
        const configIndex = configs.findIndex((c) => c.id === dto.id);
        if (configIndex === -1) {
            return {
                success: false,
                error: 'Configuration not found',
            };
        }
        if (dto.provider)
            configs[configIndex].provider = dto.provider;
        if (dto.model)
            configs[configIndex].model = dto.model;
        if (dto.apiKey)
            configs[configIndex].apiKey = dto.apiKey;
        await redis_1.redis.set('config:llm:configurations', JSON.stringify(configs));
        return {
            success: true,
            message: 'LLM configuration updated successfully',
        };
    }
    async deleteLLMConfig(id) {
        const configsJson = await redis_1.redis.get('config:llm:configurations') || '[]';
        let configs = JSON.parse(configsJson);
        const initialLength = configs.length;
        configs = configs.filter((c) => c.id !== id);
        if (configs.length === initialLength) {
            return {
                success: false,
                error: 'Configuration not found',
            };
        }
        await redis_1.redis.set('config:llm:configurations', JSON.stringify(configs));
        return {
            success: true,
            message: 'LLM configuration deleted successfully',
        };
    }
    // --- Users ---
    async getUsers(page, limit) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    plan: true,
                    status: true,
                    createdAt: true,
                    _count: {
                        select: { jobs: true },
                    },
                },
            }),
            this.prisma.user.count(),
        ]);
        return {
            success: true,
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async updateUser(id, dto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.prisma.user.update({
            where: { id },
            data: {
                ...dto,
            },
        });
        return {
            success: true,
            message: 'User updated successfully',
        };
    }
    // --- Queue Stats ---
    async getQueueStats() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.scrapeQueue.getWaitingCount(),
            this.scrapeQueue.getActiveCount(),
            this.scrapeQueue.getCompletedCount(),
            this.scrapeQueue.getFailedCount(),
            this.scrapeQueue.getDelayedCount(),
        ]);
        return {
            success: true,
            stats: {
                waiting,
                active,
                completed,
                failed,
                delayed,
                total: waiting + active + completed + failed + delayed,
            },
        };
    }
    async getJobsByStatus(status) {
        let jobs;
        switch (status) {
            case 'active':
                jobs = await this.scrapeQueue.getActive();
                break;
            case 'waiting':
                jobs = await this.scrapeQueue.getWaiting();
                break;
            case 'completed':
                jobs = await this.scrapeQueue.getCompleted();
                break;
            case 'failed':
                jobs = await this.scrapeQueue.getFailed();
                break;
            case 'delayed':
                jobs = await this.scrapeQueue.getDelayed();
                break;
            default:
                throw new common_1.NotFoundException('Invalid status');
        }
        return {
            success: true,
            jobs,
        };
    }
    async retryJob(id) {
        const job = await this.scrapeQueue.getJob(id);
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        await job.retry();
        return {
            success: true,
            message: 'Job retried successfully',
        };
    }
    async cleanQueue(status) {
        if (!['completed', 'wait', 'active', 'delayed', 'failed'].includes(status)) {
            throw new common_1.NotFoundException('Invalid status for cleaning');
        }
        // Bull's clean method takes 'completed', 'wait', 'active', 'delayed', 'failed'
        // But the type definition might expect specific string literals.
        // Casting status to any to avoid strict type issues if necessary, or mapping to correct types.
        await this.scrapeQueue.clean(0, status);
        return {
            success: true,
            message: `Queue cleaned for status: ${status}`,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('scrape-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, proxy_service_1.ProxyService])
], AdminService);
