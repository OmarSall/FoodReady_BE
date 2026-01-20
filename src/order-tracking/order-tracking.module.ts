import { OrderTrackingService } from './order-tracking.service';
import { Module } from '@nestjs/common';
import { OrderTrackingController } from './order-tracking.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [OrderTrackingController],
  providers: [OrderTrackingService, PrismaService],
})
export class OrderTrackingModule {}