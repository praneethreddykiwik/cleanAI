export interface PaymentProvider {
  createOrder(
    receiptId: string,
    amount: number
  ): Promise<{ orderId: string; rawResponse: any }>;

  verifySignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean>;

  refund(
    gatewayPaymentId: string,
    amount: number,
    reason?: string
  ): Promise<{ refundId: string; rawResponse: any }>;
}
