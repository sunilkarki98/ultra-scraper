import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async validateApiKey(apiKey: string) {
        const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
        const keyRecord = await this.prisma.apiKey.findUnique({
            where: { key: hash },
            include: { user: true },
        });

        if (!keyRecord || !keyRecord.isActive) {
            return null;
        }

        // Update last used
        await this.prisma.apiKey.update({
            where: { id: keyRecord.id },
            data: { lastUsedAt: new Date() },
        });

        return keyRecord.user;
    }
}
