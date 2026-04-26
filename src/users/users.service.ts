import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByGithubId(githubId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { githubId } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(githubId: string, username: string, role: Role = Role.ANALYST): Promise<User> {
    const user = this.userRepository.create({ githubId, username, role });
    return this.userRepository.save(user);
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(id, { refreshToken });
  }
}
