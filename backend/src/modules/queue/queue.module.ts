import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScrapeProcessor } from './processors/scrape.processor';
import { PrismaModule } from '../../common/database/prisma.module';
import { ProxyModule } from '../../common/proxy/proxy.module';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
    imports: [
        PrismaModule,
        ProxyModule,
        forwardRef(() => ScraperModule),
        BullModule.registerQueue({
            name: 'scrape-queue',
        }),
    ],
    providers: [ScrapeProcessor],
    exports: [ScrapeProcessor],
})
export class QueueModule { }

