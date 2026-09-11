import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ROLES } from 'src/resources/users/role/enums/role.enum';
import { RolesGuard } from '../guards/role.guard';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

export function Auth(
  roles: string[] = Object.values(ROLES),
  permissions: string[] = [],
) {
  return applyDecorators(
    Roles(...roles),
    Permissions(...permissions),
    ApiBearerAuth(),
    UseGuards(AuthGuard('jwt'), RolesGuard),
  );
}

export function RefreshAuth() {
  return applyDecorators(ApiBearerAuth(), UseGuards(AuthGuard('jwt-refresh')));
}
