import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { AuthService } from '../auth.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, 'api-key') {
    constructor(private authService: AuthService) {
        super({ header: 'x-api-key', prefix: '' }, true, async (apiKey: string, done: (error: Error | null, data: any) => {}) => {
            return this.validate(apiKey, done);
        });
    }

    async validate(apiKey: string, done: (error: Error | null, data: any) => {}) {
        try {
            const user = await this.authService.validateApiKey(apiKey);
            if (!user) {
                return done(new UnauthorizedException(), null);
            }
            return done(null, user);
        } catch (error) {
            return done(error as Error, null);
        }
    }
}
