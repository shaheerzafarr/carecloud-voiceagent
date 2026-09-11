import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Support request' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: 'I would like to know more about your services.' })
  @IsNotEmpty()
  @IsString()
  message: string;
}
