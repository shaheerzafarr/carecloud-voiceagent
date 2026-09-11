import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { ImageObject } from 'src/common/constants/interfaces/interface';
import { defaultImages } from 'src/common/helpers/data.helper';
import {
  createFileKey,
  objectOfUploadedFiles,
  sharpImagesFn,
} from 'src/common/helpers/uploads.helper';
import { ConfigService } from 'src/config/config.service';
import { Readable, Stream } from 'node:stream';
import { v4 } from 'uuid';
import { LogService } from './log.service';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LogService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async getFile(key: string): Promise<Stream> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.configService.get('AWS_BUCKET_NAME'),
        Key: key,
      });

      const { Body } = await this.s3.send(command);

      // Return the stream for the file
      if (!(Body instanceof Readable)) {
        throw new BadRequestException(
          'File not found or could not be retrieved.',
        );
      }

      return Body;
    } catch (error) {
      console.error('S3 getFile error:', {
        code: error.Code,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });

      // Handle specific access denied errors
      if (error.Code === 'AccessDenied') {
        if (error.message.includes('s3:ListBucket')) {
          throw new BadRequestException(
            'Access denied: Insufficient permissions to access S3 bucket. Please check your AWS credentials and permissions.',
          );
        } else {
          throw new BadRequestException(
            'Access denied: Insufficient permissions to access this file.',
          );
        }
      }

      // Handle other common S3 errors
      if (error.Code === 'NoSuchKey') {
        throw new BadRequestException('File not found in S3.');
      }

      if (error.Code === 'NoSuchBucket') {
        throw new BadRequestException('S3 bucket not found.');
      }

      // Re-throw other errors
      throw new BadRequestException(
        `Failed to retrieve file from S3: ${error.message}`,
      );
    }
  }

  async getSingedUrlForImageKey(key: string, Expires = 15004): Promise<string> {
    const command = await getSignedUrl(
      this.s3,
      new GetObjectCommand({
        Bucket: this.configService.get('AWS_BUCKET_NAME'),
        Key: key,
      }),
      { expiresIn: Expires },
    );

    return command;
  }

  async getUploadingSignedURL(
    data: { mimeType: string; name: string }[],
    Expires = 15004,
  ): Promise<{ url: string[]; keys: string[] }> {
    const promises: Promise<string>[] = [];
    const keys: string[] = [];
    const commands: string[] = [];

    for (const element of data) {
      const key = createFileKey(element.name);
      const command = await getSignedUrl(
        this.s3,
        new PutObjectCommand({
          Bucket: this.configService.get('AWS_BUCKET_NAME'),
          Key: key,
          ContentType: element.mimeType,
        }),
        { expiresIn: Expires },
      );
      promises.push(command as any);
      keys.push(key);
      commands.push(command);
    }

    await Promise.all(promises);
    return { url: commands, keys };
  }

  async deleteImage(fileKey: string): Promise<any> {
    if (defaultImages.includes(fileKey)) return;

    const command = await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.configService.get('AWS_BUCKET_NAME'),
        Key: fileKey,
      }),
    );

    return command;
  }

  async bulkDeleteImages(fileKeys: string[]): Promise<any> {
    if (fileKeys.length === 0) return;

    const allowedKeys = fileKeys.filter((key) => !defaultImages.includes(key));

    if (allowedKeys.length === 0) return;

    const command = await this.s3.send(
      new DeleteObjectsCommand({
        Bucket: this.configService.get('AWS_BUCKET_NAME'),
        Delete: {
          Objects: fileKeys.map((Key) => ({
            Key,
          })),
        },
      }),
    );

    return command;
  }

  async deleteFile(fileKey: string): Promise<any> {
    const command = await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.configService.get('AWS_BUCKET_NAME'),
        Key: fileKey,
      }),
    );

    return command;
  }

  async uploadPdf(body: Buffer): Promise<string> {
    const Key = `${v4()}.pdf`;

    await this.s3.send(
      new PutObjectCommand({
        Body: body,
        ContentType: 'application/pdf',
        Bucket: this.configService.get('AWS_BUCKET_NAME'),
        Key,
      }),
    );

    return Key;
  }

  async uploadZip(body: Buffer, key?: string): Promise<string> {
    const Key = key || `archives/${v4()}.zip`;

    await this.s3.send(
      new PutObjectCommand({
        Body: body,
        ContentType: 'application/zip',
        Bucket: this.configService.get('AWS_BUCKET_NAME'),
        Key,
      }),
    );

    return Key;
  }

  async getPDFFileStream(fileKey: string): Promise<any> {
    const downloadParams = {
      Key: fileKey,
      Bucket: this.configService.get('AWS_BUCKET_NAME'),
    };

    const command = await this.s3.send(new GetObjectCommand(downloadParams));

    return command;
  }

  async uploadFiles(files: Array<Express.Multer.File>): Promise<any> {
    if (!files || files.length === 0) return;
    const resolvedFiles: any[] = [];

    const finalObjectInfo: ImageObject[] = Object.entries(files).map((val) => ({
      name: val[0],
      length: val[1]['length'],
    }));

    const sharpImages = await sharpImagesFn(files);

    const unresolvedPromise = Object.values(files)
      .flat()
      .map(async (file: Express.Multer.File, i) => {
        let params: any = {
          Body: sharpImages[i],
          Bucket: this.configService.get('AWS_BUCKET_NAME'),
          Key: createFileKey(file?.originalname),
          ContentDisposition: 'inline',
          ContentType: file.mimetype,
        };

        resolvedFiles.push({
          key: params.Key,
          Bucket: this.configService.get('AWS_BUCKET_NAME'),
          originalname: file?.originalname,
          size: file?.size,
          mimetype: file?.mimetype,
          encoding: file?.encoding,
        });

        return await this.s3.send(new PutObjectCommand(params));
      });

    await Promise.all(unresolvedPromise);

    const result = objectOfUploadedFiles(finalObjectInfo as any, resolvedFiles);

    return result;
  }

  async getSize(file: Express.Multer.File) {
    const imageSize = await sharp(file?.buffer).metadata();

    return { width: imageSize.width, height: imageSize.height };
  }

  async getSizesOfImages(files: Array<string>): Promise<any> {
    const promises = files.map(async (file) => {
      const params = {
        Bucket: this.configService.get('AWS_BUCKET_NAME'),
        Key: file,
      };

      return await this.s3.send(new HeadObjectCommand(params));
    });

    return await Promise.all(promises);
  }
}
