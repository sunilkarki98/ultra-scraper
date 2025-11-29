import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../common/database/prisma.service';
import { ProxyService } from '../../common/proxy/proxy.service';
import { redis } from '../../utils/redis';
import { AddProxyDto, UpdateRateLimitsDto, UpdateUserDto } from './dto';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue('scrape-queue') private scrapeQueue: Queue,
        private proxyService: ProxyService,
    ) { }

    // --- Proxies ---
    async getProxies() {
        return {
            success: true,
            proxies: this.proxyService.getAllProxies(),
        };
    }

    async addProxy(url: string) {
        this.proxyService.addProxy(url);
        return {
            success: true,
            message: 'Proxy added successfully',
        };
    }

    async removeProxy(url: string) {
        this.proxyService.removeProxy(url);
        return {
            success: true,
            message: 'Proxy removed successfully',
        };
    }

    // --- Rate Limits ---
    async getRateLimits() {
        const freePoints = await redis.get('ratelimit:config:free:points') || '5';
        const freeDuration = await redis.get('ratelimit:config:free:duration') || '60';
        const proPoints = await redis.get('ratelimit:config:pro:points') || '100';
        const proDuration = await redis.get('ratelimit:config:pro:duration') || '60';

        return {
            success: true,
            config: {
                free: { points: parseInt(freePoints), duration: parseInt(freeDuration) },
                pro: { points: parseInt(proPoints), duration: parseInt(proDuration) },
            },
        };
    }

    async updateRateLimits(dto: UpdateRateLimitsDto) {
        await redis.set('ratelimit:config:free:points', dto.free.points);
        await redis.set('ratelimit:config:free:duration', dto.free.duration);
        await redis.set('ratelimit:config:pro:points', dto.pro.points);
        await redis.set('ratelimit:config:pro:duration', dto.pro.duration);

        return {
            success: true,
            message: 'Rate limits updated successfully',
        };
    }

    // --- LLM Configurations ---
    async getLLMConfigs() {
        const configsJson = await redis.get('config:llm:configurations') || '[]';
        const configs = JSON.parse(configsJson);

        // Mask API keys for security
        const maskedConfigs = configs.map((config: any) => ({
            ...config,
            apiKey: config.apiKey ? `...${config.apiKey.slice(-4)}` : '',
        }));

        return {
            success: true,
            configurations: maskedConfigs,
        };
    }

    async addLLMConfig(dto: { provider: string; model: string; apiKey: string }) {
        const configsJson = await redis.get('config:llm:configurations') || '[]';
        const configs = JSON.parse(configsJson);

        const newConfig = {
            id: `llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            provider: dto.provider,
            model: dto.model,
            apiKey: dto.apiKey,
            createdAt: Date.now(),
        };

        configs.push(newConfig);
        await redis.set('config:llm:configurations', JSON.stringify(configs));

        return {
            success: true,
            message: 'LLM configuration added successfully',
            configuration: {
                ...newConfig,
                apiKey: `...${newConfig.apiKey.slice(-4)}`,
            },
        };
    }

    async updateLLMConfig(dto: { id: string; provider?: string; model?: string; apiKey?: string }) {
        const configsJson = await redis.get('config:llm:configurations') || '[]';
        const configs = JSON.parse(configsJson);

        const configIndex = configs.findIndex((c: any) => c.id === dto.id);
        if (configIndex === -1) {
            return {
                success: false,
                error: 'Configuration not found',
            };
        }

        if (dto.provider) configs[configIndex].provider = dto.provider;
        if (dto.model) configs[configIndex].model = dto.model;
        if (dto.apiKey) configs[configIndex].apiKey = dto.apiKey;

        await redis.set('config:llm:configurations', JSON.stringify(configs));

        return {
            success: true,
            message: 'LLM configuration updated successfully',
        };
    }

    async deleteLLMConfig(id: string) {
        const configsJson = await redis.get('config:llm:configurations') || '[]';
        let configs = JSON.parse(configsJson);

        const initialLength = configs.length;
        configs = configs.filter((c: any) => c.id !== id);

        if (configs.length === initialLength) {
            return {
                success: false,
                error: 'Configuration not found',
            };
        }

        await redis.set('config:llm:configurations', JSON.stringify(configs));

        return {
            success: true,
            message: 'LLM configuration deleted successfully',
        };
    }

    // --- Users ---
    async getUsers(page: number, limit: number) {
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

    async updateUser(id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
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

    async getJobsByStatus(status: string) {
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
                throw new NotFoundException('Invalid status');
        }

        return {
            success: true,
            jobs,
        };
    }

    async retryJob(id: string) {
        const job = await this.scrapeQueue.getJob(id);
        if (!job) {
            throw new NotFoundException('Job not found');
        }

        await job.retry();
        return {
            success: true,
            message: 'Job retried successfully',
        };
    }

    async cleanQueue(status: string) {
        if (!['completed', 'wait', 'active', 'delayed', 'failed'].includes(status)) {
            throw new NotFoundException('Invalid status for cleaning');
        }

        // Bull's clean method takes 'completed', 'wait', 'active', 'delayed', 'failed'
        // But the type definition might expect specific string literals.
        // Casting status to any to avoid strict type issues if necessary, or mapping to correct types.
        await this.scrapeQueue.clean(0, status as any);

        return {
            success: true,
            message: `Queue cleaned for status: ${status}`,
        };
    }
}
