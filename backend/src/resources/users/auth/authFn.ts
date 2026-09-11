import { BadRequestException, Injectable } from '@nestjs/common';
import { Response, type CookieOptions } from 'express';
import { sign } from 'jsonwebtoken';
import * as moment from 'moment';
import { SYSTEM_COOKIES } from 'src/common/constants/enums/enums';
import { createCookieConfiguration } from 'src/common/helpers/helper';
import { ConfigService } from 'src/config/config.service';
import { IOtpCode } from '../user/entities/otp.entity';
import { IUser } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class AuthFn {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  signToken(id: string, expiresIn?: any): string {
    return sign({ id }, this.configService.get('JWT_SECRET'), {
      expiresIn: expiresIn || this.configService.get('JWT_EXPIRES_IN'),
    });
  }

  createSendToken(
    user: IUser,
    expiresIn?: string,
  ): { token: string; user: IUser } {
    const token = this.signToken(user?._id?.toString() as string, expiresIn);

    return { token, user };
  }

  async createAccessTokenAndRefreshToken(
    user: IUser,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.signToken(
      user?._id?.toString() as string,
      this.configService.get('JWT_EXPIRES_IN'),
    );
    const refreshToken = this.signToken(
      user?._id?.toString() as string,
      this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    );

    user.password = undefined as any;
    user.confirmPassword = undefined as any;

    return { accessToken, refreshToken };
  }

  async createUserOtp(
    user: IUser,
    resendCheck: boolean = false,
  ): Promise<{ code: any; expireAt: any }> {
    if (
      resendCheck &&
      user?.otpCode?.expireAt &&
      moment.utc().isBefore(user.otpCode.expireAt)
    )
      throw new BadRequestException('Reset code has already been sent!');

    const code = '000000';
    const expireAt = moment.utc().add(120, 'seconds').format() as any;

    const otpCode = { code, expireAt };

    await this.userRepository.updateUser(user._id.toString(), {
      otpCode: otpCode as unknown as IOtpCode,
    });

    return otpCode;
  }

  async validateOtp(user: IUser, code: string): Promise<[Error | null]> {
    if (!user?.otpCode?.code)
      return [new BadRequestException('Please generate reset code first!')];

    if (moment.utc().isAfter(user?.otpCode?.expireAt)) {
      await this.userRepository.updateUser(user._id.toString(), {
        otpCode: { code: null, expireAt: null } as unknown as IOtpCode,
      });
      return [
        new BadRequestException(
          'Reset Code has been expired. Please generate again.',
        ),
      ];
    }

    await this.userRepository.updateUser(user._id.toString(), {
      otpCode: {
        code: code.toString(),
        expireAt: moment.utc().add(400, 'seconds').format() as any,
      } as unknown as IOtpCode,
    });

    if (code.toString() !== user?.otpCode?.code.toString())
      return [new BadRequestException('Please provide valid reset code!')];

    return [null];
  }

  async setCookie(res: Response, accessToken: string, refreshToken: string) {
    const accessOpts = createCookieConfiguration({
      maxAge: 1000 * 60 * 60 * 24,
    }) as unknown as CookieOptions;
    const refreshOpts = createCookieConfiguration({
      maxAge: 1000 * 60 * 60 * 24 * 7,
    }) as unknown as CookieOptions;

    res.cookie(SYSTEM_COOKIES.ACCESS_TOKEN, accessToken, accessOpts);
    res.cookie(SYSTEM_COOKIES.REFRESH_TOKEN, refreshToken, refreshOpts);
  }

  clearAuthCookies(res: Response) {
    const clearOpts = createCookieConfiguration({
      maxAge: 0,
    }) as unknown as CookieOptions;

    res.clearCookie(SYSTEM_COOKIES.ACCESS_TOKEN, clearOpts);
    res.clearCookie(SYSTEM_COOKIES.REFRESH_TOKEN, clearOpts);
  }
}
