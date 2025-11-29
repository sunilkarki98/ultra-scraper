"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const scraper_service_1 = require("../scraper/scraper.service");
const uuid_1 = require("uuid");
let AgentService = AgentService_1 = class AgentService {
    scraperService;
    logger = new common_1.Logger(AgentService_1.name);
    jobs = new Map();
    constructor(scraperService) {
        this.scraperService = scraperService;
    }
    async startLeadHunt(query, city, userId) {
        const fullQuery = city ? `${query} in ${city}` : query;
        const jobId = (0, uuid_1.v4)();
        this.logger.log(`Starting lead hunt for: ${fullQuery} (Job: ${jobId})`);
        // Initialize Job State
        this.jobs.set(jobId, {
            id: jobId,
            status: 'running',
            query: fullQuery,
            logs: [`Starting search for "${fullQuery}"...`],
            leads: [],
            progress: 0
        });
        // Start Async Process (Fire & Forget)
        this.runAgentWorkflow(jobId, fullQuery, userId).catch(err => {
            this.logger.error(`Agent Job ${jobId} failed: ${err.message}`);
            const job = this.jobs.get(jobId);
            if (job) {
                job.status = 'failed';
                job.logs.push(`Error: ${err.message}`);
            }
        });
        return {
            jobId,
            status: 'started',
            message: 'Agent started hunting for leads'
        };
    }
    async getJobStatus(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return { error: 'Job not found' };
        }
        return job;
    }
    async runAgentWorkflow(jobId, query, userId) {
        const job = this.jobs.get(jobId);
        // Step 1: Google Search
        job.logs.push(`Step 1: Searching Google for "${query}"...`);
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        // Trigger Scrape
        const searchJob = await this.scraperService.triggerScrape(googleUrl, {
            useAI: false, // Use standard Google Scraper
            waitForSelector: '#search'
        }, userId);
        job.logs.push(`Google Search Job triggered (ID: ${searchJob.jobId}). Waiting for results...`);
        // Poll for Search Results
        const searchResult = await this.waitForScrape(searchJob.jobId);
        if (!searchResult || !searchResult.result) {
            throw new Error('Failed to get search results from Google');
        }
        // Parse Links
        const links = searchResult.result.links || [];
        job.logs.push(`Found ${links.length} potential links.`);
        // Filter Links (Simple Heuristic: Ignore Google, Youtube, etc.)
        const targetLinks = links.filter((l) => {
            const url = l.href;
            return !url.includes('google.com') &&
                !url.includes('youtube.com') &&
                url.startsWith('http');
        }).slice(0, 5); // Limit to top 5 for this demo
        job.logs.push(`Selected ${targetLinks.length} targets for deep scanning.`);
        job.progress = 20;
        // Step 2: Deep Scan Each Link
        for (const [index, link] of targetLinks.entries()) {
            job.logs.push(`Scanning target ${index + 1}/${targetLinks.length}: ${link.text}...`);
            try {
                const leadJob = await this.scraperService.triggerScrape(link.href, {
                    extractLeads: true
                }, userId);
                const leadResult = await this.waitForScrape(leadJob.jobId);
                if (leadResult && leadResult.result && leadResult.result.leads) {
                    const leads = leadResult.result.leads;
                    const hasLeads = leads.emails?.length > 0 || leads.phones?.length > 0;
                    if (hasLeads) {
                        job.leads.push({
                            name: link.text,
                            url: link.href,
                            emails: leads.emails,
                            phones: leads.phones,
                            socials: leads.socialLinks
                        });
                        job.logs.push(`✅ Found leads for ${link.text}`);
                    }
                    else {
                        job.logs.push(`❌ No leads found for ${link.text}`);
                    }
                }
            }
            catch (e) {
                job.logs.push(`⚠️ Failed to scan ${link.text}`);
            }
            // Update Progress
            job.progress = 20 + Math.floor(((index + 1) / targetLinks.length) * 80);
        }
        job.status = 'completed';
        job.logs.push('Agent workflow completed successfully.');
        job.progress = 100;
    }
    async waitForScrape(jobId) {
        let attempts = 0;
        while (attempts < 60) { // 30 seconds max
            const job = await this.scraperService.getJobStatus(jobId);
            if (job && job.status === 'completed') {
                return job;
            }
            if (job && job.status === 'failed') {
                throw new Error(job.error || 'Scrape job failed');
            }
            await new Promise(r => setTimeout(r, 1000)); // Wait 1s
            attempts++;
        }
        throw new Error('Timeout waiting for scrape job');
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = AgentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService])
], AgentService);
