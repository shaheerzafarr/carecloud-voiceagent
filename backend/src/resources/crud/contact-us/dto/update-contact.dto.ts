import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CONTACT_STATUS } from '../enums/contact-status.enum';

export class UpdateContactDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contactId: string;

  @ApiProperty({ enum: CONTACT_STATUS, example: CONTACT_STATUS.IN_PROGRESS })
  @IsNotEmpty()
  @IsEnum(CONTACT_STATUS)
  status: CONTACT_STATUS;
}
