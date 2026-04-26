import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // Capture the source query parameter
    const source = request.query.source || 'web';
    
    // Pass it as the OAuth state parameter
    return {
      state: source,
    };
  }
}
