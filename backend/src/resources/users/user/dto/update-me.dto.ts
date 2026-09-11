import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMeDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  photo: string = 'default.png';

  @ApiProperty()
  @IsOptional()
  @IsString()
  address1: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  address2: string;
}
