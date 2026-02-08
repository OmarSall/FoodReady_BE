import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Employee } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { randomUUID } from 'crypto';
import { OrderTrackingEventsService } from '../order-tracking/order-tracking-events.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly orderTrackingEventsService: OrderTrackingEventsService,
  ) {
  }

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

    const order = await this.prismaService.order.findFirst({
      where: {
        id: orderId,
        companyId: employee.companyId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found for this employee.');
    }

    const updated = await this.prismaService.order.update({
      where: { id: orderId },
      data: { status: updateOrderData.status },
    })

    this.orderTrackingEventsService.emit(updated.trackingId, {
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });

    if (updated.status === 'COMPLETED' || updated.status === 'CANCELLED') {
      this.orderTrackingEventsService.complete(updated.trackingId);
    }

    return updated;
  }
}
