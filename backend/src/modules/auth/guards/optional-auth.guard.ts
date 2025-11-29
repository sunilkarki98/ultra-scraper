import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard(['jwt', 'api-key']) {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // If error or no user, just return null (no user attached)
        // instead of throwing exception
        return user || null;
    }
}
