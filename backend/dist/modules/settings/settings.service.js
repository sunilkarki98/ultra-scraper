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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
let SettingsService = class SettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // --- LLM Keys ---
    async updateLLMKeys(userId, dto) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                openaiApiKey: dto.openaiKey,
                anthropicApiKey: dto.anthropicKey,
                geminiApiKey: dto.geminiKey,
            },
        });
        return {
            success: true,
            message: 'LLM keys updated successfully',
        };
    }
    async getLLMKeys(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                openaiApiKey: true,
                anthropicApiKey: true,
                geminiApiKey: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            success: true,
            keys: {
                openaiKey: user.openaiApiKey,
                anthropicKey: user.anthropicApiKey,
                geminiKey: user.geminiApiKey,
            },
        };
    }
    // --- Webhooks ---
    async getWebhooks(userId) {
        const webhooks = await this.prisma.webhook.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return {
            success: true,
            webhooks,
        };
    }
    async createWebhook(userId, dto) {
        const webhook = await this.prisma.webhook.create({
            data: {
                userId,
                url: dto.url,
                secret: dto.secret || 'default-secret', // Should be generated if not provided
                events: dto.events || [],
            },
        });
        return {
            success: true,
            webhook,
        };
    }
    async updateWebhook(userId, webhookId, dto) {
        const webhook = await this.prisma.webhook.findFirst({
            where: { id: webhookId, userId },
        });
        if (!webhook) {
            throw new common_1.NotFoundException('Webhook not found');
        }
        await this.prisma.webhook.update({
            where: { id: webhookId },
            data: {
                url: dto.url,
                secret: dto.secret,
                events: dto.events,
            },
        });
        return {
            success: true,
            message: 'Webhook updated successfully',
        };
    }
    async deleteWebhook(userId, webhookId) {
        const webhook = await this.prisma.webhook.findFirst({
            where: { id: webhookId, userId },
        });
        if (!webhook) {
            throw new common_1.NotFoundException('Webhook not found');
        }
        await this.prisma.webhook.delete({
            where: { id: webhookId },
        });
        return {
            success: true,
            message: 'Webhook deleted successfully',
        };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
