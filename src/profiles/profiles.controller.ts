import { Controller, Get, Query, UseGuards, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { ProfilesService } from './profiles.service';
import { GetProfilesDto } from './dto/get-profiles.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';

@Controller({ path: 'profiles', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('search')
  @Roles(Role.ADMIN, Role.ANALYST)
  searchProfiles(@Query() query: SearchProfilesDto) {
    return this.profilesService.search(query);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ANALYST)
  getProfiles(@Query() query: GetProfilesDto) {
    return this.profilesService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ANALYST)
  getProfile(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Get('export')
  @Roles(Role.ADMIN)
  async exportProfiles(@Query() query: GetProfilesDto, @Res() res: Response) {
    try {
      const csv = await this.profilesService.exportToCsv(query);
      res.header('Content-Type', 'text/csv');
      res.attachment('profiles_export.csv');
      return res.send(csv);
    } catch (err) {
      if (err.message === 'No data to export') {
        return res.status(404).send(err.message);
      }
      return res.status(500).send('Error generating CSV');
    }
  }
}
