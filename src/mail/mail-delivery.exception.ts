export class MailDeliveryException extends Error {
  constructor() {
    super('Failed to deliver email');
    this.name = 'MailDeliveryException';
  }
}