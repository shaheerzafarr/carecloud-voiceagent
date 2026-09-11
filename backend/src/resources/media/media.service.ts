import { Injectable } from '@nestjs/common';
import { S3Service } from 'src/shared/s3.service';
import { CreateSignedUrl } from './dto/create-media.dto';
import { IUploadingUrl, IUploads } from './interfaces/media.interface';

@Injectable()
export class MediaService {
  constructor(private readonly s3Storage: S3Service) {}

  async uploadFile(files: Express.Multer.File[]): Promise<{ data: IUploads }> {
    const uploads = await this.s3Storage.uploadFiles(files);

    const images = uploads?.images?.map((image) => image?.key) || undefined;

    const documents =
      uploads?.documents?.map((document) => document?.key) || undefined;

    return { data: { images, documents } };
  }

  async uploadingUrl(
    createSignedUrl: CreateSignedUrl,
  ): Promise<{ data: IUploadingUrl }> {
    const { files } = createSignedUrl;

    const { keys, url } = await this.s3Storage.getUploadingSignedURL(files);

    return { data: { urls: url, keys } };
  }
}
