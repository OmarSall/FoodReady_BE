import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'MAIL_TRANSPORT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return nodemailer.createTransport({
          host: configService.getOrThrow<string>('SMTP_HOST'),
          port: configService.getOrThrow<number>('SMTP_PORT'),
          auth: {
            user: configService.getOrThrow<string>('SMTP_USER'),
            pass: configService.getOrThrow<string>('SMTP_PASSWORD'),
          },
        });
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}