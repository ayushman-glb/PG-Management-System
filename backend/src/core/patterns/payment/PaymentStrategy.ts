export interface PaymentPayload {
  amount: number;
  currency: string;
  payerId: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  provider: string;
  message: string;
  timestamp: Date;
}

export interface IPaymentStrategy {
  name: string;
  processPayment(payload: PaymentPayload): Promise<PaymentResult>;
}

export class UpiPaymentStrategy implements IPaymentStrategy {
  public readonly name = 'UPI';
  async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    const txnId = 'UPI_TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    return {
      success: true,
      transactionId: txnId,
      provider: 'UPI_GATEWAY',
      message: `UPI Payment of ₹${payload.amount} processed successfully`,
      timestamp: new Date()
    };
  }
}

export class CardPaymentStrategy implements IPaymentStrategy {
  public readonly name = 'CARD';
  async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    const txnId = 'CARD_TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    return {
      success: true,
      transactionId: txnId,
      provider: 'STRIPE_CARD',
      message: `Card Payment of ₹${payload.amount} charged successfully`,
      timestamp: new Date()
    };
  }
}

export class CashPaymentStrategy implements IPaymentStrategy {
  public readonly name = 'CASH';
  async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    const txnId = 'CASH_REC_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    return {
      success: true,
      transactionId: txnId,
      provider: 'PHYSICAL_CASH',
      message: `Cash Payment of ₹${payload.amount} logged by manager`,
      timestamp: new Date()
    };
  }
}

export class BankTransferStrategy implements IPaymentStrategy {
  public readonly name = 'BANK_TRANSFER';
  async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    const txnId = 'BANK_NEFT_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    return {
      success: true,
      transactionId: txnId,
      provider: 'NEFT_IMPS',
      message: `Bank Transfer of ₹${payload.amount} verified`,
      timestamp: new Date()
    };
  }
}

export class PaymentStrategyContext {
  private strategies: Map<string, IPaymentStrategy> = new Map();

  constructor() {
    this.registerStrategy(new UpiPaymentStrategy());
    this.registerStrategy(new CardPaymentStrategy());
    this.registerStrategy(new CashPaymentStrategy());
    this.registerStrategy(new BankTransferStrategy());
  }

  public registerStrategy(strategy: IPaymentStrategy): void {
    this.strategies.set(strategy.name.toUpperCase(), strategy);
  }

  public async executePayment(method: string, payload: PaymentPayload): Promise<PaymentResult> {
    const strategy = this.strategies.get(method.toUpperCase());
    if (!strategy) {
      throw new Error(`Unsupported payment method: ${method}`);
    }
    return strategy.processPayment(payload);
  }
}
