import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsInRange } from 'src/common/validators/isInRange.validator';

export class UpdateUserPasswordDto {
  @ApiProperty({ description: 'New password', required: true })
  @IsNotEmpty()
  @IsString()
  @IsInRange(8, 30, {
    message: 'Password must be between 8 and 30 characters.',
  })
  newPassword: string;

  @ApiProperty({ description: 'New confirm password', required: true })
  @IsNotEmpty()
  @IsString()
  @IsInRange(8, 30, {
    message: 'Password must be between 8 and 30 characters.',
  })
  confirmPassword: string;

  @ApiProperty({ description: 'Existing current password', required: true })
  @IsNotEmpty()
  @IsString()
  @IsInRange(8, 30, {
    message: 'Password must be between 8 and 30 characters.',
  })
  currentPassword: string;
}
