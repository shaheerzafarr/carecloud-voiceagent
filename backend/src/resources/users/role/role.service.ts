import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { IRole } from './entities/role.entity';
import { RoleRepository } from './role.repository';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<IRole> {
    const { name, permissions, isDefault } = createRoleDto;
    const isRoleExists = await this.roleRepository.findByRoleName(name);

    if (isRoleExists) {
      throw new BadRequestException('Role already exists');
    }

    const role = await this.roleRepository.create({
      name,
      permissions,
      isDefault,
    });

    return role;
  }
}
