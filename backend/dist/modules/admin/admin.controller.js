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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const admin_guard_1 = require("../auth/guards/admin.guard");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getProxies() {
        return this.adminService.getProxies();
    }
    async addProxy(url) {
        return this.adminService.addProxy(url);
    }
    async removeProxy(url) {
        return this.adminService.removeProxy(decodeURIComponent(url));
    }
    async getRateLimits() {
        return this.adminService.getRateLimits();
    }
    async updateRateLimits(config) {
        return this.adminService.updateRateLimits(config);
    }
    async getLLMConfigs() {
        return this.adminService.getLLMConfigs();
    }
    async addLLMConfig(data) {
        return this.adminService.addLLMConfig(data);
    }
    async updateLLMConfig(id, data) {
        return this.adminService.updateLLMConfig({ id, ...data });
    }
    async deleteLLMConfig(id) {
        return this.adminService.deleteLLMConfig(id);
    }
    async getUsers(page, limit) {
        return this.adminService.getUsers(page || 1, limit || 20);
    }
    async updateUser(id, data) {
        return this.adminService.updateUser(id, data);
    }
    async getQueueStats() {
        return this.adminService.getQueueStats();
    }
    async getJobsByStatus(status) {
        return this.adminService.getJobsByStatus(status);
    }
    async retryJob(id) {
        return this.adminService.retryJob(id);
    }
    async cleanQueue(status) {
        return this.adminService.cleanQueue(status);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('proxies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProxies", null);
__decorate([
    (0, common_1.Post)('proxies'),
    __param(0, (0, common_1.Body)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addProxy", null);
__decorate([
    (0, common_1.Delete)('proxies/:url'),
    __param(0, (0, common_1.Param)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "removeProxy", null);
__decorate([
    (0, common_1.Get)('rate-limits'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRateLimits", null);
__decorate([
    (0, common_1.Put)('rate-limits'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateRateLimits", null);
__decorate([
    (0, common_1.Get)('llm-configs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getLLMConfigs", null);
__decorate([
    (0, common_1.Post)('llm-configs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addLLMConfig", null);
__decorate([
    (0, common_1.Put)('llm-configs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateLLMConfig", null);
__decorate([
    (0, common_1.Delete)('llm-configs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteLLMConfig", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)('queues/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getQueueStats", null);
__decorate([
    (0, common_1.Get)('queues/jobs/:status'),
    __param(0, (0, common_1.Param)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getJobsByStatus", null);
__decorate([
    (0, common_1.Post)('queues/jobs/:id/retry'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "retryJob", null);
__decorate([
    (0, common_1.Delete)('queues/jobs/:status'),
    __param(0, (0, common_1.Param)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "cleanQueue", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('api-key'), admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
