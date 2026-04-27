import { Controller, Get, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Initiates the GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res: Response) {
    const tokens = await this.authService.generateTokens(req.user);
    
    // Set HTTP-only cookie for access token
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProduction, // Must be true for SameSite=None
      sameSite: isProduction ? 'none' : 'lax', // Must be 'none' for cross-site in production
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    // Redirect to frontend dashboard (default to localhost:5173 for dev)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/dashboard`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req) {
    return req.user;
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token');
    return res.status(200).json({ message: 'Logged out' });
  }

  @Post('github/cli-exchange')
  async cliExchange(
    @Body('code') code: string,
    @Body('code_verifier') codeVerifier: string,
    @Body('redirect_uri') redirectUri: string,
  ) {
    if (!code) {
      throw new Error('Code is required');
    }
    return this.authService.exchangeCliCode(code, codeVerifier, redirectUri);
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }
}
