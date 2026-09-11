import { Injectable } from '@nestjs/common';
import { renderFile } from 'ejs';
import { htmlToText } from 'html-to-text';
import * as nodemailer from 'nodemailer';
import { join } from 'node:path';
import { EmailSubject, EmailTemplate } from 'src/common/constants/enums/enums';
import {
  EmailPayload,
  EmailUser,
} from 'src/common/constants/interfaces/interface';
import { ConfigService } from 'src/config/config.service';
@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  private getSmtpPort(): number {
    const port = Number(this.configService.get('SMTP_PORT'));

    return Number.isNaN(port) ? 587 : port;
  }

  private getBooleanConfig(key: string): boolean {
    return this.configService.get(key).toLowerCase() === 'true';
  }

  newTransport() {
    const port = this.getSmtpPort();
    const useTls = this.getBooleanConfig('SMTP_USE_TLS');

    return nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port,
      secure: useTls && port === 465,
      requireTLS: useTls && port !== 465,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async send(
    user: EmailUser,
    template: EmailTemplate,
    subject?: string,
    payload?: EmailPayload,
  ) {
    const { email, firstName } = user;

    const _path: string =
      process.env.NODE_ENV === 'production'
        ? join(__dirname, '..', '..', 'views', 'email', `${template}.ejs`)
        : join(__dirname, '..', 'views', 'email', `${template}.ejs`);

    const html = await renderFile(_path, {
      firstName: firstName,
      payload,
      baseUrl: this.configService.get('API_HOSTED_URL'),
    });

    const mailOptions = {
      from: this.configService.get('SMTP_FROM_EMAIL'),
      to: email,
      subject,
      html: html,
      text: htmlToText(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendEmail(
    type: EmailTemplate,
    user: EmailUser,
    payload?: EmailPayload,
  ) {
    // Get the enum key from the template value
    const templateKey = Object.keys(EmailTemplate).find(
      (key) => EmailTemplate[key] === type,
    ) as keyof typeof EmailSubject;

    const subject = templateKey ? EmailSubject[templateKey] : 'Ad builder';

    await this.send(user, type, subject, payload);
  }
}
