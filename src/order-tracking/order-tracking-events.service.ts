import { OrderStatus } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export type OrderTrackingEventPayload = {
  status: OrderStatus;
  updatedAt: string;
}

@Injectable()
export class OrderTrackingEventsService {
  private readonly streams = new Map<string, Subject<OrderTrackingEventPayload>>();

  private getStream(trackingId: string): Subject<OrderTrackingEventPayload> {
    let stream = this.streams.get(trackingId);

    if (!stream) {
      stream = new Subject<OrderTrackingEventPayload>();
      this.streams.set(trackingId, stream);
    }

    return stream;
  }

  observe(trackingId: string): Observable<OrderTrackingEventPayload> {
    return this.getStream(trackingId).asObservable();
  }

  emit(trackingId: string, payload: OrderTrackingEventPayload): void {
    this.getStream(trackingId).next(payload);
  }

  complete(trackingId: string): void {
    const stream = this.streams.get(trackingId);

    if (!stream) {
      return;
    }

    stream.complete();
    this.streams.delete(trackingId);
  }
}