import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { PrismaModule } from '../../common/database/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        PrismaModule,
        UserModule,
        PassportModule,
        JwtModule.register({
            secret: (() => {
                const secret = process.env.JWT_SECRET;
                if (!secret && process.env.NODE_ENV === 'production') {
                    throw new Error('CRITICAL: JWT_SECRET environment variable must be set in production');
                }
                return secret || 'dev-secret-key-change-in-production';
            })(),
            signOptions: { expiresIn: '7d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, ApiKeyStrategy, GoogleStrategy, GithubStrategy],
    exports: [AuthService],
})
export class AuthModule { }
