import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Employee } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOrdersForEmployee(employee: Employee) {
    return this.prismaService.order.findMany({
      where: {
        companyId: employee.companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createOrderForEmployee(employee: Employee, dto: CreateOrderDto) {
    return this.prismaService.order.create({
      data: {
        title: dto.title,
        description: dto.description,
        companyId: employee.companyId,
        createdByEmployeeId: employee.id,
        // Used by customer-facing OrderTrackingPage via QR/link
        trackingId: randomUUID(),
      },
    });
  }

  async updateOrderStatusForEmployee(
    employee: Employee,
    orderId: number,
    updateOrderData: UpdateOrderStatusDto,
  ) {
    const orderResult = await this.prismaService.order.updateMany({
      where: {
        id: orderId,
        companyId: employee.companyId,
      },
      data: {
        status: updateOrderData.status,
      },
    });

    if (orderResult.count === 0) {
      throw new NotFoundException('Order not found for this employee.');
    }

    const order = await this.prismaService.order.findFirst({
      where: {
        id: orderId,
        companyId: employee.companyId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found for this employee.');
    }

    return order;
  }
}
