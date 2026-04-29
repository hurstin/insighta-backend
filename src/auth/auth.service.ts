import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User, Role } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateTokens(user: User) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' })
    ]);

    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.usersService.findById(payload.sub);
      
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async exchangeCliCode(code: string, codeVerifier: string, redirectUri: string) {
    // 1. Exchange the GitHub code for a GitHub Access Token
    const clientId = this.configService.get('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get('GITHUB_CLIENT_SECRET');
    
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new BadRequestException(`GitHub exchange failed: ${tokenData.error_description || tokenData.error}`);
    }

    // 2. Fetch User Profile from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Insighta-Backend'
      }
    });

    const profile = await userResponse.json();

    if (!profile || !profile.id) {
      throw new BadRequestException('Failed to fetch user profile from GitHub');
    }

    // 3. Find or Create User
    let user = await this.usersService.findByGithubId(profile.id.toString());
    if (!user) {
      const email = profile.email || '';
      const login = profile.login || '';
      const role = (login.toLowerCase().includes('admin') || email.toLowerCase().includes('admin')) 
        ? Role.ADMIN 
        : Role.ANALYST;
      user = await this.usersService.create(profile.id.toString(), login, role);
    }

    // 4. Generate our own JWTs
    return this.generateTokens(user);
  }
}
