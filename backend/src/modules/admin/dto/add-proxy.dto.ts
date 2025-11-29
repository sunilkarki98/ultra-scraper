import { IsUrl, IsNotEmpty } from 'class-validator';

export class AddProxyDto {
    @IsUrl({ protocols: ['http', 'https'] })
    @IsNotEmpty()
    url!: string;
}
