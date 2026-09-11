import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class SignedUrlObj {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  mimeType: string;
}

export class CreateSignedUrl {
  @ApiProperty({ type: [SignedUrlObj] })
  @IsNotEmpty()
  @Type(() => SignedUrlObj)
  @ValidateNested({ each: true })
  files: SignedUrlObj[];
}
