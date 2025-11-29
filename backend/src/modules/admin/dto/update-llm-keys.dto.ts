export interface LLMConfiguration {
    id: string;
    provider: 'openai' | 'anthropic' | 'google';
    model: string;
    apiKey: string;
    createdAt: number;
}

export class AddLLMConfigDto {
    provider?: 'openai' | 'anthropic' | 'google';
    model?: string;
    apiKey?: string;
}

export class UpdateLLMConfigDto {
    id?: string;
    provider?: 'openai' | 'anthropic' | 'google';
    model?: string;
    apiKey?: string;
}

export class DeleteLLMConfigDto {
    id?: string;
}
