import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('api-key'), AdminGuard)
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('proxies')
    async getProxies() {
        return this.adminService.getProxies();
    }

    @Post('proxies')
    async addProxy(@Body('url') url: string) {
        return this.adminService.addProxy(url);
    }

    @Delete('proxies/:url')
    async removeProxy(@Param('url') url: string) {
        return this.adminService.removeProxy(decodeURIComponent(url));
    }

    @Get('rate-limits')
    async getRateLimits() {
        return this.adminService.getRateLimits();
    }

    @Put('rate-limits')
    async updateRateLimits(@Body() config: any) {
        return this.adminService.updateRateLimits(config);
    }

    @Get('llm-configs')
    async getLLMConfigs() {
        return this.adminService.getLLMConfigs();
    }

    @Post('llm-configs')
    async addLLMConfig(@Body() data: any) {
        return this.adminService.addLLMConfig(data);
    }

    @Put('llm-configs/:id')
    async updateLLMConfig(@Param('id') id: string, @Body() data: any) {
        return this.adminService.updateLLMConfig({ id, ...data });
    }

    @Delete('llm-configs/:id')
    async deleteLLMConfig(@Param('id') id: string) {
        return this.adminService.deleteLLMConfig(id);
    }

    @Get('users')
    async getUsers(@Query('page') page: number, @Query('limit') limit: number) {
        return this.adminService.getUsers(page || 1, limit || 20);
    }

    @Put('users/:id')
    async updateUser(@Param('id') id: string, @Body() data: any) {
        return this.adminService.updateUser(id, data);
    }

    @Get('queues/stats')
    async getQueueStats() {
        return this.adminService.getQueueStats();
    }

    @Get('queues/jobs/:status')
    async getJobsByStatus(@Param('status') status: string) {
        return this.adminService.getJobsByStatus(status);
    }

    @Post('queues/jobs/:id/retry')
    async retryJob(@Param('id') id: string) {
        return this.adminService.retryJob(id);
    }

    @Delete('queues/jobs/:status')
    async cleanQueue(@Param('status') status: string) {
        return this.adminService.cleanQueue(status);
    }
}
