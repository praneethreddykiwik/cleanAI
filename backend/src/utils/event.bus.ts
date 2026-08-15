import { EventEmitter } from 'events';
import { logger } from '../config/logger';

class EventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(30);
  }

  /**
   * Publishes an operational lifecycle event
   */
  publish(event: string, payload: any): void {
    logger.info(`[Event Bus Publish] Event: ${event}, Payload: ${JSON.stringify(payload)}`);
    this.emitter.emit(event, payload);
  }

  /**
   * Subscribes to a lifecycle event
   */
  subscribe(event: string, handler: (payload: any) => void): void {
    this.emitter.on(event, handler);
  }

  /**
   * Unsubscribes from an event
   */
  unsubscribe(event: string, handler: (payload: any) => void): void {
    this.emitter.off(event, handler);
  }
}

export const eventBus = new EventBus();
export default eventBus;
