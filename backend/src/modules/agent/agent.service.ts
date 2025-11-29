import { Injectable, Logger } from '@nestjs/common';
import { ScraperService } from '../scraper/scraper.service';
import { v4 as uuidv4 } from 'uuid';

interface AgentJob {
    id: string;
    status: 'running' | 'completed' | 'failed';
    query: string;
    logs: string[];
    leads: any[];
    progress: number;
}

@Injectable()
export class AgentService {
    private readonly logger = new Logger(AgentService.name);
    private jobs: Map<string, AgentJob> = new Map();

    constructor(private readonly scraperService: ScraperService) { }

    async startLeadHunt(query: string, city: string | undefined, userId: string) {
        const fullQuery = city ? `${query} in ${city}` : query;
        const jobId = uuidv4();

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

    async getJobStatus(jobId: string) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return { error: 'Job not found' };
        }
        return job;
    }

    private async runAgentWorkflow(jobId: string, query: string, userId: string) {
        const job = this.jobs.get(jobId)!;

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
        const targetLinks = links.filter((l: any) => {
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
                    } else {
                        job.logs.push(`❌ No leads found for ${link.text}`);
                    }
                }
            } catch (e) {
                job.logs.push(`⚠️ Failed to scan ${link.text}`);
            }

            // Update Progress
            job.progress = 20 + Math.floor(((index + 1) / targetLinks.length) * 80);
        }

        job.status = 'completed';
        job.logs.push('Agent workflow completed successfully.');
        job.progress = 100;
    }

    private async waitForScrape(jobId: string): Promise<any> {
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
}
