import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SYSTEM_COOKIES } from 'src/common/constants/enums/enums';
import { userValidationHandling } from 'src/common/helpers/helper';
import { ConfigService } from 'src/config/config.service';
import { IUser } from 'src/resources/users/user/entities/user.entity';
import { UserRepository } from 'src/resources/users/user/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          const token = request.cookies[SYSTEM_COOKIES.ACCESS_TOKEN];

          return token;
        },
      ]),
    });
  }

  async validate(payload: any): Promise<IUser> {
    const { id, iat } = payload;
    const user = await this.userRepository.findById(id);

    if (!user) throw new UnauthorizedException('User not found');

    const [err] = userValidationHandling(user, iat);

    if (err) throw err;

    user.passwordChangedAt = null as unknown as number;
    user.password = null as unknown as string;

    return user;
  }
}
