import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateLLMKeysDto {
    @IsOptional()
    @IsString()
    openaiKey?: string;

    @IsOptional()
    @IsString()
    anthropicKey?: string;

    @IsOptional()
    @IsString()
    geminiKey?: string;
}

export class CreateWebhookDto {
    @IsUrl()
    url!: string;

    @IsOptional()
    @IsString()
    secret?: string;

    @IsOptional()
    events?: string[];
}

export class UpdateWebhookDto {
    @IsOptional()
    @IsUrl()
    url?: string;

    @IsOptional()
    @IsString()
    secret?: string;

    @IsOptional()
    events?: string[];
}
