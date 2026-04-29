import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendInvitationOptions {
  to: string;
  employeeName: string;
  inviteToken: string;
}

@Injectable()
export class MailService {
  constructor(
    @Inject('MAIL_TRANSPORT') private readonly transport: any,
    private readonly configService: ConfigService,
  ) {}

  async sendInvitation(options: SendInvitationOptions): Promise<void> {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const from = this.configService.getOrThrow<string>('SMTP_FROM');
    const link = `${frontendUrl}/set-password?token=${options.inviteToken}`;

    await this.transport.sendMail({
      from,
      to: options.to,
      subject: 'You have been invited to FoodReady',
      html: `
        <p>Hi ${options.employeeName},</p>
        <p>You have been invited to join FoodReady.</p>
        <p>Click the link below to set your password:</p>
        <a href="${link}">${link}</a>
      `,
    });
  }
}