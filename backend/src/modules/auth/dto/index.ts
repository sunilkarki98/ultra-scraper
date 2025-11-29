import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    @IsString()
    password!: string;
}

export class SignupDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'password123', description: 'User password', minLength: 6 })
    @IsString()
    @MinLength(6)
    password!: string;

    @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
    @IsOptional()
    @IsString()
    name?: string;
}
