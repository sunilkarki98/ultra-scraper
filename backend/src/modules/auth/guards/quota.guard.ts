import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../../user/user.service';
import { PLAN_LIMITS, Plan } from '../../../types/auth.types';

@Injectable()
export class QuotaGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private userService: UserService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return true;
        }

        const quotaType = this.reflector.get<string>('quotaType', context.getHandler()) || 'page';

        const usageResult = await this.userService.getUsage(user.id);
        const usage = usageResult.usage;

        // Cast string plan to Plan enum, fallback to FREE if invalid
        const userPlan = user.plan as Plan;
        const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS[Plan.FREE];

        if (quotaType === 'page' && usage.pagesScraped >= limits.quota) {
            throw new ForbiddenException('Monthly page scrape quota exceeded');
        } else if (quotaType === 'ai' && usage.aiExtractions >= limits.aiQuota) {
            throw new ForbiddenException('Monthly AI extraction quota exceeded');
        }

        return true;
    }
}
