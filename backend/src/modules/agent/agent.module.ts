import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { ScraperModule } from '../scraper/scraper.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        ScraperModule,
        HttpModule,
    ],
    controllers: [AgentController],
    providers: [AgentService],
    exports: [AgentService],
})
export class AgentModule { }
