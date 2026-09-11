import { BadRequestException, Injectable } from '@nestjs/common';
import { PipelineStage } from 'mongoose';
import { SEARCH_CAPABILITIES } from 'src/common/constants/enums/enums';
import { IPagination } from 'src/common/constants/interfaces/interface';
import { getOperatorValue } from 'src/common/helpers/helper';
import { StripeService } from 'src/shared/stripe.service';
import { ROLES } from '../role/enums/role.enum';
import { RoleRepository } from '../role/role.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './entities/user.entity';
import { CREATED_BY, USER_NAME_OPTIONS, USER_STATUS } from './enums/user.enum';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly stripeService: StripeService,
  ) {}

  async getMe(user: IUser) {
    return user;
  }

  async updateMe(updateMeDto: UpdateMeDto, user: IUser): Promise<IUser> {
    return await this.userRepository.updateUser(
      user?._id as unknown as string,
      updateMeDto,
    );
  }

  async createUser(createUserDto: CreateUserDto): Promise<IUser> {
    const { email, password } = createUserDto;

    const foundUser = await this.userRepository.findByEmail(email);

    if (foundUser)
      throw new BadRequestException('User with this email already exist');

    const role = await this.roleRepository.findByRoleName(ROLES.USER);

    const [error, customer] = await this.stripeService.createStripeCustomer({
      name: createUserDto.firstName + ' ' + createUserDto.lastName,
      email,
    });

    if (error) throw new BadRequestException(error.message);

    const user = await this.userRepository.create({
      ...createUserDto,
      password,
      confirmPassword: password,
      status: USER_STATUS.ACTIVE,
      createdBy: CREATED_BY.ADMIN,
      role: role._id as unknown as any,
      customer: customer?.id as unknown as string,
    });

    return user;
  }

  async updateUser(updateUserDto: UpdateUserDto) {
    const { userId, ...rest } = updateUserDto;

    const foundUser = await this.userRepository.findById(userId);

    if (!foundUser) throw new BadRequestException('User not found');

    return await this.userRepository.updateUser(userId, rest);
  }

  /** Maps filter keys to Mongo paths on `users` (see {@link IUser}). */
  private createUserNameOption(key: USER_NAME_OPTIONS): string {
    const keyMap: Record<USER_NAME_OPTIONS, string> = {
      [USER_NAME_OPTIONS.NAME]: 'firstName',
      [USER_NAME_OPTIONS.PRICE]: 'phone',
      [USER_NAME_OPTIONS.CITY]: 'city',
      [USER_NAME_OPTIONS.STATE]: 'state',
      [USER_NAME_OPTIONS.STATUS]: 'status',
    };
    return keyMap[key];
  }

  async activaDeactiveUser(userId: string) {
    const foundUser = await this.userRepository.findById(userId);

    if (!foundUser) throw new BadRequestException('User not found');

    const newStatus =
      foundUser.status === USER_STATUS.ACTIVE
        ? USER_STATUS.INACTIVE
        : USER_STATUS.ACTIVE;

    return await this.userRepository.updateUser(userId, { status: newStatus });
  }

  async getAllUsers(
    query: IPagination,
    queryParams: {
      key: USER_NAME_OPTIONS;
      operator: SEARCH_CAPABILITIES;
      value: string;
      status: USER_STATUS;
      search: string;
    },
  ): Promise<{ users: IUser[]; totalCount: number }> {
    const { limit, skip } = query;
    const { key, operator, value, status, search } = queryParams;

    let whereQuery: Record<string, unknown> = {
      'role.name': { $ne: ROLES.SUPER_ADMIN },
      ...(status && { status }),
      ...(search && {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }),
    };

    if (key && operator && value) {
      const mongoOperator = getOperatorValue(operator);
      const mongoKey = this.createUserNameOption(key);
      const mongoValue = value;

      whereQuery = {
        ...whereQuery,
        [mongoKey]: {
          [mongoOperator]: mongoValue,
        },
      };
    }

    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role',
        },
      },
      {
        $unwind: {
          path: '$role',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: whereQuery,
      },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            ...(skip !== undefined || limit !== undefined
              ? [
                  ...(skip == undefined ? [] : [{ $skip: skip }]),
                  ...(limit == undefined ? [] : [{ $limit: limit }]),
                ]
              : []),
            {
              $project: {
                firstName: 1,
                lastName: 1,
                email: 1,
                company: 1,
                phone: 1,
                status: 1,
                state: 1,
                country: 1,
                photo: 1,
                city: 1,
                zip: 1,
                createdBy: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const result = await this.userRepository.getAllUsers(pipeline);

    return {
      users: result[0]?.data || [],
      totalCount: result[0]?.total[0]?.count || 0,
    };
  }
}
