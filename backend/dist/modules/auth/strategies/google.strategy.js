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
exports.GoogleStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const prisma_service_1 = require("../../../common/database/prisma.service");
const config_1 = require("@nestjs/config");
let GoogleStrategy = class GoogleStrategy extends (0, passport_1.PassportStrategy)(passport_google_oauth20_1.Strategy, 'google') {
    prisma;
    configService;
    constructor(prisma, configService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || 'fallback_client_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'fallback_client_secret',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
            scope: ['email', 'profile'],
        });
        this.prisma = prisma;
        this.configService = configService;
    }
    async validate(accessToken, refreshToken, profile, done) {
        const { emails, displayName } = profile;
        if (!emails || emails.length === 0) {
            return done(new Error('No email found'), false);
        }
        const email = emails[0].value;
        try {
            // Find or create user
            let user = await this.prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                // Create new user
                user = await this.prisma.user.create({
                    data: {
                        email,
                        name: displayName || email.split('@')[0],
                        role: 'user',
                        plan: 'free',
                        status: 'active',
                    },
                });
            }
            done(null, user);
        }
        catch (error) {
            done(error, false);
        }
    }
};
exports.GoogleStrategy = GoogleStrategy;
exports.GoogleStrategy = GoogleStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], GoogleStrategy);
