export interface IDomainEvent {
  eventName: string;
  occurredOn: Date;
  payload: any;
}

export type DomainEventHandler = (event: IDomainEvent) => Promise<void> | void;

export class EventDispatcher {
  private static instance: EventDispatcher;
  private handlers: Map<string, DomainEventHandler[]> = new Map();

  private constructor() {}

  public static getInstance(): EventDispatcher {
    if (!EventDispatcher.instance) {
      EventDispatcher.instance = new EventDispatcher();
    }
    return EventDispatcher.instance;
  }

  public subscribe(eventName: string, handler: DomainEventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);
  }

  public async dispatch(event: IDomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventName) || [];
    for (const handler of eventHandlers) {
      try {
        await handler(event);
      } catch (err) {
        console.error(`Error executing event handler for ${event.eventName}:`, err);
      }
    }
  }
}
