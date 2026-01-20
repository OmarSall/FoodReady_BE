import { PrismaService } from '../database/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class OrderTrackingService {
  constructor(private readonly prismaService: PrismaService) {}

  async getTrackingStatus(trackingId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { trackingId },
      select: {
        status: true,
        updatedAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Invalid or expired tracking link');
    }

    return {
      status: order.status,
      updatedAt: order.updatedAt.toISOString(),
    }
  }
}