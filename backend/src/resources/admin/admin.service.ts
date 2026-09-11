import { Injectable } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminRepository } from './admin.repository';
import { IAdmin } from './entities/admin.entity';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async create(createAdminDto: CreateAdminDto): Promise<IAdmin> {
    return await this.adminRepository.create(createAdminDto);
  }
}
