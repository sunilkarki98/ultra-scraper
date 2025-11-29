import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateApiKeyDto } from './dto';
import { nanoid } from 'nanoid';
import { redis } from '../../utils/redis';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Plan, UserStatus } from '../../types/auth.types';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async createUser(email: string, password?: string, name?: string) {
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        let passwordHash;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        const user = await this.prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                passwordHash,
                role: 'user',
                plan: Plan.FREE,
                status: UserStatus.ACTIVE,
            },
        });

        return user;
    }

    async validatePassword(user: any, password: string): Promise<boolean> {
        if (!user.passwordHash) return false;
        return bcrypt.compare(password, user.passwordHash);
    }

    async getUserByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }


    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                plan: true,
                status: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            success: true,
            user,
        };
    }

    async getUsage(userId: string) {
        const month = new Date().toISOString().slice(0, 7);
        const usage = await this.prisma.usage.findUnique({
            where: {
                userId_month: {
                    userId,
                    month,
                },
            },
        });

        return {
            success: true,
            usage: usage || {
                pagesScraped: 0,
                aiExtractions: 0,
                apiCalls: 0,
                bandwidthMB: 0,
            },
        };
    }



    async getApiKeys(userId: string) {
        const keys = await this.prisma.apiKey.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                key: true, // We need this to check existence, but we'll mask it
                name: true,
                lastUsedAt: true,
                createdAt: true,
                isActive: true,
            },
        });

        return {
            success: true,
            keys: keys.map(k => ({
                ...k,
                key: 'sk_********************', // Mask the key
            })),
        };
    }

    async createApiKey(userId: string, dto: CreateApiKeyDto) {
        const rawKey = `sk_${nanoid(32)}`;
        const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const apiKey = await this.prisma.apiKey.create({
            data: {
                key: hash, // Store the hash
                name: dto.name || 'Default Key',
                userId,
                isActive: true,
            },
        });

        return {
            success: true,
            apiKey: {
                ...apiKey,
                key: rawKey, // Return the raw key ONLY ONCE
            },
        };
    }

    async revokeApiKey(userId: string, keyId: string) {
        const apiKey = await this.prisma.apiKey.findFirst({
            where: { id: keyId, userId },
        });

        if (!apiKey) {
            throw new NotFoundException('API key not found');
        }

        await this.prisma.apiKey.update({
            where: { id: keyId },
            data: { isActive: false },
        });

        // Invalidate cache
        await redis.del(`apikey:${apiKey.key}`);

        return {
            success: true,
            message: 'API key revoked successfully',
        };
    }

    async trackUsage(userId: string, type: 'page' | 'ai' | 'api', amount: number = 1) {
        const month = new Date().toISOString().slice(0, 7);
        const fieldMap = {
            page: 'pagesScraped',
            ai: 'aiExtractions',
            api: 'apiCalls',
        };

        await this.prisma.usage.upsert({
            where: {
                userId_month: {
                    userId,
                    month,
                },
            },
            update: {
                [fieldMap[type]]: { increment: amount },
            },
            create: {
                userId,
                month,
                [fieldMap[type]]: amount,
            },
        });
    }
}
