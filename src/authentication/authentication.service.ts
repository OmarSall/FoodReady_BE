import { ConfigService } from '@nestjs/config';
import { EmployeesService } from '../employees/employees.service';
import { JwtService } from '@nestjs/jwt';
import { Employee } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WrongCredentialsException } from './wrong-credentials.exception';
import * as bcrypt from 'bcrypt';
import { LogInDto } from './dto/log-in.dto';
import { TokenPayload } from './token-payload.interface';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  private async getEmployeeByEmail(email: string): Promise<Employee> {
    try {
      return await this.employeesService.findByEmail(email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new WrongCredentialsException();
      }
      throw error;
    }
  }

  private async verifyPassword(
    plainTextPassword: string,
    passwordHash: string,
  ): Promise<void> {
    const isPasswordMatching = await bcrypt.compare(
      plainTextPassword,
      passwordHash,
    );

    if (!isPasswordMatching) {
      throw new WrongCredentialsException();
    }
  }

  private isInviteTokenValid(employee: Employee | null, now: Date): boolean {
    return Boolean(
      employee &&
        employee.inviteTokenExpires &&
        employee.inviteTokenExpires > now,
    );
  }

  private assertValidInviteEmployee(
    employee: Employee | null,
    now: Date,
  ): asserts employee is Employee {
    if (!this.isInviteTokenValid(employee, now)) {
      throw new BadRequestException('Invalid or expired invite token');
    }
  }

  async setPasswordForInviteToken(
    token: string,
    newPassword: string,
  ): Promise<Employee> {
    const now = new Date();
    const employee = await this.prismaService.employee.findUnique({
      where: {
        inviteToken: token,
      },
    });

    this.assertValidInviteEmployee(employee, now);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.prismaService.employee.update({
      where: {
        id: employee.id,
      },
      data: {
        passwordHash,
        inviteToken: null,
        inviteTokenExpires: null,
      },
    });
  }

  async getAuthenticatedEmployee(logInData: LogInDto): Promise<Employee> {
    const employee = await this.getEmployeeByEmail(logInData.email);
    if (!employee.passwordHash) {
      throw new ForbiddenException('User must set password first');
    }
    await this.verifyPassword(logInData.password, employee.passwordHash);
    return employee;
  }

  getCookieWithJwtToken(employeeId: number): string {
    const payload: TokenPayload = { employeeId };
    const token = this.jwtService.sign(payload);
    const maxAge = this.configService.get<number>('JWT_EXPIRATION_TIME');

    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${maxAge}`;
  }

  getCookieForLogOut(): string {
    return 'Authentication=; HttpOnly; Path=/; Max-Age=0';
  }
}
