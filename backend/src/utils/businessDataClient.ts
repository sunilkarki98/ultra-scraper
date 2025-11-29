import axios from 'axios';
import { Logger } from '@nestjs/common';

const logger = new Logger('BusinessDataClient');

export class BusinessDataClient {
    private readonly serviceUrl: string;

    constructor(serviceUrl: string = 'http://localhost:8003') {
        this.serviceUrl = serviceUrl;
    }

    async search(query: string, location: string, source: 'osm' | 'google' = 'osm', apiKey?: string) {
        try {
            const response = await axios.post(`${this.serviceUrl}/search`, {
                query,
                location,
                source,
                api_key: apiKey
            });
            return response.data;
        } catch (error: any) {
            logger.error(`Business Data Client failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
