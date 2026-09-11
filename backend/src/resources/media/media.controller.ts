import { Body, Controller, Post, UploadedFiles } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/decorators/swagger.decorator';
import { UploadDecorator } from 'src/common/decorators/upload.decorator';
import { CreateSignedUrl } from './dto/create-media.dto';
import { MediaService } from './media.service';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('/upload')
  @ApiAuth('Upload Api')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload images, videos and documents',
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        documents: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UploadDecorator([
    { name: 'images', maxCount: 10 },
    { name: 'documents', maxCount: 10 },
  ])
  async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {
    return this.mediaService.uploadFile(files);
  }

  @ApiAuth('Upload Api')
  @Post('/upload-url')
  async uploadingUrl(@Body() createSignedUrl: CreateSignedUrl) {
    return this.mediaService.uploadingUrl(createSignedUrl);
  }
}
