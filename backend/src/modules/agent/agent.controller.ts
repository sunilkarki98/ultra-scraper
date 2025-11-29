import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('agent')
@UseGuards(AuthGuard(['jwt', 'api-key']))
export class AgentController {
    constructor(private readonly agentService: AgentService) { }

    @Post('hunt')
    async startLeadHunt(@Body() body: { query: string; city?: string }, @Request() req: any) {
        return this.agentService.startLeadHunt(body.query, body.city, req.user.id);
    }

    @Get('job/:id')
    async getJobStatus(@Param('id') id: string) {
        return this.agentService.getJobStatus(id);
    }
}
