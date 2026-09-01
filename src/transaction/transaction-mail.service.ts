import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionDocument } from './schemas/transaction.schema';
import { PaymentOrderDocument } from './schemas/payment-order.schema';

const nodemailer = require('nodemailer');

/**
 * Notification boundary for transaction workflows. AdminService should call
 * sendCompletedTransactionToUser after it completes a pending transaction.
 */
@Injectable()
export class TransactionMailService {
  private readonly logger = new Logger(TransactionMailService.name);

  constructor(private readonly configService: ConfigService) {}

  private get adminEmail() { return this.configService.get<string>('ADMIN_EMAIL') || this.configService.get<string>('OWNER_EMAIL'); }

  private async send(to: string, subject: string, text: string) {
    const host = this.configService.get<string>('EMAIL_HOST');
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');
    if (!host || !user || !pass) {
      this.logger.warn(`SMTP is not configured; skipped transaction email: ${subject}`);
      return false;
    }
    try {
      const port = this.configService.get<number>('EMAIL_PORT', 587);
      await nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      }).sendMail({ from: user, to, subject, text });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send transaction email: ${subject}`, error instanceof Error ? error.stack : undefined);
      return false;
    }
  }

  async sendPendingTransactionToAdmin(transaction: TransactionDocument) {
    if (!this.adminEmail) {
      this.logger.warn('ADMIN_EMAIL or OWNER_EMAIL is not configured; skipped pending transaction email');
      return false;
    }
    return this.send(
      this.adminEmail,
      `Pending ${transaction.type} transaction: ${transaction.transactionID}`,
      `A ${transaction.type} transaction is awaiting review.\n\nTransaction: ${transaction.transactionID}\nUser: ${transaction.email}\nAmount: ${transaction.amount} ${transaction.currency}\nReference: ${transaction.reference || 'N/A'}`,
    );
  }

  async sendCompletedTransactionToUser(transaction: TransactionDocument) {
    return this.send(
      transaction.email,
      `Your ${transaction.type} transaction is complete`,
      `Your ${transaction.type} transaction has been completed.\n\nTransaction: ${transaction.transactionID}\nAmount: ${transaction.amount} ${transaction.currency}\nStatus: ${transaction.status}`,
    );
  }

  async sendOrderActivityToAdmin(order: PaymentOrderDocument, activity: string) {
    if (!this.adminEmail) {
      this.logger.warn('ADMIN_EMAIL or OWNER_EMAIL is not configured; skipped order email');
      return false;
    }
    return this.send(this.adminEmail, `${order.type} order ${activity}: ${order.orderID}`,
      `A ${order.type} order has been ${activity}.\n\nOrder: ${order.orderID}\nUser: ${order.email}\nAmount: ${order.amount} USD\nMethod: ${order.method}\nStatus: ${order.status}`);
  }

  async sendOrderActivityToUser(order: PaymentOrderDocument, activity: string) {
    return this.send(order.email, `Your ${order.type} order is ${activity}`,
      `Your ${order.type} order has been ${activity}.\n\nOrder: ${order.orderID}\nAmount: ${order.amount} USD\nMethod: ${order.method}\nStatus: ${order.status}${order.methodDetails ? `\nMethod details: ${order.methodDetails}` : ''}`);
  }
}
