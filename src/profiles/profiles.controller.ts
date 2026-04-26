import { Controller, Get, Query } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { GetProfilesDto } from './dto/get-profiles.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';

@Controller('api/profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('search')
  searchProfiles(@Query() query: SearchProfilesDto) {
    return this.profilesService.search(query);
  }

  @Get()
  getProfiles(@Query() query: GetProfilesDto) {
    return this.profilesService.findAll(query);
  }
}
