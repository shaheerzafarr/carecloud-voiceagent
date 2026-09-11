import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsInRange } from 'src/common/validators/isInRange.validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'boiler-plate_admin@yopmail.com',
    required: true,
    type: String,
  })
  @IsNotEmpty({ message: 'Please provide Email.' })
  @IsString()
  @IsInRange(2, 50, { message: 'Email must be between 2 and 50 characters.' })
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: '12345678',
    required: true,
    minLength: 8,
    maxLength: 30,
    type: String,
  })
  @IsOptional({ message: 'Please provide Password.' })
  @IsString()
  @IsInRange(8, 30, {
    message: 'Password must be between 8 and 30 characters.',
  })
  password: string;
}
