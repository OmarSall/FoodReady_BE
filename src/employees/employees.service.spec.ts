import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { EmployeeRole } from '@prisma/client';

const mockEmployee = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  position: EmployeeRole.EMPLOYEE,
  companyId: 1,
  passwordHash: null,
  inviteToken: 'generated-token-123',
  inviteTokenExpires: new Date(Date.now() + 1000 * 60 * 60),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCompany = {
  id: 1,
  name: 'Test Company',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  $transaction: jest.fn(),
};

const mockMailService = {
  sendInvitation: jest.fn(),
};

describe('EmployeesService', () => {
  let employeesService: EmployeesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    employeesService = module.get<EmployeesService>(EmployeesService);
  });

  describe('createForCompany', () => {
    it('should call mailService.sendInvitation with correct data after creating employee', async () => {
      mockPrismaService.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          company: {
            findUnique: jest.fn().mockResolvedValue(mockCompany),
          },
          employee: {
            create: jest.fn().mockResolvedValue(mockEmployee),
          },
        });
      });

      mockMailService.sendInvitation.mockResolvedValue(undefined);

      await employeesService.createForCompany(1, {
        name: 'John Doe',
        email: 'john@example.com',
        position: EmployeeRole.EMPLOYEE,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockMailService.sendInvitation).toHaveBeenCalledWith({
        to: 'john@example.com',
        employeeName: 'John Doe',
        inviteToken: expect.any(String),
      });
    });

    it('should still resolve if mailService.sendInvitation throws', async () => {
      mockPrismaService.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          company: {
            findUnique: jest.fn().mockResolvedValue(mockCompany),
          },
          employee: {
            create: jest.fn().mockResolvedValue(mockEmployee),
          },
        });
      });

      mockMailService.sendInvitation.mockRejectedValue(
        new Error('SMTP connection failed'),
      );

      await expect(
        employeesService.createForCompany(1, {
          name: 'John Doe',
          email: 'john@example.com',
          position: EmployeeRole.EMPLOYEE,
        }),
      ).resolves.not.toThrow();
    });
  });
});