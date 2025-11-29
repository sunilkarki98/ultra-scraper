import { Test, TestingModule } from '@nestjs/testing';
import { WebsiteAnalyzerService } from '../src/modules/scraper/website-analyzer.service';
import { ScrapyClientService } from '../src/modules/scraper/scrapy-client.service';
import { HttpModule } from '@nestjs/axios';
import { Logger } from '@nestjs/common';

async function runVerification() {
    const logger = new Logger('Verification');

    // Mock config for testing
    process.env.SCRAPY_ENABLED = 'true';
    process.env.SCRAPY_SERVICE_URL = 'http://localhost:8001';

    const module: TestingModule = await Test.createTestingModule({
        imports: [HttpModule],
        providers: [
            WebsiteAnalyzerService,
            ScrapyClientService,
        ],
    }).compile();

    const analyzer = module.get<WebsiteAnalyzerService>(WebsiteAnalyzerService);
    const client = module.get<ScrapyClientService>(ScrapyClientService);

    console.log('🚀 Starting Scrapy Integration Verification');

    // Test 1: Website Analyzer
    console.log('\n🧪 Test 1: Website Analyzer Logic');
    const testUrls = [
        { url: 'https://example.com', expected: 'scrapy' },
        { url: 'https://twitter.com/user', expected: 'playwright' },
        { url: 'https://amazon.com/product', expected: 'heavy' },
        { url: 'https://google.com/search?q=test', expected: 'playwright' },
        { url: 'https://blog.example.com/post/1', expected: 'scrapy' },
    ];

    let analyzerPassed = true;
    for (const test of testUrls) {
        const result = await analyzer.analyze(test.url);
        const passed = result.recommendedEngine === test.expected;
        if (passed) {
            console.log(`✅ ${test.url} -> ${result.recommendedEngine} (Correct)`);
        } else {
            console.error(`❌ ${test.url} -> ${result.recommendedEngine} (Expected: ${test.expected})`);
            analyzerPassed = false;
        }
    }

    // Test 2: Scrapy Service Health
    console.log('\n🧪 Test 2: Scrapy Service Health Check');
    try {
        const isHealthy = await client.healthCheck();
        if (isHealthy) {
            console.log('✅ Scrapy Service is HEALTHY');
        } else {
            console.warn('⚠️ Scrapy Service is UNREACHABLE (Make sure docker container is running)');
        }
    } catch (e) {
        console.error(`❌ Health check failed: ${e.message}`);
    }

    console.log('\n🏁 Verification Complete');
}

runVerification();
