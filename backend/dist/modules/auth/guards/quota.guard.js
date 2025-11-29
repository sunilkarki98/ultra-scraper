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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotaGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const user_service_1 = require("../../user/user.service");
const auth_types_1 = require("../../../types/auth.types");
let QuotaGuard = class QuotaGuard {
    reflector;
    userService;
    constructor(reflector, userService) {
        this.reflector = reflector;
        this.userService = userService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return true;
        }
        const quotaType = this.reflector.get('quotaType', context.getHandler()) || 'page';
        const usageResult = await this.userService.getUsage(user.id);
        const usage = usageResult.usage;
        // Cast string plan to Plan enum, fallback to FREE if invalid
        const userPlan = user.plan;
        const limits = auth_types_1.PLAN_LIMITS[userPlan] || auth_types_1.PLAN_LIMITS[auth_types_1.Plan.FREE];
        if (quotaType === 'page' && usage.pagesScraped >= limits.quota) {
            throw new common_1.ForbiddenException('Monthly page scrape quota exceeded');
        }
        else if (quotaType === 'ai' && usage.aiExtractions >= limits.aiQuota) {
            throw new common_1.ForbiddenException('Monthly AI extraction quota exceeded');
        }
        return true;
    }
};
exports.QuotaGuard = QuotaGuard;
exports.QuotaGuard = QuotaGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        user_service_1.UserService])
], QuotaGuard);
