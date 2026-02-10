export const ORDER_TRACKING_SSE_EVENT = {
  ORDER_STATUS: 'order-status',
} as const;

export type OrderTrackingSseEventName =
  (typeof ORDER_TRACKING_SSE_EVENT)[keyof typeof ORDER_TRACKING_SSE_EVENT];
