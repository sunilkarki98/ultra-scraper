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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const scraper_service_1 = require("./scraper.service");
const optional_auth_guard_1 = require("../auth/guards/optional-auth.guard");
const quota_guard_1 = require("../auth/guards/quota.guard");
const class_validator_1 = require("class-validator");
class ScrapeDto {
    url;
    options;
}
__decorate([
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], ScrapeDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ScrapeDto.prototype, "options", void 0);
let ScraperController = class ScraperController {
    scraperService;
    constructor(scraperService) {
        this.scraperService = scraperService;
    }
    async triggerScrape(dto, req) {
        try {
            const result = await this.scraperService.triggerScrape(dto.url, dto.options, req.user?.id);
            return { success: true, ...result };
        }
        catch (error) {
            if (error.message.startsWith('Forbidden')) {
                throw new common_1.ForbiddenException(error.message);
            }
            throw error;
        }
    }
    async getJobStatus(id) {
        const job = await this.scraperService.getJobStatus(id);
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        return {
            success: true,
            jobId: job.id,
            state: job.status,
            result: job.result,
            error: job.error,
            createdAt: job.createdAt,
        };
    }
    async getUserJobs(req, limit, offset) {
        const jobs = await this.scraperService.getUserJobs(req.user.id, limit ? parseInt(limit.toString()) : 20, offset ? parseInt(offset.toString()) : 0);
        return {
            success: true,
            jobs,
        };
    }
    async quickScrape(url, req, options) {
        if (!url) {
            throw new common_1.ForbiddenException('URL parameter is required');
        }
        try {
            const result = await this.scraperService.triggerScrape(url, options, req.user?.id);
            return { success: true, ...result };
        }
        catch (error) {
            if (error.message.startsWith('Forbidden')) {
                throw new common_1.ForbiddenException(error.message);
            }
            throw error;
        }
    }
};
exports.ScraperController = ScraperController;
__decorate([
    (0, common_1.Post)('trigger'),
    (0, common_1.UseGuards)(optional_auth_guard_1.OptionalAuthGuard, quota_guard_1.QuotaGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ScrapeDto, Object]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "triggerScrape", null);
__decorate([
    (0, common_1.Get)('job/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "getJobStatus", null);
__decorate([
    (0, common_1.Get)('jobs'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)(['jwt', 'api-key'])),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "getUserJobs", null);
__decorate([
    (0, common_1.Get)('quick'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)(['jwt', 'api-key'])),
    __param(0, (0, common_1.Query)('url')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "quickScrape", null);
exports.ScraperController = ScraperController = __decorate([
    (0, common_1.Controller)('scraper'),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService])
], ScraperController);
