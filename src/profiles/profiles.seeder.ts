import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v7 as uuidv7 } from 'uuid';
import { ProfilesService } from './profiles.service';

@Injectable()
export class ProfilesSeeder implements OnModuleInit {
  private readonly logger = new Logger(ProfilesSeeder.name);

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly profilesService: ProfilesService,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const count = await this.profileRepository.count();
    if (count > 0) {
      this.logger.log('Database already seeded.');
      return;
    }

    this.logger.log('Seeding database...');
    try {
      const seedFilePath = path.join(process.cwd(), 'profiles_seed.json');
      if (fs.existsSync(seedFilePath)) {
        const fileContent = fs.readFileSync(seedFilePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        if (data && Array.isArray(data.profiles)) {
          // Chunk to avoid overloading the DB
          const chunkSize = 100;
          for (let i = 0; i < data.profiles.length; i += chunkSize) {
             const chunk = data.profiles.slice(i, i + chunkSize).map((p: any) => ({
               ...p,
               id: uuidv7()
             }));
             const entities = this.profileRepository.create(chunk);
             await this.profileRepository.save(entities);
          }
          this.logger.log(`Successfully seeded ${data.profiles.length} profiles.`);
          
          // Refresh country map in service since data is now available
          await this.profilesService.refreshCountryMap();
        }
      } else {
        this.logger.warn('Seed file not found at ' + seedFilePath);
      }
    } catch (error) {
      this.logger.error('Error seeding database', error);
    }
  }
}
