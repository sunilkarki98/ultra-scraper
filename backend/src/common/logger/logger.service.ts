import { Injectable, LoggerService as NestLoggerService, Scope, Optional } from '@nestjs/common';
import pino from 'pino';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
    private logger: pino.Logger;

    constructor(@Optional() context?: string) {
        this.logger = pino({
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

    setContext(context: string) {
        this.logger = this.logger.child({ context });
    }

    log(message: any, context?: string) {
        this.logger.info({ context }, typeof message === 'object' ? JSON.stringify(message) : message);
    }

    error(message: any, trace?: string, context?: string) {
        this.logger.error({ context, trace }, typeof message === 'object' ? JSON.stringify(message) : message);
    }

    warn(message: any, context?: string) {
        this.logger.warn({ context }, typeof message === 'object' ? JSON.stringify(message) : message);
    }

    debug(message: any, context?: string) {
        this.logger.debug({ context }, typeof message === 'object' ? JSON.stringify(message) : message);
    }

    verbose(message: any, context?: string) {
        this.logger.trace({ context }, typeof message === 'object' ? JSON.stringify(message) : message);
    }
}
