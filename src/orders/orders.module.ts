import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderTrackingModule } from '../order-tracking/order-tracking.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, OrderTrackingModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
