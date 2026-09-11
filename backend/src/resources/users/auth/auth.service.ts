import { BadRequestException, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { StripeService } from 'src/shared/stripe.service';
import { ROLES } from '../role/enums/role.enum';
import { RoleRepository } from '../role/role.repository';
import { IOtpCode } from '../user/entities/otp.entity';
import { IUser } from '../user/entities/user.entity';
import { CREATED_BY, USER_STATUS } from '../user/enums/user.enum';
import { UserRepository } from '../user/user.repository';
import { AuthFn } from './authFn';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResendOtpDto } from './dto/other.dto';
import { ResetPasswordUserDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateUserPasswordDto } from './dto/update-password.dto';
import { ValidateOtpDto } from './dto/validate-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly authFn: AuthFn,
    private readonly stripeService: StripeService,
  ) {}

  async adminLogin(
    adminLoginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: IUser }> {
    const { email, password } = adminLoginDto;

    const user = await this.userRepository.findByEmail(email, '+password');

    if (!user || !(await user.correctPassword(password, user?.password)))
      throw new BadRequestException('Incorrect email or password.');

    if (user.role.name !== ROLES.SUPER_ADMIN)
      throw new BadRequestException('Access Denied');

    const { accessToken, refreshToken } =
      await this.authFn.createAccessTokenAndRefreshToken(user);

    return { accessToken, refreshToken, user };
  }

  async validateEmail(email: string) {
    if (!email) throw new BadRequestException('Please provide email');

    const user = await this.userRepository.findByEmail(email);

    if (!user) return false;

    return true;
  }

  async userLogin(
    adminLoginDto: LoginDto,
  ): Promise<
    | { accessToken: string; refreshToken: string; user: IUser }
    | { message: string }
  > {
    const { email, password } = adminLoginDto;

    const user = await this.userRepository.findByEmailAndPhone(
      email,
      '+password',
    );

    if (!user || !(await user.correctPassword(password, user?.password)))
      throw new BadRequestException('Incorrect email or password.');

    if (user.role.name !== ROLES.USER)
      throw new BadRequestException('Access Denied');

    if (user.status === USER_STATUS.EMAIL_VERIFICATION_PENDING) {
      await this.authFn.createUserOtp(user);
      return { message: 'Email verification otp has been send successfully' };
    }

    const { accessToken, refreshToken } =
      await this.authFn.createAccessTokenAndRefreshToken(user);

    return { accessToken, refreshToken, user };
  }

  async signup(signupDto: SignupDto): Promise<{ message: string }> {
    const { email } = signupDto;

    const foundUser = await this.userRepository.findByEmail(email);

    if (foundUser)
      throw new BadRequestException('User with this email already exist');

    const role = await this.roleRepository.findByRoleName(ROLES.USER);

    const [error, customer] = await this.stripeService.createStripeCustomer({
      name: signupDto.firstName + ' ' + signupDto.lastName,
      email,
    });

    if (error) throw new BadRequestException(error.message);

    const user = await this.userRepository.create({
      ...signupDto,
      status: USER_STATUS.EMAIL_VERIFICATION_PENDING,
      createdBy: CREATED_BY.USER,
      role: role._id as unknown as any,
      customer: customer?.id as unknown as string,
      address1: signupDto?.address1,
      address2: signupDto?.address2,
    });

    await this.authFn.createUserOtp(user);

    return { message: 'User created successfully' };
  }

  async validateOtp(
    validateOtpDto: ValidateOtpDto,
  ): Promise<{ message: string }> {
    const { email, code } = validateOtpDto;

    const user = await this.userRepository.findByEmail(email, '+otpCode');

    if (!user) throw new BadRequestException('Invalid email (or) reset code.');

    const [err] = await this.authFn.validateOtp(user, code);

    if (err) throw err;

    return { message: 'OTP has been verified!' };
  }

  async verifyEmail(
    validateOtpDto: ValidateOtpDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: IUser }> {
    const { email, code, type } = validateOtpDto;

    const user = await this.userRepository.findByEmailorPhone(
      type,
      email,
      '+otpCode',
    );

    if (!user)
      throw new BadRequestException(`Invalid ${type} (or) reset code.`);

    const [err] = await this.authFn.validateOtp(user, code);

    if (err) throw err;

    const updatedUser = await this.userRepository.updateUser(user._id as any, {
      status: USER_STATUS.ACTIVE,
    });
    const { accessToken, refreshToken } =
      await this.authFn.createAccessTokenAndRefreshToken(updatedUser);

    return { accessToken, refreshToken, user };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<any> {
    const { email, type } = forgotPasswordDto;

    if (!email) throw new BadRequestException('Email address is invalid.');

    // 1) Get user based on POSTed email
    const user = await this.userRepository.findByEmailorPhone(
      type,
      email,
      '+otpCode',
    );

    if (!user)
      throw new BadRequestException(`There is no user with ${type} address.`);

    if (user?.status != USER_STATUS.ACTIVE)
      throw new BadRequestException('Please contact admin for support.');

    // if (user?.otpCode?.expireAt && moment.utc().isBefore(user.otpCode.expireAt))
    //   throw new BadRequestException('Reset code has already been sent!');

    const { code } = await this.authFn.createUserOtp(user);

    // await this.emailService.sendEmail(
    //   EmailTemplate.FORGOT_PASSWORD,
    //   { email, name: user?.name },
    //   { code },
    // );

    return {
      status: 'success',
      message: 'Reset code has been sent to ' + type + '!',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordUserDto,
  ): Promise<{ message: string }> {
    const { email, code, password, confirmPassword, type } = resetPasswordDto;

    const user = await this.userRepository.findByEmailorPhone(
      type,
      email,
      '+otpCode',
    );

    if (!user)
      throw new BadRequestException(`Invalid ${type} (or) reset code.`);

    if (user?.status != USER_STATUS.ACTIVE)
      throw new BadRequestException('Please contact admin for support.');

    if (moment.utc().isAfter(user?.otpCode?.expireAt)) {
      await this.userRepository.updateUser(user._id.toString(), {
        otpCode: { code: null, expireAt: null } as unknown as IOtpCode,
      });
      throw new BadRequestException(
        'Reset Code has been expired. Please generate again.',
      );
    }

    if (code.toString() !== user?.otpCode?.code.toString())
      throw new BadRequestException('You have entered wrong Reset Code.');

    user.password = password;
    user.confirmPassword = confirmPassword;
    user.otpCode.code = null as unknown as string;
    user.otpCode.expireAt = null as unknown as Date;

    await user.save();

    return { message: 'password reset successfully' };
  }

  async updatePassword(
    updateUserPasswordDto: UpdateUserPasswordDto,
    _user: IUser,
  ): Promise<{ message: string }> {
    const { newPassword, confirmPassword, currentPassword } =
      updateUserPasswordDto;

    const user = await this.userRepository.findByEmail(
      _user.email,
      '+password',
    );

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(currentPassword, user.password)))
      throw new BadRequestException('Your current password is wrong.');

    // 3) If so, update password
    user.password = newPassword;
    user.confirmPassword = confirmPassword;
    await user.save();

    // await this.emailService.sendEmail(EmailTemplate.RESET_PASSWORD, {
    //   email: user.email,
    //   name: user?.name,
    // });

    return { message: 'password updated successfully ' };
  }
  async resendOtp(resendOtpDto: ResendOtpDto): Promise<{ message: string }> {
    const { email, type } = resendOtpDto;

    const user = await this.userRepository.findByEmailorPhone(type, email);

    if (!user)
      throw new BadRequestException(`User not found with ${type} address.`);

    if (user?.otpCode?.expireAt && moment.utc().isBefore(user.otpCode.expireAt))
      throw new BadRequestException('Reset code has already been sent!');

    const { code } = await this.authFn.createUserOtp(user, true);

    // await this.emailService.sendEmail(
    //   EmailTemplate.SEND_OTP,
    //   { email, name: user?.name },
    //   { code: code },
    // );

    return { message: `Reset code has been sent to ${type}!` };
  }

  async newAccessToken(user: IUser): Promise<{ accessToken: string }> {
    const { accessToken } =
      await this.authFn.createAccessTokenAndRefreshToken(user);

    return { accessToken };
  }
}
