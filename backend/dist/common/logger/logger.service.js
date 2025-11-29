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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const pino_1 = __importDefault(require("pino"));
let LoggerService = class LoggerService {
    logger;
    constructor(context) {
        this.logger = (0, pino_1.default)({
            level: process.env.LOG_LEVEL || 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
            base: { context },
        });
    }
    setContext(context) {
        this.logger = this.logger.child({ context });
    }
    log(message, context) {
        this.logger.info({ context }, typeof message === 'object' ? JSON.stringify(message) : message);
    }
    error(message, trace, context) {
        this.logger.error({ context, trace }, typeof message === 'object' ? JSON.stringify(message) : message);
    }
    warn(message, context) {
        this.logger.warn({ context }, typeof message === 'object' ? JSON.stringify(message) : message);
    }
    debug(message, context) {
        this.logger.debug({ context }, typeof message === 'object' ? JSON.stringify(message) : message);
    }
    verbose(message, context) {
        this.logger.trace({ context }, typeof message === 'object' ? JSON.stringify(message) : message);
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT }),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [String])
], LoggerService);
