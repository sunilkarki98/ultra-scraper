import { Controller, Get, Post, Body, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto, SignupDto } from './dto';
import { UserService } from '../user/user.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private userService: UserService,
    ) { }

    @Post('signup')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async signup(@Body() dto: SignupDto) {
        const user = await this.userService.createUser(dto.email, dto.password, dto.name);
        const token = this.jwtService.sign({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return { success: true, token, user };
    }

    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() dto: LoginDto) {
        const user = await this.userService.getUserByEmail(dto.email);
        if (!user || !(await this.userService.validatePassword(user, dto.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.jwtService.sign({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        return { success: true, token, user };
    }

    // Google OAuth
    @Get('google')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Initiate Google OAuth' })
    async googleAuth() {
        // Initiates Google OAuth flow
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth Callback' })
    async googleAuthCallback(@Req() req: any, @Res() res: Response) {
        const user = req.user;

        // Generate JWT token
        const token = this.jwtService.sign({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
        res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    }

    // GitHub OAuth
    @Get('github')
    @UseGuards(AuthGuard('github'))
    @ApiOperation({ summary: 'Initiate GitHub OAuth' })
    async githubAuth() {
        // Initiates GitHub OAuth flow
    }

    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    @ApiOperation({ summary: 'GitHub OAuth Callback' })
    async githubAuthCallback(@Req() req: any, @Res() res: Response) {
        const user = req.user;

        // Generate JWT token
        const token = this.jwtService.sign({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
        res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    }
}
