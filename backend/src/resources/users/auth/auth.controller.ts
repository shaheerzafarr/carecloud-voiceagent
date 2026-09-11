import {
  Body,
  Controller,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { seconds, Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { SYSTEM_COOKIES } from 'src/common/constants/enums/enums';
import { Auth, RefreshAuth } from 'src/common/decorators/auth.decorator';
import { ApiAuth } from 'src/common/decorators/swagger.decorator';
import { GetUser } from 'src/common/decorators/user.decorator';
import { IUser } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthFn } from './authFn';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResendOtpDto } from './dto/other.dto';
import { ResetPasswordUserDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateUserPasswordDto } from './dto/update-password.dto';
import { ValidateOtpDto } from './dto/validate-otp.dto';
import { ConfigService } from 'src/config/config.service';
import { formatDomain } from 'src/common/helpers/helper';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authFn: AuthFn,
    private readonly configService: ConfigService,
  ) {}

  @Post('/admin/login')
  @ApiAuth('Login Api for admin')
  @Throttle({ default: { limit: 4, ttl: seconds(30) } })
  async adminLogin(@Body() loginDto: LoginDto, @Res() res: Response) {
    const { accessToken, refreshToken, user } =
      await this.authService.adminLogin(loginDto);

    await this.authFn.setCookie(res, accessToken, refreshToken);

    return res.status(HttpStatus.OK).json({ data: user });
  }

  @Post('/user/login')
  @ApiAuth('Login Api for admin')
  @Throttle({ default: { limit: 4, ttl: seconds(30) } })
  async userLogin(@Body() loginDto: LoginDto, @Res() res: Response) {
    const data = await this.authService.userLogin(loginDto);

    if (data['message']) {
      return res.status(HttpStatus.OK).json({
        message: data['message'],
      });
    }

    await this.authFn.setCookie(
      res,
      data['accessToken'],
      data['refreshToken'],
      // this.configService.get('WEB_HOSTED_URL'),
    );

    return res.status(HttpStatus.OK).json({
      data: {
        user: data['user'],
        token: data['accessToken'],
      },
    });
  }

  @Post('/signup')
  @ApiAuth('Login Api for admin')
  @Throttle({ default: { limit: 4, ttl: seconds(30) } })
  async signup(@Body() signupDto: SignupDto) {
    const data = await this.authService.signup(signupDto);

    return { data };
  }

  @Post('/validate-email')
  @ApiAuth('Validate email')
  @Throttle({ default: { limit: 4, ttl: seconds(30) } })
  async validateEmail(@Body('email') email: string) {
    const data = await this.authService.validateEmail(email);

    return { data };
  }

  @Post('verify-email')
  @ApiAuth('Validate Api for reset-password and login')
  async verifyEmail(
    @Body() validateOtpDto: ValidateOtpDto,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.verifyEmail(validateOtpDto);
    await this.authFn.setCookie(
      res,
      accessToken,
      refreshToken,
      // formatDomain(this.configService.get('WEB_HOSTED_URL') as string),
    );

    return res.status(HttpStatus.OK).json({
      data: {
        user: user,
        token: accessToken,
      },
    });
  }

  @Post('validate-otp')
  @ApiAuth('Validate Api for reset-password and login')
  async validateOtp(@Body() validateOtpDto: ValidateOtpDto) {
    const data = await this.authService.validateOtp(validateOtpDto);

    return { data };
  }

  @ApiAuth('Forgot Password Api')
  @Post('forgotPassword')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(forgotPasswordDto);

    return { data };
  }

  @ApiAuth('Reset Password Api after generating OTP using forgot password Api')
  @Patch('resetPassword')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordUserDto) {
    const data = await this.authService.resetPassword(resetPasswordDto);

    return { data };
  }

  @ApiAuth(
    'Resend OTP code generated from forgot password Api before resetting password',
  )
  @Patch('resend-otp')
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    await this.authService.resendOtp(resendOtpDto);

    return { data: { message: 'OTP has been sent!' } };
  }

  @Patch('update-password')
  @Auth()
  @ApiAuth('Update Password')
  async updateMe(
    @Body() updateUserPasswordDto: UpdateUserPasswordDto,
    @GetUser() user: IUser,
  ) {
    const data = await this.authService.updatePassword(
      updateUserPasswordDto,
      user,
    );

    return { data };
  }

  @Post('refresh-token')
  @RefreshAuth()
  @ApiAuth('Refresh Token')
  async refreshToken(
    @Res() res: Response,
    @GetUser() user: IUser,
    @Req() req: Request,
  ) {
    const { accessToken } = await this.authService.newAccessToken(user);

    const previousDomain =
      req.cookies[SYSTEM_COOKIES.REFRESH_TOKEN]?.split('//')[1];

    await this.authFn.setCookie(
      res,
      accessToken,
      req.cookies[SYSTEM_COOKIES.REFRESH_TOKEN],
      // formatDomain(previousDomain as string),
    );

    return res.status(HttpStatus.OK).json({
      data: { message: 'Token refreshed successfully', token: accessToken },
    });
  }

  @Post('logout')
  @ApiAuth('Logout user and clear auth cookies')
  async logout(@Res() res: Response) {
    this.authFn.clearAuthCookies(res);

    return res.status(HttpStatus.OK).json({
      data: { message: 'Logged out successfully' },
    });
  }
}
