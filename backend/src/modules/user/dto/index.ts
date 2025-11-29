import { IsString, IsOptional } from 'class-validator';

export class CreateApiKeyDto {
    @IsOptional()
    @IsString()
    name?: string;
}
