"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessDataClient = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('BusinessDataClient');
class BusinessDataClient {
    serviceUrl;
    constructor(serviceUrl = 'http://localhost:8003') {
        this.serviceUrl = serviceUrl;
    }
    async search(query, location, source = 'osm', apiKey) {
        try {
            const response = await axios_1.default.post(`${this.serviceUrl}/search`, {
                query,
                location,
                source,
                api_key: apiKey
            });
            return response.data;
        }
        catch (error) {
            logger.error(`Business Data Client failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
exports.BusinessDataClient = BusinessDataClient;
