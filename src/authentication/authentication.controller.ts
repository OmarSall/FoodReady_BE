import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LogInDto } from './dto/log-in.dto';
import type { Response } from 'express';
import { JwtAuthenticationGuard } from './jwt-authentication.guard';
import type { RequestWithUser } from './request-with-user';
import { TransformPlainToInstance } from 'class-transformer';
import { AuthenticationResponseDto } from './dto/authentication-response.dto';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
  ) {
  }

  @HttpCode(200)
  @Post('log-in')
  @TransformPlainToInstance(AuthenticationResponseDto)
  async logIn(
    @Body() logInData: LogInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthenticationResponseDto> {
    const employee =
      await this.authenticationService.getAuthenticatedEmployee(logInData);

    const cookie = this.authenticationService.getCookieWithJwtToken(employee.id);
    response.setHeader('Set-Cookie', cookie);

    return employee;
  }

  @HttpCode(200)
  @Post('log-out')
  async logOut(@Res({ passthrough: true }) response: Response) {
    const cookie = this.authenticationService.getCookieForLogOut();
    response.setHeader('Set-Cookie', cookie);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get()
  @TransformPlainToInstance(AuthenticationResponseDto)
  async authenticate(
    @Req() request: RequestWithUser
  ):Promise<AuthenticationResponseDto>  {
    return request.user;
  }
}