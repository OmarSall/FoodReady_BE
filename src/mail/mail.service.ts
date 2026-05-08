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
  ) {
  }

  async sendInvitation(options: SendInvitationOptions): Promise<void> {
    const from = this.configService.getOrThrow<string>('SMTP_FROM');
    const link = this.buildInvitationLink(options.inviteToken);

    await this.transport.sendMail({
      from,
      to: options.to,
      subject: 'You have been invited to FoodReady',
      html: this.buildInvitationEmailHtml(options.employeeName, link),
      text: this.buildInvitationEmailText(options.employeeName, link),
    });
  }

  private buildInvitationLink(inviteToken: string): string {
    const frontendUrl =
      this.configService.getOrThrow<string>('FRONTEND_URL')
        .split(',')[0]
        .trim();
    return `${frontendUrl}/set-password?token=${inviteToken}`;
  }

  private buildInvitationEmailHtml(
    employeeName: string,
    link: string,
  ): string {
    return `
      <p>Hi ${employeeName},</p>
      <p>You have been invited to join FoodReady.</p>
      <p>Click the link below to set your password:</p>
      <a href="${link}">${link}</a>
      <p>This link will expire in 1 hour.</p>
    `;
  }

  private buildInvitationEmailText(
    employeeName: string,
    link: string,
  ): string {
    return [
      `Hi ${employeeName},`,
      `You have been invited to join FoodReady.`,
      `Set your password here: ${link}`,
      `This link will expire in 1 hour.`,
    ].join('\n\n');
  }
}