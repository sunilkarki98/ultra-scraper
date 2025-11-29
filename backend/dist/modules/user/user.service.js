"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/database/prisma.service");
const nanoid_1 = require("nanoid");
const redis_1 = require("../../utils/redis");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const auth_types_1 = require("../../types/auth.types");
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createUser(email, password, name) {
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new common_1.ConflictException('User already exists');
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
                plan: auth_types_1.Plan.FREE,
                status: auth_types_1.UserStatus.ACTIVE,
            },
        });
        return user;
    }
    async validatePassword(user, password) {
        if (!user.passwordHash)
            return false;
        return bcrypt.compare(password, user.passwordHash);
    }
    async getUserByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async getProfile(userId) {
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
            throw new common_1.NotFoundException('User not found');
        }
        return {
            success: true,
            user,
        };
    }
    async getUsage(userId) {
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
    async getApiKeys(userId) {
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
    async createApiKey(userId, dto) {
        const rawKey = `sk_${(0, nanoid_1.nanoid)(32)}`;
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
    async revokeApiKey(userId, keyId) {
        const apiKey = await this.prisma.apiKey.findFirst({
            where: { id: keyId, userId },
        });
        if (!apiKey) {
            throw new common_1.NotFoundException('API key not found');
        }
        await this.prisma.apiKey.update({
            where: { id: keyId },
            data: { isActive: false },
        });
        // Invalidate cache
        await redis_1.redis.del(`apikey:${apiKey.key}`);
        return {
            success: true,
            message: 'API key revoked successfully',
        };
    }
    async trackUsage(userId, type, amount = 1) {
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
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
