import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CreateApiKeyDto } from './dto';

@Controller('user')
@UseGuards(AuthGuard(['jwt', 'api-key']))
export class UserController {
    constructor(private userService: UserService) { }

    @Get('profile')
    async getProfile(@Request() req: any) {
        return this.userService.getProfile(req.user.id);
    }

    @Get('usage')
    async getUsage(@Request() req: any) {
        return this.userService.getUsage(req.user.id);
    }

    @Get('api-keys')
    async getApiKeys(@Request() req: any) {
        return this.userService.getApiKeys(req.user.id);
    }

    @Post('api-keys')
    async createApiKey(@Request() req: any, @Body() dto: CreateApiKeyDto) {
        return this.userService.createApiKey(req.user.id, dto);
    }

    @Delete('api-keys/:id')
    async revokeApiKey(@Request() req: any, @Param('id') id: string) {
        return this.userService.revokeApiKey(req.user.id, id);
    }
}
