import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../common/database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        BullModule.registerQueue({
            name: 'scrape-queue',
        }),
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
