export interface NotificationPayload {
  recipient: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface INotificationProvider {
  channel: string;
  send(payload: NotificationPayload): Promise<{ success: boolean; messageId: string }>;
}

export class EmailNotificationProvider implements INotificationProvider {
  public readonly channel = 'EMAIL';
  async send(payload: NotificationPayload): Promise<{ success: boolean; messageId: string }> {
    return {
      success: true,
      messageId: 'EMAIL_MSG_' + Date.now()
    };
  }
}

export class SmsNotificationProvider implements INotificationProvider {
  public readonly channel = 'SMS';
  async send(payload: NotificationPayload): Promise<{ success: boolean; messageId: string }> {
    return {
      success: true,
      messageId: 'SMS_MSG_' + Date.now()
    };
  }
}

export class PushNotificationProvider implements INotificationProvider {
  public readonly channel = 'PUSH';
  async send(payload: NotificationPayload): Promise<{ success: boolean; messageId: string }> {
    return {
      success: true,
      messageId: 'PUSH_MSG_' + Date.now()
    };
  }
}

export class WhatsAppNotificationProvider implements INotificationProvider {
  public readonly channel = 'WHATSAPP';
  async send(payload: NotificationPayload): Promise<{ success: boolean; messageId: string }> {
    return {
      success: true,
      messageId: 'WA_MSG_' + Date.now()
    };
  }
}

export class NotificationFactory {
  private static providers: Map<string, INotificationProvider> = new Map<string, INotificationProvider>([
    ['EMAIL', new EmailNotificationProvider()],
    ['SMS', new SmsNotificationProvider()],
    ['PUSH', new PushNotificationProvider()],
    ['WHATSAPP', new WhatsAppNotificationProvider()]
  ]);


  public static getProvider(channel: string): INotificationProvider {
    const provider = this.providers.get(channel.toUpperCase());
    if (!provider) {
      return this.providers.get('EMAIL')!;
    }
    return provider;
  }
}
