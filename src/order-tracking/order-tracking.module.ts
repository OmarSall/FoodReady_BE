import { OrderTrackingService } from './order-tracking.service';
import { Module } from '@nestjs/common';
import { OrderTrackingController } from './order-tracking.controller';
import { OrderTrackingEventsService } from './order-tracking-events.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderTrackingController],
  providers: [OrderTrackingService, OrderTrackingEventsService],
  exports: [OrderTrackingEventsService],
})
export class OrderTrackingModule {
}