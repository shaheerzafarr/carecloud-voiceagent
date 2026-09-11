import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [SharedModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
