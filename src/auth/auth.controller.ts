import { Controller, Get, Post, Body, Req, Res, UseGuards, Query, BadRequestException, All, MethodNotAllowedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('github')
  @UseGuards(GithubAuthGuard)
  async githubLogin() {
    // Initiates the GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req, @Res() res: Response, @Query('state') state: string) {
    const tokens = await this.authService.generateTokens(req.user);
    
    // Logic based on state (source)
    if (state === 'cli') {
      const redirectUrl = `http://localhost:8080/callback?token=${tokens.access_token}`;
      return res.redirect(redirectUrl);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json(tokens);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/dashboard?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() res: Response) {
    res.clearCookie('access_token');
    return res.status(200).json({ message: 'Logged out' });
  }

  @All('logout')
  logoutMethodNotAllowed() {
    throw new MethodNotAllowedException('Method Not Allowed');
  }

  @Post('github/cli-exchange')
  async cliExchange(
    @Body('code') code: string,
    @Body('code_verifier') codeVerifier: string,
    @Body('redirect_uri') redirectUri: string,
  ) {
    if (!code) {
      throw new BadRequestException('Code is required');
    }
    return this.authService.exchangeCliCode(code, codeVerifier, redirectUri);
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshTokens(refreshToken);
  }

  @All('refresh')
  refreshMethodNotAllowed() {
    throw new MethodNotAllowedException('Method Not Allowed');
  }
}
