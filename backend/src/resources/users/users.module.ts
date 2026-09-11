import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthFn } from './auth/authFn';
import { JwtRefreshStrategy } from './auth/strategies/jwt.refresh';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { Role, RoleSchema } from './role/entities/role.entity';
import { RoleController } from './role/role.controller';
import { RoleRepository } from './role/role.repository';
import { RoleService } from './role/role.service';
import { User, UserSchema } from './user/entities/user.entity';
import { UserController } from './user/user.controller';
import { UserRepository } from './user/user.repository';
import { UserService } from './user/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [UserController, RoleController, AuthController],
  providers: [
    UserService,
    RoleService,
    RoleRepository,
    UserRepository,
    AuthFn,
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [UserRepository],
})
export class UsersModule {}
