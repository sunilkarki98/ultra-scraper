import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { UpdateLLMKeysDto, CreateWebhookDto, UpdateWebhookDto } from './dto';

@Controller('settings')
@UseGuards(AuthGuard(['jwt', 'api-key']))
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    @Get('llm-keys')
    async getLLMKeys(@Request() req: any) {
        return this.settingsService.getLLMKeys(req.user.id);
    }

    @Put('llm-keys')
    async updateLLMKeys(@Request() req: any, @Body() dto: UpdateLLMKeysDto) {
        return this.settingsService.updateLLMKeys(req.user.id, dto);
    }

    @Get('webhooks')
    async getWebhooks(@Request() req: any) {
        return this.settingsService.getWebhooks(req.user.id);
    }

    @Post('webhooks')
    async createWebhook(@Request() req: any, @Body() dto: CreateWebhookDto) {
        return this.settingsService.createWebhook(req.user.id, dto);
    }

    @Put('webhooks/:id')
    async updateWebhook(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateWebhookDto) {
        return this.settingsService.updateWebhook(req.user.id, id, dto);
    }

    @Delete('webhooks/:id')
    async deleteWebhook(@Request() req: any, @Param('id') id: string) {
        return this.settingsService.deleteWebhook(req.user.id, id);
    }
}
