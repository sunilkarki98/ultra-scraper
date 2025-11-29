import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { WebsiteAnalyzerService } from './website-analyzer.service';
import { ScrapyClientService } from './scrapy-client.service';
import { ScraperFactory } from './ScraperFactory';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../../common/database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        PrismaModule,
        UserModule,
        AuthModule,
        forwardRef(() => QueueModule),
        HttpModule,
        BullModule.registerQueue({
            name: 'scrape-queue',
        }),
    ],
    controllers: [ScraperController],
    providers: [ScraperService, WebsiteAnalyzerService, ScrapyClientService, ScraperFactory],
    exports: [ScraperService, WebsiteAnalyzerService, ScrapyClientService, ScraperFactory],
})
export class ScraperModule { }

