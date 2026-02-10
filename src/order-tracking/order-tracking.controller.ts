import { Controller, Get, Param, Sse } from '@nestjs/common';
import { OrderTrackingService } from './order-tracking.service';
import { OrderTrackingEventPayload, OrderTrackingEventsService } from './order-tracking-events.service';
import { map, Observable } from 'rxjs';
import { ORDER_TRACKING_SSE_EVENT, type OrderTrackingSseEventName } from './order-tracking-events';

type SseEvent<T> = {
  data: T;
  event: OrderTrackingSseEventName;
  id?: string;
};

@Controller('order-tracking')
export class OrderTrackingController {
  constructor(
    private readonly orderTrackingService: OrderTrackingService,
    private readonly events: OrderTrackingEventsService,
  ) {}

  @Get(':trackingId')
  getStatus(@Param('trackingId') trackingId: string) {
    return this.orderTrackingService.getTrackingStatus(trackingId);
  }

  @Sse(":trackingId/stream")
  async stream(
    @Param('trackingId') trackingId: string
  ): Promise<Observable<SseEvent<OrderTrackingEventPayload>>> {
    await this.orderTrackingService.getTrackingStatus(trackingId);

    return this.events.observe(trackingId).pipe(
      map((payload) => ({
        event: ORDER_TRACKING_SSE_EVENT.ORDER_STATUS,
        data: payload,
      }))
    )
  }
}