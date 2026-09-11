import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../helpers/uploads.helper';
import { FileSize } from '../constants/enums/enums';
import { AllowedKeys } from '../constants/interfaces/interface';

export function UploadDecorator(
  allowedKeys: AllowedKeys[],
  fileSize: FileSize = FileSize.TEN_MB,
) {
  return applyDecorators(
    UseInterceptors(
      FileFieldsInterceptor(allowedKeys, {
        fileFilter: imageFileFilter,
        limits: { fileSize },
      }),
    ),
  );
}
