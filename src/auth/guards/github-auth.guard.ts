import { Injectable, ExecutionContext, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    if (request.path.includes('/callback')) {
      const { code, state, code_verifier } = request.query;
      if (!code) {
        throw new BadRequestException('Missing code');
      }
      if (!state) {
        throw new BadRequestException('Missing state');
      }
      
      const savedState = request.cookies ? request.cookies['oauth_state'] : null;
      if (!savedState || state !== savedState) {
        throw new BadRequestException('Invalid state');
      }

      // PKCE Validation
      const savedChallenge = request.cookies ? request.cookies['code_challenge'] : null;
      if (savedChallenge && code_verifier) {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(code_verifier).digest('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
          
        if (hash !== savedChallenge && code_verifier !== savedChallenge) {
          throw new BadRequestException('Invalid code_verifier');
        }
      } else if (savedChallenge && !code_verifier) {
        throw new BadRequestException('Missing code_verifier');
      }
    }
    
    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Explicitly check for state in query, otherwise generate one
    const state = request.query.state || Math.random().toString(36).substring(2, 15);
    const code_challenge = request.query.code_challenge;
    
    if (response && typeof response.cookie === 'function') {
      response.cookie('oauth_state', state, { httpOnly: true, maxAge: 5 * 60 * 1000, path: '/' });
      if (code_challenge) {
        response.cookie('code_challenge', code_challenge, { httpOnly: true, maxAge: 5 * 60 * 1000, path: '/' });
      }
    }
    
    const options: any = { state: state };
    if (code_challenge) {
       options.code_challenge = code_challenge;
       options.code_challenge_method = request.query.code_challenge_method || 'S256';
    }
    return options;
  }

  handleRequest(err, user, info, context) {
    const request = context.switchToHttp().getRequest();
    const { code, state } = request.query;

    if (!code) {
      throw new BadRequestException('Missing code');
    }
    if (!state) {
      throw new BadRequestException('Missing state');
    }

    if (err || !user) {
      throw err || new BadRequestException('Invalid code or state');
    }
    return user;
  }
}
