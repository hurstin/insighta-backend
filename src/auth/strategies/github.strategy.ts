import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Role } from '../../users/entities/user.entity';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID', 'placeholder-id'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET', 'placeholder-secret'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL', 'http://localhost:3000/api/v1/auth/github/callback'),
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const { id, username } = profile;
    
    let user = await this.usersService.findByGithubId(id);
    if (!user) {
      // By default, make them an ANALYST, but if it's the very first user or a specific username, they could be ADMIN.
      // For this task, we will just make everyone ANALYST by default unless specified.
      user = await this.usersService.create(id, username);
    }
    
    done(null, user);
  }
}
