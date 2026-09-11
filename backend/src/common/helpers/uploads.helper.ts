import { BadRequestException } from '@nestjs/common';
import { ImageObject } from '../constants/interfaces/interface';
import { uploadingType } from './data.helper';
import * as sharp from 'sharp';
import { createSlug, randomKey } from './helper';
import { v4 } from 'uuid';

export const objectOfUploadedFiles = (
  finalObjectInfo: ImageObject[][],
  resolvedPromise: ImageObject[],
) => {
  const obj: Record<string, ImageObject[]> = {};
  let counter = 0;

  for (const files of finalObjectInfo) {
    for (const file of files) {
      const key = file.name;

      if (!obj[key]) obj[key] = [];
      obj[key].push(resolvedPromise[counter]);
      counter++;
    }
  }

  return obj;
};

// THIS FUNCTION IS USED TO VALIDATE FILE TYPE
export const imageFileFilter = (req: any, file: any, cb: any) => {
  const isUploadingTypeValid = uploadingType.includes(file.mimetype);

  if (isUploadingTypeValid) {
    cb(null, true);
  } else {
    req.fileValidationError = 'only image and pdf files are allowed';
    return cb(
      new BadRequestException('only image and pdf files are allowed'),
      false,
    );
  }
};

// THIS FUNCTION IS USED TO MANAGE ATTACHMENTS
export const manageAttachments = (
  oldAttach: string[],
  newAttach: string[],
): { attachments: string[]; removedAttachments: string[] } => {
  const removedAttachments = oldAttach.filter((el) => !newAttach.includes(el));

  const attachments = [...new Set([...oldAttach, ...newAttach])].filter(
    (el) => !removedAttachments.includes(el),
  );

  return { attachments, removedAttachments };
};

// THIS FUNCTION IS USER FOR SHARP IMAGES
export const sharpImagesFn = async (
  files: Express.Multer.File[],
  quality = 80,
) => {
  const unresolvedPromiseOfSharp = Object.values(files)
    .flat()
    .map(async (file: Express.Multer.File) => {
      const fileType = file.mimetype?.split('/')[1];
      let _sharp;
      if (file.mimetype.startsWith('image')) {
        if (fileType == 'jpeg' || fileType == 'jpg')
          _sharp = await sharp(file?.buffer)
            .resize()
            .toFormat('jpeg')
            .jpeg({ quality })
            .toBuffer();
        else if (fileType == 'gif')
          _sharp = await sharp(file?.buffer)
            .resize()
            .toFormat('gif')
            .gif()
            .toBuffer();
        else if (fileType == 'webp')
          _sharp = await sharp(file?.buffer)
            .resize()
            .toFormat('webp')
            .webp({ quality })
            .toBuffer();
        else
          _sharp = await sharp(file?.buffer)
            .resize()
            .toFormat('png')
            .png({ quality })
            .toBuffer();
      } else {
        _sharp = file?.buffer;
      }
      return _sharp;
    });
  const sharpImages = await Promise.all(unresolvedPromiseOfSharp);

  return sharpImages;
};

// THIS FUNCTION IS USED TO CREATE FILENAME
export const createFileKey = (fileName: string): string => {
  console.log(fileName, 'fileName');
  // also replace all spaces with -
  const name =
    fileName?.split('.')?.slice(0, -1)?.join('.')?.replaceAll(' ', '-') || v4();
  const ext = fileName?.split('.')?.pop() || 'jpg';
  const key = `${name}-${randomKey()}.${ext}`;
  return key;
};
