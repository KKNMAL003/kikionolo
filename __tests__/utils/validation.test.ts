import { MessageSchema, CreateOrderSchema, CreateMessageSchema, LoginSchema, addressSchema, phoneSchema, emailSchema } from '../../validation/schemas';
import React from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { render } from '@testing-library/react-native';

describe('Zod Validation Schemas', () => {
  it('validates a correct message', () => {
    const valid = {
      id: '1',
      user_id: 'u1',
      customer_id: 'c1',
      log_type: 'user_message',
      subject: 'Hello',
      message: 'Test message',
      sender_type: 'customer',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    expect(() => MessageSchema.parse(valid)).not.toThrow();
  });

  it('rejects an invalid message', () => {
    const invalid = {
      id: '',
      user_id: '',
      customer_id: '',
      log_type: 'invalid_type',
      subject: '',
      message: '',
      sender_type: 'unknown',
      is_read: 'no',
      created_at: 'not-a-date',
    };
    expect(() => MessageSchema.parse(invalid)).toThrow();
  });

  it('validates a correct order', () => {
    const valid = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '0123456789',
      deliveryAddress: '123 Main St, City',
      paymentMethod: 'cash_on_delivery',
      totalAmount: 100,
      items: [
        { productId: 'p1', productName: 'Gas', quantity: 1, price: 100 },
      ],
    };
    expect(() => CreateOrderSchema.parse(valid)).not.toThrow();
  });

  it('rejects an order with missing items', () => {
    const invalid = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '0123456789',
      deliveryAddress: '123 Main St, City',
      paymentMethod: 'cash_on_delivery',
      totalAmount: 100,
      items: [],
    };
    expect(() => CreateOrderSchema.parse(invalid)).toThrow();
  });

  it('validates a correct message creation', () => {
    const valid = {
      userId: 'u1',
      subject: 'Test',
      message: 'Hello',
      logType: 'user_message',
      senderType: 'customer',
    };
    expect(() => CreateMessageSchema.parse(valid)).not.toThrow();
  });

  it('rejects an invalid message creation', () => {
    const invalid = {
      userId: '',
      subject: '',
      message: '',
      logType: 'invalid',
      senderType: 'unknown',
    };
    expect(() => CreateMessageSchema.parse(invalid)).toThrow();
  });

  it('validates a correct login', () => {
    const valid = {
      email: 'test@example.com',
      password: 'password123',
    };
    expect(() => LoginSchema.parse(valid)).not.toThrow();
  });

  it('rejects an invalid login', () => {
    const invalid = {
      email: 'not-an-email',
      password: '123',
    };
    expect(() => LoginSchema.parse(invalid)).toThrow();
  });
});

describe('Edge Case Validation', () => {
  it('validates a correct address', () => {
    expect(() => addressSchema.parse('123 Main St, City')).not.toThrow();
  });
  it('rejects an invalid address', () => {
    expect(() => addressSchema.parse('Short')).toThrow();
  });
  it('validates a correct phone', () => {
    expect(() => phoneSchema.parse('0123456789')).not.toThrow();
  });
  it('rejects an invalid phone', () => {
    expect(() => phoneSchema.parse('123')).toThrow();
  });
  it('validates a correct email', () => {
    expect(() => emailSchema.parse('test@example.com')).not.toThrow();
  });
  it('rejects an invalid email', () => {
    expect(() => emailSchema.parse('not-an-email')).toThrow();
  });
  it('renders ErrorBoundary fallback on error', () => {
    const Thrower = () => { throw new Error('Test error'); };
    const { getByText } = render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(getByText('Something went wrong.')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
  });
}); 