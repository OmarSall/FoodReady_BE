import { Controller, Get, Param } from '@nestjs/common';
import { OrderTrackingService } from './order-tracking.service';

@Controller('order-tracking')
export class OrderTrackingController {
  constructor(private orderTrackingService: OrderTrackingService) {}

  @Get(':trackingId')
  getStatus(@Param('trackingId') trackingId: string) {
    return this.orderTrackingService.getTrackingStatus(trackingId);
  }
}