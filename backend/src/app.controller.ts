import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request } from 'express';

@Controller()
export class AppController {
  @Get()
  getRoot(@Req() req: Request, @Res() res: any): any {
    return res.redirect('/dashboard');
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'CareCloud Voice AI Agent API',
      timestamp: new Date().toISOString(),
    };
  }
}
