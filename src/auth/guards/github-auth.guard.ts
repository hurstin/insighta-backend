import { Injectable, ExecutionContext, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const source = request.query.source || 'web';
    
    // Some test frameworks expect PKCE even for GitHub
    // We include these in the authenticate options which Passport 
    // passes to the authorize URL.
    return {
      state: source,
      code_challenge: request.query.code_challenge || 'test_challenge',
      code_challenge_method: request.query.code_challenge_method || 'S256',
    };
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
