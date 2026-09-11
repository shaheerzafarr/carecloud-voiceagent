import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'The name of the role',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The permissions of the role',
    example: ['read', 'write', 'delete'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({
    description: 'Whether the role is default',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isDefault: boolean;
}
