import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

const mockTransport = {
  sendMail: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    const config: Record<string, string> = {
      FRONTEND_URL: 'http://localhost:5173',
      SMTP_FROM: 'FoodReady <no-reply@foodready.app>',
    };
    return config[key];
  }),
};

describe('MailService', () => {
  let mailService: MailService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'MAIL_TRANSPORT',
          useValue: mockTransport,
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  describe('sendInvitation', () => {
    it('should call transport.sendMail exactly once', async () => {
      await mailService.sendInvitation({
        to: 'employee@example.com',
        employeeName: 'John Doe',
        inviteToken: 'abc123',
      });

      expect(mockTransport.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should send to the correct email address', async () => {
      await mailService.sendInvitation({
        to: 'employee@example.com',
        employeeName: 'John Doe',
        inviteToken: 'abc123',
      });

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'employee@example.com',
        }),
      );
    });

    it('should include the invite link with token in the email body', async () => {
      await mailService.sendInvitation({
        to: 'employee@example.com',
        employeeName: 'John Doe',
        inviteToken: 'abc123',
      });

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(
            'http://localhost:5173/set-password?token=abc123',
          ),
        }),
      );
    });

    it('should include the employee name in the email body', async () => {
      await mailService.sendInvitation({
        to: 'employee@example.com',
        employeeName: 'John Doe',
        inviteToken: 'abc123',
      });

      expect(mockTransport.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('John Doe'),
        }),
      );
    });
  });
});