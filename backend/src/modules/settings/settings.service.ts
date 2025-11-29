import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { UpdateLLMKeysDto, CreateWebhookDto, UpdateWebhookDto } from './dto';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    // --- LLM Keys ---
    async updateLLMKeys(userId: string, dto: UpdateLLMKeysDto) {
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

    async getLLMKeys(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                openaiApiKey: true,
                anthropicApiKey: true,
                geminiApiKey: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
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
    async getWebhooks(userId: string) {
        const webhooks = await this.prisma.webhook.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return {
            success: true,
            webhooks,
        };
    }

    async createWebhook(userId: string, dto: CreateWebhookDto) {
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

    async updateWebhook(userId: string, webhookId: string, dto: UpdateWebhookDto) {
        const webhook = await this.prisma.webhook.findFirst({
            where: { id: webhookId, userId },
        });

        if (!webhook) {
            throw new NotFoundException('Webhook not found');
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

    async deleteWebhook(userId: string, webhookId: string) {
        const webhook = await this.prisma.webhook.findFirst({
            where: { id: webhookId, userId },
        });

        if (!webhook) {
            throw new NotFoundException('Webhook not found');
        }

        await this.prisma.webhook.delete({
            where: { id: webhookId },
        });

        return {
            success: true,
            message: 'Webhook deleted successfully',
        };
    }
}
