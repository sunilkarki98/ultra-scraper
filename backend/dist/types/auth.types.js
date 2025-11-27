"use strict";
// FILE: src/types/auth.types.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_LIMITS = exports.UserStatus = exports.Plan = void 0;
var Plan;
(function (Plan) {
    Plan["FREE"] = "free";
    Plan["STARTER"] = "starter";
    Plan["PRO"] = "pro";
    Plan["ENTERPRISE"] = "enterprise";
})(Plan || (exports.Plan = Plan = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["DELETED"] = "deleted";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
exports.PLAN_LIMITS = {
    [Plan.FREE]: {
        quota: 100,
        rateLimit: 5,
        aiQuota: 10,
        priority: 10,
        features: ['basic_scraping']
    },
    [Plan.STARTER]: {
        quota: 1000,
        rateLimit: 10,
        aiQuota: 100,
        priority: 5,
        features: ['basic_scraping', 'webhooks', 'ai_extraction']
    },
    [Plan.PRO]: {
        quota: 10000,
        rateLimit: 50,
        aiQuota: 1000,
        priority: 2,
        features: ['basic_scraping', 'webhooks', 'ai_extraction', 'recursive_crawl', 'priority_support']
    },
    [Plan.ENTERPRISE]: {
        quota: Infinity,
        rateLimit: 200,
        aiQuota: Infinity,
        priority: 1,
        features: ['basic_scraping', 'webhooks', 'ai_extraction', 'recursive_crawl', 'priority_support', 'dedicated_resources', 'sla']
    }
};
