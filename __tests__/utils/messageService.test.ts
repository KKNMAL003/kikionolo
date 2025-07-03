import { messageApiService } from '../../services/messages/MessageApiService';
import { messageCacheService } from '../../services/messages/MessageCacheService';
import { messageRealtimeService } from '../../services/messages/MessageRealtimeService';
import type { Message } from '../../services/interfaces/IMessageService';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: '1', user_id: 'u1', customer_id: 'c1', log_type: 'user_message', subject: 'Test', message: 'Hello', sender_type: 'customer', is_read: false, created_at: new Date().toISOString() }, error: null }),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      head: jest.fn().mockReturnThis(),
    }) ),
  },
}));

describe('MessageApiService', () => {
  it('should send a message (mocked)', async () => {
    const result = await messageApiService.sendMessage({ userId: 'u1', subject: 'Test', message: 'Hello', senderType: 'customer', logType: 'user_message' });
    expect(result).toHaveProperty('id');
    expect(result.subject).toBe('Test');
  });
  it('should get messages (mocked)', async () => {
    const result = await messageApiService.getMessages('u1');
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('MessageCacheService', () => {
  const msg: Message = { id: '1', userId: 'u1', customerId: 'c1', logType: 'user_message', subject: 'Test', message: 'Hello', senderType: 'customer', isRead: false, createdAt: new Date().toISOString(), _clientKey: '1', status: 'sent', isOptimistic: false, timestamp: Date.now(), updatedAt: new Date().toISOString(), senderId: 'u1', recipientId: 'c1' };
  it('should set and get a message', () => {
    messageCacheService.set(msg.id, msg);
    expect(messageCacheService.get(msg.id)).toEqual(msg);
  });
  it('should remove a message', () => {
    messageCacheService.remove(msg.id);
    expect(messageCacheService.get(msg.id)).toBeUndefined();
  });
  it('should clear all messages', () => {
    messageCacheService.set(msg.id, msg);
    messageCacheService.clear();
    expect(messageCacheService.getAll()).toEqual([]);
  });
});

describe('MessageRealtimeService', () => {
  it('should register and emit message received', () => {
    const handler = jest.fn();
    messageRealtimeService.onMessageReceived(handler);
    messageRealtimeService.emitMessageReceived({ id: '1' } as any);
    expect(handler).toHaveBeenCalled();
    messageRealtimeService.clearAll();
  });
  it('should register and emit message updated', () => {
    const handler = jest.fn();
    messageRealtimeService.onMessageUpdated(handler);
    messageRealtimeService.emitMessageUpdated('1', { isRead: true });
    expect(handler).toHaveBeenCalledWith('1', { isRead: true });
    messageRealtimeService.clearAll();
  });
  it('should register and emit unread count changed', () => {
    const handler = jest.fn();
    messageRealtimeService.onUnreadCountChanged(handler);
    messageRealtimeService.emitUnreadCountChanged(5);
    expect(handler).toHaveBeenCalledWith(5);
    messageRealtimeService.clearAll();
  });
}); 