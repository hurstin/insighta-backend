import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { GetProfilesDto } from './dto/get-profiles.dto';
import { SearchProfilesDto } from './dto/search-profiles.dto';
import { parse } from 'json2csv';

@Injectable()
export class ProfilesService implements OnModuleInit {
  private countryMap: Record<string, string> = {};

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async onModuleInit() {
    // We'll load the country map once seeding is done, but we can also load it dynamically if needed.
    await this.refreshCountryMap();
  }

  async refreshCountryMap() {
    try {
      const countries = await this.profileRepository
        .createQueryBuilder()
        .select(['country_name', 'country_id'])
        .distinct(true)
        .getRawMany();

      this.countryMap = {};
      for (const c of countries) {
        if (c.country_name && c.country_id) {
          this.countryMap[c.country_name.toLowerCase()] = c.country_id;
        }
      }
      
      // Add common fallbacks
      this.countryMap['dr congo'] = 'CD';
      this.countryMap['united states'] = 'US';
      this.countryMap['united kingdom'] = 'GB';
    } catch (e) {
      // Ignore if table doesn't exist yet
    }
  }

  async findAll(dto: GetProfilesDto) {
    const query = this.buildQuery(dto);
    return this.paginateAndExecute(query, dto.page || 1, dto.limit || 10, dto.sort_by, dto.order);
  }

  async search(dto: SearchProfilesDto) {
    // Ensure country map is loaded just in case it wasn't populated on init
    if (Object.keys(this.countryMap).length === 0) {
      await this.refreshCountryMap();
    }

    const filters = this.parseNaturalQuery(dto.q);
    if (Object.keys(filters).length === 0) {
      // Unable to interpret query
      throw new BadRequestException('Unable to interpret query');
    }

    const query = this.buildQuery(filters);
    return this.paginateAndExecute(query, dto.page || 1, dto.limit || 10);
  }

  private buildQuery(filters: Partial<GetProfilesDto>): SelectQueryBuilder<Profile> {
    const query = this.profileRepository.createQueryBuilder('profile');

    if (filters.gender) {
      query.andWhere('profile.gender = :gender', { gender: filters.gender });
    }
    
    if (filters.age_group) {
      query.andWhere('profile.age_group = :age_group', { age_group: filters.age_group });
    }
    
    if (filters.country_id) {
      query.andWhere('profile.country_id = :country_id', { country_id: filters.country_id });
    }

    if (filters.min_age !== undefined) {
      query.andWhere('profile.age >= :min_age', { min_age: filters.min_age });
    }

    if (filters.max_age !== undefined) {
      query.andWhere('profile.age <= :max_age', { max_age: filters.max_age });
    }

    if (filters.min_gender_probability !== undefined) {
      query.andWhere('profile.gender_probability >= :mgp', { mgp: filters.min_gender_probability });
    }

    if (filters.min_country_probability !== undefined) {
      query.andWhere('profile.country_probability >= :mcp', { mcp: filters.min_country_probability });
    }

    return query;
  }

  private async paginateAndExecute(
    query: SelectQueryBuilder<Profile>, 
    page: number, 
    limit: number,
    sortBy?: string,
    order?: string
  ) {
    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // Sorting
    if (sortBy) {
      const orderDir = order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query.orderBy(`profile.${sortBy}`, orderDir);
    }

    const [data, total] = await query.getManyAndCount();

    return {
      status: 'success',
      page: Number(page),
      limit: Number(limit),
      total,
      data,
    };
  }

  private parseNaturalQuery(q: string): Partial<GetProfilesDto> {
    const filters: Partial<GetProfilesDto> = {};
    const lowerQ = q.toLowerCase();

    // 1. Gender
    const hasMale = lowerQ.includes('male') && !lowerQ.includes('female');
    const hasFemale = lowerQ.includes('female') && !lowerQ.match(/\bmale\b/) && !lowerQ.includes('males') || (lowerQ.includes('female') && !lowerQ.includes('and male'));
    
    // Explicit regex to catch "male" and "female" without overlapping
    const hasMaleExact = /\bmales?\b/.test(lowerQ);
    const hasFemaleExact = /\bfemales?\b/.test(lowerQ);

    if (hasMaleExact && hasFemaleExact) {
      // both present, ignore gender filter as per "male and female teenagers"
    } else if (hasFemaleExact) {
      filters.gender = 'female';
    } else if (hasMaleExact) {
      filters.gender = 'male';
    }

    // 2. Age groups
    if (/\bchild(ren)?\b/.test(lowerQ)) filters.age_group = 'child';
    if (/\bteen(ager)?s?\b/.test(lowerQ)) filters.age_group = 'teenager';
    if (/\badults?\b/.test(lowerQ)) filters.age_group = 'adult';
    if (/\bseniors?\b/.test(lowerQ)) filters.age_group = 'senior';

    // 3. "Young" -> min 16, max 24
    if (/\byoung\b/.test(lowerQ)) {
      filters.min_age = 16;
      filters.max_age = 24;
    }

    // 4. Country extraction: "from {country}"
    const fromMatch = lowerQ.match(/from\s+([a-z\s]+)/);
    if (fromMatch) {
      const countryStr = fromMatch[1].trim();
      // Try to find exact match in our country map
      for (const [cName, cId] of Object.entries(this.countryMap)) {
        if (countryStr.includes(cName)) {
          filters.country_id = cId;
          break;
        }
      }
    }

    // 5. Age comparisons "above/over X", "under/below X"
    const aboveMatch = lowerQ.match(/(above|over)\s+(\d+)/);
    if (aboveMatch) {
      filters.min_age = parseInt(aboveMatch[2], 10);
    }
    
    const underMatch = lowerQ.match(/(under|below)\s+(\d+)/);
    if (underMatch) {
      filters.max_age = parseInt(underMatch[2], 10);
    }

    return filters;
  }

  async exportToCsv(dto: GetProfilesDto): Promise<string> {
    const exportQuery = { ...dto, limit: 10000, page: 1 };
    const result = await this.findAll(exportQuery);
    
    if (!result.data || result.data.length === 0) {
      throw new BadRequestException('No data to export');
    }

    try {
      return parse(result.data);
    } catch (err) {
      throw new Error('Error generating CSV');
    }
  }
}
