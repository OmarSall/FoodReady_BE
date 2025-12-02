import { OrdersService } from './orders.service';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { RequestWithUser } from '../authentication/request-with-user';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@UseGuards(JwtAuthenticationGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getOrders(@Req() request: RequestWithUser) {
    return this.ordersService.getOrdersForEmployee(request.user);
  }

  @Post()
  async createOrder(
    @Req() request: RequestWithUser,
    @Body() body: CreateOrderDto) {
    return this.ordersService.createOrderForEmployee(request.user, body);
  }

  @Patch(':id')
  async updateOrderStatus(
    @Req() request: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatusForEmployee(
      request.user,
      id,
      body,
    )
  }
}
