import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { EmployeeRole } from '@prisma/client';
import { InternalServerErrorException } from '@nestjs/common';

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

const deleteMock = jest.fn();

const mockPrismaService = {
  $transaction: jest.fn(),
  employee: {
    delete: deleteMock,
  },
};

const mockMailService = {
  sendInvitation: jest.fn(),
};

describe('EmployeesService', () => {
  let employeesService: EmployeesService;

  beforeEach(async () => {
    jest.clearAllMocks();

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
      mockMailService.sendInvitation.mockResolvedValue(undefined);

      await employeesService.createForCompany(1, {
        name: 'John Doe',
        email: 'john@example.com',
        position: EmployeeRole.EMPLOYEE,
      });

      expect(mockMailService.sendInvitation).toHaveBeenCalledWith({
        to: 'john@example.com',
        employeeName: 'John Doe',
        inviteToken: expect.any(String),
      });
    });

    it('should return created employee on success', async () => {
      mockMailService.sendInvitation.mockResolvedValue(undefined);

      const result = await employeesService.createForCompany(1, {
        name: 'John Doe',
        email: 'john@example.com',
        position: EmployeeRole.EMPLOYEE,
      });

      expect(result).toEqual(mockEmployee);
    });

    it('should delete employee and throw InternalServerErrorException if mail fails', async () => {
      mockMailService.sendInvitation.mockRejectedValue(
        new Error('SMTP connection failed'),
      );
      deleteMock.mockResolvedValue(undefined);

      await expect(
        employeesService.createForCompany(1, {
          name: 'John Doe',
          email: 'john@example.com',
          position: EmployeeRole.EMPLOYEE,
        }),
      ).rejects.toThrow(InternalServerErrorException);

      expect(deleteMock).toHaveBeenCalledWith({
        where: { id: mockEmployee.id },
      });
    });

    it('should not call delete if transaction fails', async () => {
      mockPrismaService.$transaction.mockRejectedValue(
        new Error('DB connection failed'),
      );

      await expect(
        employeesService.createForCompany(1, {
          name: 'John Doe',
          email: 'john@example.com',
          position: EmployeeRole.EMPLOYEE,
        }),
      ).rejects.toThrow('DB connection failed');

      expect(deleteMock).not.toHaveBeenCalled();
    });
  });
})