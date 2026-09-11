import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SEARCH_CAPABILITIES } from 'src/common/constants/enums/enums';
import { IPagination } from 'src/common/constants/interfaces/interface';
import { Auth } from 'src/common/decorators/auth.decorator';
import { Pagination } from 'src/common/decorators/pagination.decorator';
import { ApiAuth } from 'src/common/decorators/swagger.decorator';
import { GetUser } from 'src/common/decorators/user.decorator';
import { ROLES } from '../role/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './entities/user.entity';
import { USER_NAME_OPTIONS, USER_STATUS } from './enums/user.enum';
import { UserService } from './user.service';

@SkipThrottle()
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @Auth([ROLES.SUPER_ADMIN])
  @ApiAuth('Create user from admin')
  async createUser(@Body() createUserDto: CreateUserDto) {
    const data = await this.userService.createUser(createUserDto);

    return { data };
  }

  @Get('me')
  @Auth()
  @ApiAuth('Get me api')
  async adminLogin(@GetUser() user: IUser) {
    const data = await this.userService.getMe(user);

    return { data };
  }

  @Get()
  @Auth([ROLES.SUPER_ADMIN])
  async getAllDomains(
    @Pagination() query: IPagination,
    @Query()
    queryParams: {
      key: USER_NAME_OPTIONS;
      operator: SEARCH_CAPABILITIES;
      value: string;
      status: USER_STATUS;
      search: string;
    },
  ) {
    const data = await this.userService.getAllUsers(query, queryParams);

    return { data };
  }

  @Patch('update-me')
  @Auth()
  @ApiAuth('Get me api')
  async updateMe(@Body() updateMeDto: UpdateMeDto, @GetUser() user: IUser) {
    const data = await this.userService.updateMe(updateMeDto, user);

    return { data };
  }

  @Patch('update-user')
  @Auth([ROLES.SUPER_ADMIN])
  @ApiAuth('Update user')
  async updateUser(@Body() updateUserDto: UpdateUserDto) {
    const data = await this.userService.updateUser(updateUserDto);

    return { data };
  }

  @Patch('active-inactive/:userId')
  @Auth([ROLES.SUPER_ADMIN])
  @ApiAuth('Active inactive user')
  async activaDeactiveUser(@Param('userId') userId: string) {
    const data = await this.userService.activaDeactiveUser(userId);

    return { data };
  }
}
