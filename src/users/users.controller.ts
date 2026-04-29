import { Controller, Get, Req, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller({ path: 'users', version: ['1', VERSION_NEUTRAL] })
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('me')
  getMe(@Req() req) {
    return req.user;
  }
}
