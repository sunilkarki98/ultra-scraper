import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaService } from '../../../common/database/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || 'fallback_client_id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'fallback_client_secret',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
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
        } catch (error) {
            done(error, false);
        }
    }
}
