import { Global, Module } from '@nestjs/common';
import { LogService } from './log.service';

@Global()
@Module({
  imports: [],
  providers: [LogService],
  exports: [LogService],
})
export class SharedModule {}
