import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessDataClient } from '../../utils/businessDataClient';

@Controller('business')
@UseGuards(AuthGuard('jwt'))
export class BusinessController {
    private businessClient: BusinessDataClient;

    constructor() {
        this.businessClient = new BusinessDataClient();
    }

    @Post('search')
    async search(@Body() body: { query: string; location: string; source: 'osm' | 'google'; apiKey?: string }) {
        return await this.businessClient.search(body.query, body.location, body.source, body.apiKey);
    }
}
