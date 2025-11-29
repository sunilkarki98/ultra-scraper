import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    plan?: string;

    @IsOptional()
    @IsEnum(['active', 'banned', 'suspended'])
    status?: string;
}
