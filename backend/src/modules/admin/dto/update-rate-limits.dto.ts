import { IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RateLimitTier {
    @IsNumber()
    points!: number;

    @IsNumber()
    duration!: number;
}

export class UpdateRateLimitsDto {
    @IsObject()
    @ValidateNested()
    @Type(() => RateLimitTier)
    free!: RateLimitTier;

    @IsObject()
    @ValidateNested()
    @Type(() => RateLimitTier)
    pro!: RateLimitTier;
}
