import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException, NotFoundException, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScraperService } from './scraper.service';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { QuotaGuard } from '../auth/guards/quota.guard';
import { IsUrl, IsOptional, IsBoolean, IsObject } from 'class-validator';

class ScrapeDto {
    @IsUrl()
    url!: string;

    @IsOptional()
    @IsObject()
    options?: any;
}

@Controller('scraper')
export class ScraperController {
    constructor(private scraperService: ScraperService) { }

    @Post('trigger')
    @UseGuards(OptionalAuthGuard, QuotaGuard)
    async triggerScrape(@Body() dto: ScrapeDto, @Request() req: any) {
        try {
            const result = await this.scraperService.triggerScrape(dto.url, dto.options, req.user?.id);
            return { success: true, ...result };
        } catch (error: any) {
            if (error.message.startsWith('Forbidden')) {
                throw new ForbiddenException(error.message);
            }
            throw error;
        }
    }

    @Get('job/:id')
    async getJobStatus(@Param('id') id: string) {
        const job = await this.scraperService.getJobStatus(id);
        if (!job) {
            throw new NotFoundException('Job not found');
        }
        return {
            success: true,
            jobId: job.id,
            state: job.status,
            result: job.result,
            error: job.error,
            createdAt: job.createdAt,
        };
    }

    @Get('jobs')
    @UseGuards(AuthGuard(['jwt', 'api-key']))
    async getUserJobs(@Request() req: any, @Query('limit') limit?: number, @Query('offset') offset?: number) {
        const jobs = await this.scraperService.getUserJobs(
            req.user.id,
            limit ? parseInt(limit.toString()) : 20,
            offset ? parseInt(offset.toString()) : 0
        );
        return {
            success: true,
            jobs,
        };
    }

    @Get('quick')
    @UseGuards(AuthGuard(['jwt', 'api-key']))
    async quickScrape(@Query('url') url: string, @Request() req: any, @Query() options?: any) {
        if (!url) {
            throw new ForbiddenException('URL parameter is required');
        }

        try {
            const result = await this.scraperService.triggerScrape(url, options, req.user?.id);
            return { success: true, ...result };
        } catch (error: any) {
            if (error.message.startsWith('Forbidden')) {
                throw new ForbiddenException(error.message);
            }
            throw error;
        }
    }
}
