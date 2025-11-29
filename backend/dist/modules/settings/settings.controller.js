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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const settings_service_1 = require("./settings.service");
const dto_1 = require("./dto");
let SettingsController = class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getLLMKeys(req) {
        return this.settingsService.getLLMKeys(req.user.id);
    }
    async updateLLMKeys(req, dto) {
        return this.settingsService.updateLLMKeys(req.user.id, dto);
    }
    async getWebhooks(req) {
        return this.settingsService.getWebhooks(req.user.id);
    }
    async createWebhook(req, dto) {
        return this.settingsService.createWebhook(req.user.id, dto);
    }
    async updateWebhook(req, id, dto) {
        return this.settingsService.updateWebhook(req.user.id, id, dto);
    }
    async deleteWebhook(req, id) {
        return this.settingsService.deleteWebhook(req.user.id, id);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)('llm-keys'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getLLMKeys", null);
__decorate([
    (0, common_1.Put)('llm-keys'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.UpdateLLMKeysDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateLLMKeys", null);
__decorate([
    (0, common_1.Get)('webhooks'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getWebhooks", null);
__decorate([
    (0, common_1.Post)('webhooks'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateWebhookDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "createWebhook", null);
__decorate([
    (0, common_1.Put)('webhooks/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateWebhookDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateWebhook", null);
__decorate([
    (0, common_1.Delete)('webhooks/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "deleteWebhook", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)(['jwt', 'api-key'])),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
