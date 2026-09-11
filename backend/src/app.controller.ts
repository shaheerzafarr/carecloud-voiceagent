import { Controller, Get, Logger, Post, Req, Res } from '@nestjs/common';
import { Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Req() req: Request, @Res() res: any): any {
    return res.redirect('/dashboard');
  }

  /**
   * eBay OAuth redirect target — register as RuName / redirect URI, e.g.
   * https://&lt;ngrok&gt;/api/v1/ebay/callback
   */
  @Get('ebay/callback')
  ebayCallbackGet(@Req() req: Request) {
    return this.logEbayCallback(req);
  }

  @Post('ebay/callback')
  ebayCallbackPost(@Req() req: Request) {
    return this.logEbayCallback(req);
  }

  private logEbayCallback(req: Request) {
    const q = req.query as Record<string, string | string[]>;
    const code = q.code;
    const state = q.state;
    const error = q.error;
    const errorDescription = q['error_description'];

    this.logger.log('eBay callback received');
    this.logger.log(`method=${req.method} path=${req.path}`);
    this.logger.log(`fullUrl=${req.protocol}://${req.get('host')}${req.originalUrl}`);
    this.logger.log(`query=${JSON.stringify(q)}`);
    if (req.body && Object.keys(req.body).length > 0) {
      this.logger.log(`body=${JSON.stringify(req.body)}`);
    }

    if (code) {
      this.logger.log(`authorization code (code)=${typeof code === 'string' ? code : JSON.stringify(code)}`);
    }
    if (state) {
      this.logger.log(`state=${typeof state === 'string' ? state : JSON.stringify(state)}`);
    }
    if (error) {
      this.logger.warn(`error=${error} error_description=${errorDescription ?? ''}`);
    }

    return {
      ok: true,
      message: 'Callback logged — check server console for code / token / query details.',
      received: {
        code: code ?? null,
        state: state ?? null,
        error: error ?? null,
        error_description: errorDescription ?? null,
        queryKeys: Object.keys(q),
      },
    };
  }
}
