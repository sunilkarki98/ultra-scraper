import { GoogleScraper } from './src/scrapers/googleScraper';
import { logger } from './src/utils/logger';
import * as fs from 'fs';

async function testGoogleScraper() {
    const scraper = new GoogleScraper();
    const url = 'https://www.google.com/search?q=plumbers+in+new+york';

    console.log(`Starting test scrape for: ${url}`);

    try {
        const result = await scraper.run({ url });

        // Save HTML for inspection
        if ((scraper as any).page) {
            const html = await (scraper as any).page.content();
            fs.writeFileSync('debug-google.html', html);
            console.log('✅ Saved HTML to debug-google.html');
        }

        console.log('---------------------------------------------------');
        console.log('✅ Scrape Successful!');
        console.log('Title:', result.data?.title);
        console.log('Content preview:', result.data?.content?.substring(0, 200));
        console.log('Total Links:', result.data?.links?.length || 0);
        console.log('Organic Results:', result.data?.links.filter(l => !l.text.includes('[BUSINESS]')).length);
        console.log('Local Businesses:', result.data?.links.filter(l => l.text.includes('[BUSINESS]')).length);

        if (result.data?.leads?.phones?.length) {
            console.log('Phones Found:', result.data.leads.phones);
        }

        console.log('---------------------------------------------------');
    } catch (error) {
        console.error('❌ Scrape Failed:', error);
    }
}

testGoogleScraper();
