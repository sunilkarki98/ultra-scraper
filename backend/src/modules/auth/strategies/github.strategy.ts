import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { PrismaService } from '../../../common/database/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        super({
            clientID: process.env.GITHUB_CLIENT_ID || 'fallback_client_id',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || 'fallback_client_secret',
            callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
            scope: ['user:email'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any,
    ): Promise<any> {
        const { emails, displayName, username } = profile;

        // GitHub might not return email in profile, check emails array
        const email = emails && emails.length > 0
            ? emails.find((e: any) => e.primary)?.value || emails[0].value
            : null;

        if (!email) {
            return done(new Error('No email found'), false);
        }

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
                        name: displayName || username || email.split('@')[0],
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
