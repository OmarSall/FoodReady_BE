import { ConfigService } from '@nestjs/config';
import { EmployeesService } from '../employees/employees.service';
import { JwtService } from '@nestjs/jwt';
import { Employee } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { WrongCredentialsException } from './wrong-credentials.exception';
import * as bcrypt from 'bcrypt';
import { LogInDto } from './dto/log-in.dto';
import { TokenPayload } from './token-payload.interface';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async getEmployeeByEmail(email: string): Promise<Employee> {
    try {
      return await this.employeesService.findByEmail(email)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new WrongCredentialsException()
      }
      throw error;
    }
  }

  private async verifyPassword(
    plainTextPassword: string,
    passwordHash: string,
  ) : Promise<void> {
    const isPasswordMatching = await bcrypt.compare(
      plainTextPassword,
      passwordHash
    );

    if (!isPasswordMatching) {
      throw new WrongCredentialsException();
    }
  }

  async getAuthenticatedEmployee(logInData: LogInDto): Promise<Employee> {
    const employee = await this.getEmployeeByEmail(logInData.email);
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
    return 'Authentication=; HttpOnly; Path=/; Max-Age=0'
  }
}